/*
 * 예시(샘플) 데이터
 * 이 파일의 모든 수치는 화면 구성을 보여주기 위한 가상의 값이며 실제 시세가 아닙니다.
 * 실제 데이터로 바꾸려면 이 객체의 값만 교체하면 됩니다.
 */
const MARKET_DATA = {
  asOf: "2026-11-13 15:30 기준 (예시)",

  indices: [
    { key: "KOSPI", name: "코스피", value: 2985.42, change: 23.17, rate: 0.78 },
    { key: "KOSDAQ", name: "코스닥", value: 862.15, change: -4.08, rate: -0.47 },
    { key: "KOSPI200", name: "코스피200", value: 402.36, change: 3.51, rate: 0.88 },
    { key: "USDKRW", name: "원/달러 환율", value: 1372.5, change: -5.3, rate: -0.38, unit: "원" }
  ],

  // 최근 거래일 종가 (예시) - 오래된 날짜부터
  history: {
    KOSPI: [
      2891.2, 2903.8, 2897.1, 2912.6, 2925.4, 2918.0, 2930.7, 2944.1, 2937.5, 2921.3,
      2909.8, 2915.2, 2933.6, 2948.9, 2956.3, 2949.0, 2940.4, 2952.8, 2962.25, 2985.42
    ],
    KOSDAQ: [
      851.4, 856.9, 860.2, 858.7, 864.1, 869.5, 872.3, 868.0, 863.4, 859.9,
      855.2, 857.8, 861.6, 866.4, 870.9, 873.2, 869.7, 867.5, 866.23, 862.15
    ]
  },

  // 업종별 등락률 (%, 예시)
  sectors: {
    KOSPI: [
      { name: "반도체", rate: 2.14 }, { name: "2차전지", rate: -1.32 },
      { name: "자동차", rate: 0.86 }, { name: "금융", rate: 0.41 },
      { name: "바이오", rate: -0.58 }, { name: "조선", rate: 1.73 },
      { name: "화학", rate: -0.22 }, { name: "인터넷", rate: 0.12 },
      { name: "철강", rate: -0.94 }, { name: "건설", rate: 0.03 },
      { name: "유통", rate: -0.37 }, { name: "통신", rate: 0.29 }
    ],
    KOSDAQ: [
      { name: "반도체장비", rate: 1.21 }, { name: "2차전지소재", rate: -2.05 },
      { name: "바이오", rate: -0.83 }, { name: "게임", rate: 0.64 },
      { name: "엔터", rate: -0.41 }, { name: "IT부품", rate: 0.37 },
      { name: "의료기기", rate: 0.18 }, { name: "로봇", rate: 1.46 },
      { name: "소프트웨어", rate: -0.12 }, { name: "화장품", rate: 0.95 },
      { name: "디스플레이", rate: -0.66 }, { name: "통신장비", rate: 0.07 }
    ]
  },

  // 투자자별 순매수 (억 원, 예시)
  investors: {
    KOSPI: [
      { name: "개인", amount: -4120 },
      { name: "외국인", amount: 3580 },
      { name: "기관", amount: 610 }
    ],
    KOSDAQ: [
      { name: "개인", amount: 920 },
      { name: "외국인", amount: -540 },
      { name: "기관", amount: -310 }
    ]
  },

  // 거래 요약 (예시)
  summary: {
    KOSPI: { volume: "3억 8,214만 주", amount: "10조 4,520억 원", rising: 512, falling: 348, unchanged: 81 },
    KOSDAQ: { volume: "9억 1,067만 주", amount: "7조 2,180억 원", rising: 694, falling: 911, unchanged: 112 }
  },

  // 해외 지표 (예시)
  global: [
    { name: "다우존스", value: 43812.6, rate: 0.35 },
    { name: "나스닥", value: 19422.8, rate: 0.91 },
    { name: "S&P 500", value: 5986.3, rate: 0.52 },
    { name: "닛케이225", value: 38950.1, rate: -0.21 },
    { name: "WTI (달러/배럴)", value: 71.84, rate: -1.12 },
    { name: "금 (달러/온스)", value: 2648.4, rate: 0.27 }
  ],

  // 오늘의 이슈 (예시 문장)
  issues: [
    {
      tag: "반도체",
      title: "반도체 대형주 강세가 지수 상승 견인",
      body: "메모리 업황 개선 기대가 이어지며 반도체 업종이 2%대 오르고 코스피 상승을 이끌었습니다."
    },
    {
      tag: "수급",
      title: "외국인 사흘째 순매수",
      body: "외국인이 유가증권시장에서 3,500억 원대 순매수를 기록하며 대형주 중심으로 매수세를 보였습니다."
    },
    {
      tag: "환율",
      title: "원/달러 환율 1,370원대로 하락",
      body: "달러 약세 흐름 속에 환율이 하락하면서 외국인 수급에 우호적인 환경이 형성됐습니다."
    }
  ]
};
