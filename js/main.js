/* 공통 스크립트: 내비게이션, 장 운영 상태, 각 페이지 렌더링 */
(function () {
  "use strict";

  const D = MARKET_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- 포맷 도우미 ---------- */
  const fmt = (n, digits = 2) =>
    n.toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dirClass = (n) => (n > 0 ? "up" : n < 0 ? "down" : "flat");
  const arrow = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "−");
  const signed = (n, digits = 2) => (n > 0 ? "+" : "") + fmt(n, digits);
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* ---------- 모바일 메뉴 ---------- */
  const toggle = $(".nav-toggle");
  const navList = $(".nav-list");
  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const open = navList.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------- 한국 시간(KST) 기준 장 운영 상태 ---------- */
  // 공휴일은 반영하지 않으며, 주말과 연말 휴장일(12/31)만 처리합니다.
  const SESSIONS = [
    { from: 8 * 60 + 30, to: 9 * 60, label: "장 시작 동시호가", cls: "auction" },
    { from: 9 * 60, to: 15 * 60 + 20, label: "정규장 운영 중", cls: "open" },
    { from: 15 * 60 + 20, to: 15 * 60 + 30, label: "장 마감 동시호가", cls: "auction" },
    { from: 15 * 60 + 40, to: 16 * 60, label: "장후 시간외 종가", cls: "auction" },
    { from: 16 * 60, to: 18 * 60, label: "시간외 단일가", cls: "auction" }
  ];

  function kstNow() {
    const d = new Date(Date.now() + 9 * 3600 * 1000);
    return {
      y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, day: d.getUTCDate(),
      dow: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds()
    };
  }

  function marketStatus(t) {
    const pad = (n) => String(n).padStart(2, "0");
    const clock = `${t.y}.${pad(t.mo)}.${pad(t.day)} ${pad(t.h)}:${pad(t.mi)}:${pad(t.s)} KST`;
    const weekend = t.dow === 0 || t.dow === 6;
    const yearEnd = t.mo === 12 && t.day === 31;
    if (weekend || yearEnd) {
      return { label: "휴장일", cls: "", clock, meta: weekend ? "주말에는 거래가 없습니다." : "연말 휴장일입니다." };
    }
    const m = t.h * 60 + t.mi;
    const sec = m * 60 + t.s;
    const session = SESSIONS.find((s) => m >= s.from && m < s.to);
    const until = (target) => {
      const left = target * 60 - sec;
      const h = Math.floor(left / 3600);
      const mm = Math.floor((left % 3600) / 60);
      return h > 0 ? `${h}시간 ${mm}분` : `${mm}분 ${left % 60}초`;
    };
    if (session && session.cls === "open") {
      return { label: session.label, cls: "open", clock, meta: `정규장 마감까지 ${until(15 * 60 + 30)}` };
    }
    if (session) return { label: session.label, cls: session.cls, clock, meta: "" };
    if (m < 8 * 60 + 30) return { label: "장 시작 전", cls: "", clock, meta: `정규장 개장까지 ${until(9 * 60)}` };
    return { label: "장 마감", cls: "", clock, meta: "다음 거래일 09:00에 개장합니다." };
  }

  function updateStatus() {
    const st = marketStatus(kstNow());
    const pill = $("#market-pill");
    if (!pill) return;
    pill.textContent = st.label;
    pill.className = "status-pill " + st.cls;
    $("#market-clock").textContent = st.clock;
    $("#market-meta").textContent = st.meta;
    highlightTimeline();
  }

  // 가이드 페이지: 현재 시간대 강조
  function highlightTimeline() {
    const t = kstNow();
    const m = t.h * 60 + t.mi;
    const weekday = t.dow !== 0 && t.dow !== 6;
    $$(".timeline li[data-from]").forEach((li) => {
      const on = weekday && m >= +li.dataset.from && m < +li.dataset.to;
      li.classList.toggle("now", on);
    });
  }

  updateStatus();
  setInterval(updateStatus, 1000);

  /* ---------- 캔버스 공통 ---------- */
  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }

  function drawSparkline(canvas, series) {
    const { ctx, w, h } = setupCanvas(canvas);
    const min = Math.min(...series);
    const max = Math.max(...series);
    const color = cssVar(series[series.length - 1] >= series[0] ? "--up" : "--down");
    const x = (i) => (i / (series.length - 1)) * (w - 4) + 2;
    const y = (v) => h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
    ctx.beginPath();
    series.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  // 최근 N 거래일 날짜(주말 제외)를 기준일로부터 역산
  function tradingDates(n, endISO) {
    const out = [];
    const d = new Date(endISO + "T00:00:00Z");
    while (out.length < n) {
      const dow = d.getUTCDay();
      if (dow !== 0 && dow !== 6) out.unshift(`${d.getUTCMonth() + 1}/${d.getUTCDate()}`);
      d.setUTCDate(d.getUTCDate() - 1);
    }
    return out;
  }

  /* ---------- 홈: 지수 카드 ---------- */
  function renderIndexCards() {
    const wrap = $("#index-cards");
    if (!wrap) return;
    wrap.innerHTML = D.indices
      .map((ix) => {
        const c = dirClass(ix.change);
        const digits = ix.unit ? 1 : 2;
        return `
        <article class="card index-card">
          <div class="label">${ix.name}</div>
          <div class="value num">${fmt(ix.value, digits)}${ix.unit ? `<small> ${ix.unit}</small>` : ""}</div>
          <div class="change num ${c}">${arrow(ix.change)} ${fmt(Math.abs(ix.change), digits)} (${signed(ix.rate)}%)</div>
          ${D.history[ix.key] ? `<canvas data-spark="${ix.key}" aria-hidden="true"></canvas>` : ""}
        </article>`;
      })
      .join("");
    drawSparks();
  }
  function drawSparks() {
    $$("canvas[data-spark]").forEach((c) => drawSparkline(c, D.history[c.dataset.spark]));
  }

  /* ---------- 홈: 이슈 / 해외 지표 ---------- */
  function renderIssues() {
    const wrap = $("#issue-cards");
    if (!wrap) return;
    wrap.innerHTML = D.issues
      .map((it) => `
        <article class="card issue-card">
          <span class="tag">${it.tag}</span>
          <h3>${it.title}</h3>
          <p>${it.body}</p>
        </article>`)
      .join("");
  }

  function renderGlobal() {
    const body = $("#global-body");
    if (!body) return;
    body.innerHTML = D.global
      .map((g) => `
        <tr>
          <td>${g.name}</td>
          <td class="num">${fmt(g.value)}</td>
          <td class="num ${dirClass(g.rate)}">${arrow(g.rate)} ${signed(g.rate)}%</td>
        </tr>`)
      .join("");
  }

  /* ---------- 시황 페이지 ---------- */
  let currentMarket = "KOSPI";
  let chartState = null;

  function drawMainChart() {
    const canvas = $("#main-chart");
    if (!canvas) return;
    const series = D.history[currentMarket];
    const dates = tradingDates(series.length, "2026-11-13");
    const { ctx, w, h } = setupCanvas(canvas);
    const pad = { l: 56, r: 16, t: 12, b: 28 };
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const lo = min - span * 0.1;
    const hi = max + span * 0.1;
    const x = (i) => pad.l + (i / (series.length - 1)) * (w - pad.l - pad.r);
    const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (h - pad.t - pad.b);
    const up = series[series.length - 1] >= series[0];
    const color = cssVar(up ? "--up" : "--down");
    const muted = cssVar("--text-muted");
    const grid = cssVar("--border");

    // 격자 & y축 눈금
    ctx.font = "11px sans-serif";
    ctx.fillStyle = muted;
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const v = lo + ((hi - lo) * i) / 4;
      const yy = Math.round(y(v)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(pad.l, yy);
      ctx.lineTo(w - pad.r, yy);
      ctx.stroke();
      ctx.fillText(fmt(v, 0), pad.l - 8, yy);
    }
    // x축 날짜
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const step = w < 500 ? 6 : 3;
    const lastIdx = dates.length - 1;
    dates.forEach((d, i) => {
      if (i === lastIdx) {
        ctx.textAlign = "right";
        ctx.fillText(d, x(i), h - pad.b + 8);
      } else if (i % step === 0 && lastIdx - i >= step / 2) {
        ctx.fillText(d, x(i), h - pad.b + 8);
      }
    });

    // 영역 채우기
    const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    grad.addColorStop(0, color + "40");
    grad.addColorStop(1, color + "00");
    ctx.beginPath();
    series.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.lineTo(x(series.length - 1), h - pad.b);
    ctx.lineTo(x(0), h - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 선
    ctx.beginPath();
    series.forEach((v, i) => (i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v))));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.stroke();

    chartState = { series, dates, x, y, pad, w, h, color };

    // 요약 수치
    const first = series[0];
    const last = series[series.length - 1];
    const r = ((last - first) / first) * 100;
    $("#chart-stats").innerHTML = `
      <div><span>기간 고점</span><strong class="num">${fmt(max)}</strong></div>
      <div><span>기간 저점</span><strong class="num">${fmt(min)}</strong></div>
      <div><span>기간 등락률</span><strong class="num ${dirClass(r)}">${signed(r)}%</strong></div>`;
  }

  function bindChartHover() {
    const canvas = $("#main-chart");
    const tip = $("#chart-tip");
    if (!canvas || !tip) return;
    const hide = () => { tip.style.display = "none"; drawMainChart(); };
    canvas.addEventListener("mousemove", (e) => {
      if (!chartState) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const { series, dates, x, y, pad, h, color } = chartState;
      const ratio = (mx - pad.l) / (rect.width - pad.l - pad.r);
      const i = Math.max(0, Math.min(series.length - 1, Math.round(ratio * (series.length - 1))));
      drawMainChart();
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = cssVar("--text-muted");
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x(i), pad.t);
      ctx.lineTo(x(i), h - pad.b);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x(i), y(series[i]), 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      const prev = i > 0 ? series[i - 1] : series[i];
      const ch = ((series[i] - prev) / prev) * 100;
      tip.innerHTML = `${dates[i]} · <b>${fmt(series[i])}</b> (${signed(ch)}%)`;
      tip.style.display = "block";
      tip.style.left = x(i) + "px";
      tip.style.top = y(series[i]) + "px";
    });
    canvas.addEventListener("mouseleave", hide);
  }

  function heatStyle(rate) {
    const a = 0.15 + 0.75 * Math.min(Math.abs(rate) / 2.5, 1);
    const rgb = rate >= 0 ? "214, 40, 59" : "29, 95, 214";
    const ink = a > 0.5 ? "#fff" : "var(--text)";
    return `background: rgba(${rgb}, ${a.toFixed(2)}); color: ${ink};`;
  }

  function renderSectors() {
    const wrap = $("#heatmap");
    if (!wrap) return;
    const list = [...D.sectors[currentMarket]].sort((a, b) => b.rate - a.rate);
    wrap.innerHTML = list
      .map((s) => `
        <div class="heat-cell" style="${heatStyle(s.rate)}">
          <span class="name">${s.name}</span>
          <span class="pct num">${signed(s.rate)}%</span>
        </div>`)
      .join("");
  }

  function renderInvestors() {
    const wrap = $("#flows");
    if (!wrap) return;
    const list = D.investors[currentMarket];
    const maxAbs = Math.max(...list.map((v) => Math.abs(v.amount)));
    wrap.innerHTML = list
      .map((v) => {
        const pct = (Math.abs(v.amount) / maxAbs) * 50;
        const pos = v.amount >= 0;
        const style = pos
          ? `left:50%; width:${pct}%; background: var(--up);`
          : `right:50%; width:${pct}%; background: var(--down);`;
        return `
          <div class="flow-row">
            <strong>${v.name}</strong>
            <div class="flow-track"><div class="flow-bar" style="${style}"></div></div>
            <span class="flow-val num ${dirClass(v.amount)}">${v.amount > 0 ? "+" : ""}${v.amount.toLocaleString("ko-KR")}억</span>
          </div>`;
      })
      .join("");
  }

  function renderSummary() {
    const body = $("#summary-body");
    if (!body) return;
    const s = D.summary[currentMarket];
    const ix = D.indices.find((i) => i.key === currentMarket);
    body.innerHTML = `
      <tr><td>종가</td><td class="num">${fmt(ix.value)}</td></tr>
      <tr><td>전일 대비</td><td class="num ${dirClass(ix.change)}">${arrow(ix.change)} ${fmt(Math.abs(ix.change))} (${signed(ix.rate)}%)</td></tr>
      <tr><td>거래량</td><td class="num">${s.volume}</td></tr>
      <tr><td>거래대금</td><td class="num">${s.amount}</td></tr>
      <tr><td>상승 / 하락 / 보합</td><td class="num"><span class="up">${s.rising}</span> / <span class="down">${s.falling}</span> / ${s.unchanged}</td></tr>`;
  }

  function renderMarketPage() {
    $$(".market-name").forEach((el) => (el.textContent = currentMarket === "KOSPI" ? "코스피" : "코스닥"));
    drawMainChart();
    renderSectors();
    renderInvestors();
    renderSummary();
  }

  function bindTabs() {
    const tabs = $$(".tab[data-market]");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        currentMarket = tab.dataset.market;
        tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
        renderMarketPage();
      })
    );
  }

  /* ---------- 가이드: 용어 검색 ---------- */
  function bindGlossary() {
    const input = $("#term-search");
    if (!input) return;
    const terms = $$(".term");
    const empty = $("#term-empty");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      terms.forEach((t) => {
        const hit = !q || t.textContent.toLowerCase().includes(q);
        t.style.display = hit ? "" : "none";
        if (hit) shown++;
      });
      empty.style.display = shown ? "none" : "block";
    });
  }

  /* ---------- 공통: 기준 시각 표시 ---------- */
  $$("[data-asof]").forEach((el) => (el.textContent = D.asOf));

  /* ---------- 초기화 ---------- */
  renderIndexCards();
  renderIssues();
  renderGlobal();
  if ($("#main-chart")) {
    bindTabs();
    bindChartHover();
    renderMarketPage();
  }
  bindGlossary();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      drawSparks();
      drawMainChart();
    }, 120);
  });
  // 다크/라이트 모드 전환 시 캔버스 색 다시 그리기
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    drawSparks();
    drawMainChart();
  });
})();
