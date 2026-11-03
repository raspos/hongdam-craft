import { CompanyScaleId, ExecTraitId, IndustryId } from '../types/game';

export interface CompanyScaleDef {
  id: CompanyScaleId;
  nameKo: string;
  nameEn: string;
  initialXp: number;
  pressInterestKo: string;
  pressInterestEn: string;
  crisisImpactKo: string;
  crisisImpactEn: string;
  xpCostMultiplier: number;
  pressureMultiplier: number;
  reputationSensitivity: number;
  stageRewardXp: number;
  descKo: string;
  descEn: string;
}

export const COMPANY_SCALES: Record<CompanyScaleId, CompanyScaleDef> = {
  startup: {
    id: 'startup',
    nameKo: '스타트업',
    nameEn: 'Startup',
    initialXp: 100,
    pressInterestKo: '낮음',
    pressInterestEn: 'Low',
    crisisImpactKo: '낮음',
    crisisImpactEn: 'Low',
    xpCostMultiplier: 0.45,
    pressureMultiplier: 0.85,
    reputationSensitivity: 0.85,
    stageRewardXp: 38,
    descKo: '예산은 빠듯하지만 의사결정이 빠르고 진정성 있는 팩트·개선 대응의 효율이 높습니다.',
    descEn: 'Tight PR budget, but agile decisions make sincere fact-checking and quick fixes highly cost-effective.',
  },
  sme: {
    id: 'sme',
    nameKo: '중소기업',
    nameEn: 'SME',
    initialXp: 200,
    pressInterestKo: '보통 이하',
    pressInterestEn: 'Below Average',
    crisisImpactKo: '보통',
    crisisImpactEn: 'Medium',
    xpCostMultiplier: 0.7,
    pressureMultiplier: 0.92,
    reputationSensitivity: 0.95,
    stageRewardXp: 65,
    descKo: '한정된 홍보비로 실속 있는 언론 관계와 내부 검증을 병행해야 하는 실전형 기업입니다.',
    descEn: 'Moderate resources requiring a practical mix of press rapport and internal verification.',
  },
  midsize: {
    id: 'midsize',
    nameKo: '중견기업',
    nameEn: 'Mid-Sized Enterprise',
    initialXp: 350,
    pressInterestKo: '보통',
    pressInterestEn: 'Medium',
    crisisImpactKo: '보통',
    crisisImpactEn: 'Medium',
    xpCostMultiplier: 1.0,
    pressureMultiplier: 1.0,
    reputationSensitivity: 1.0,
    stageRewardXp: 105,
    descKo: '출입기자단의 본격적인 감시가 시작되며 예산과 조직 동원의 균형이 중요합니다.',
    descEn: 'Full beat-reporter scrutiny begins; balancing budget and organizational mobilization is key.',
  },
  large: {
    id: 'large',
    nameKo: '대기업',
    nameEn: 'Large Corporation',
    initialXp: 600,
    pressInterestKo: '높음',
    pressInterestEn: 'High',
    crisisImpactKo: '높음',
    crisisImpactEn: 'High',
    xpCostMultiplier: 1.35,
    pressureMultiplier: 1.12,
    reputationSensitivity: 1.15,
    stageRewardXp: 155,
    descKo: '홍보예산은 넉넉하나 작은 실수도 1면 톱기사로 번지며 대응 단가가 높습니다.',
    descEn: 'Generous PR budget, yet minor missteps escalate to front-page headlines and response costs run high.',
  },
  chaebol: {
    id: 'chaebol',
    nameKo: '재벌그룹',
    nameEn: 'Chaebol Conglomerate',
    initialXp: 1000,
    pressInterestKo: '매우 높음',
    pressInterestEn: 'Very High',
    crisisImpactKo: '매우 높음',
    crisisImpactEn: 'Very High',
    xpCostMultiplier: 1.65,
    pressureMultiplier: 1.24,
    reputationSensitivity: 1.28,
    stageRewardXp: 230,
    descKo: '막대한 그룹 예산을 쥐고 있지만 전 국민적 관심과 오너 리스크, 고비용 역풍이 상시 도사립니다.',
    descEn: 'Massive conglomerate budget, matched by relentless national scrutiny, high costs, and severe owner risk.',
  },
};

export const COMPANY_SCALE_LIST: CompanyScaleDef[] = Object.values(COMPANY_SCALES);

export interface IndustryDef {
  id: IndustryId;
  nameKo: string;
  nameEn: string;
  icon: string;
  stage1IssueKo: string;
  stage1IssueEn: string;
}

export const INDUSTRIES: Record<IndustryId, IndustryDef> = {
  finance: {
    id: 'finance',
    nameKo: '금융',
    nameEn: 'Finance & Banking',
    icon: '🏦',
    stage1IssueKo: '모바일 뱅킹 앱 먹통·이체 지연에 고객 불만 폭주',
    stage1IssueEn: 'Mobile banking outage sparks flood of customer complaints',
  },
  semiconductor: {
    id: 'semiconductor',
    nameKo: '반도체',
    nameEn: 'Semiconductor',
    icon: '💾',
    stage1IssueKo: '차세대 칩셋 발열·수율 논란…납품 차질 우려',
    stage1IssueEn: 'Next-gen chip overheating & yield rumors raise supply concerns',
  },
  automotive: {
    id: 'automotive',
    nameKo: '자동차',
    nameEn: 'Automotive',
    icon: '🚗',
    stage1IssueKo: '신형 전기차 주행 중 경고등 점등…차주들 리콜 요구',
    stage1IssueEn: 'New EV dashboard warning lights trigger owner recall demands',
  },
  construction: {
    id: 'construction',
    nameKo: '건설',
    nameEn: 'Construction',
    icon: '🏗️',
    stage1IssueKo: '신축 아파트 입주 직전 누수·하자 논란 확산',
    stage1IssueEn: 'Pre-move-in water leaks and defects hit newly built apartment complex',
  },
  retail: {
    id: 'retail',
    nameKo: '유통',
    nameEn: 'Retail & E-Commerce',
    icon: '🛒',
    stage1IssueKo: '새벽배송 신선식품 변질 제보…환불 지연 도마 위',
    stage1IssueEn: 'Spoiled dawn-delivery groceries & slow refunds draw consumer ire',
  },
  food: {
    id: 'food',
    nameKo: '식품',
    nameEn: 'Food & Beverage',
    icon: '🍜',
    stage1IssueKo: '인기 간편식 이물질 혼입 주장…식약처 조사 촉구',
    stage1IssueEn: 'Foreign substance claim in hit meal-kit prompts safety probe calls',
  },
  platform: {
    id: 'platform',
    nameKo: '플랫폼',
    nameEn: 'IT Platform',
    icon: '📱',
    stage1IssueKo: '구독 요금 기습 개편·다크패턴 논란에 이용자 반발',
    stage1IssueEn: 'Sudden fee hike & dark-pattern UI spark user backlash',
  },
  gaming: {
    id: 'gaming',
    nameKo: '게임',
    nameEn: 'Gaming',
    icon: '🎮',
    stage1IssueKo: '신작 아이템 확률 표기 오류 논란…유저 트럭 시위 예고',
    stage1IssueEn: 'Gacha drop-rate display error sparks player protest truck threat',
  },
  bio: {
    id: 'bio',
    nameKo: '바이오',
    nameEn: 'Bio & Pharma',
    icon: '🧬',
    stage1IssueKo: '건강기능식품 효능 과장 마케팅 논란…소비자원 민원 급증',
    stage1IssueEn: 'Exaggerated supplement efficacy claims trigger consumer watchdog complaints',
  },
  entertainment: {
    id: 'entertainment',
    nameKo: '엔터테인먼트',
    nameEn: 'Entertainment',
    icon: '🎤',
    stage1IssueKo: '콘서트 고가 굿즈 불량·환불 거부 논란에 팬덤 분노',
    stage1IssueEn: 'Defective concert merch & refund refusals ignite fandom outrage',
  },
  telecom: {
    id: 'telecom',
    nameKo: '통신',
    nameEn: 'Telecom',
    icon: '📡',
    stage1IssueKo: '점심시간 5G 통신 장애 발생…자영업자 결제 마비 분통',
    stage1IssueEn: 'Lunchtime 5G outage freezes merchant payment terminals',
  },
  defense: {
    id: 'defense',
    nameKo: '방산',
    nameEn: 'Defense & Aerospace',
    icon: '🛡️',
    stage1IssueKo: '차세대 전술장비 시험평가 부품 결함설 보도 예고',
    stage1IssueEn: 'Field-test component defect allegations surface on tactical gear',
  },
};

export const INDUSTRY_LIST: IndustryDef[] = Object.values(INDUSTRIES);

export interface ExecTraitDef {
  id: ExecTraitId;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
}

export const EXEC_TRAITS: Record<ExecTraitId, ExecTraitDef> = {
  data_driven: {
    id: 'data_driven',
    nameKo: '데이터 신봉 경영진',
    nameEn: 'Data-Obsessed C-Suite',
    descKo: '숫자와 팩트 검증 보고서를 선호하며 공시·팩트체크 효율이 +15% 상승합니다.',
    descEn: 'Loves hard numbers; fact-checking and disclosure audits gain +15% effectiveness.',
  },
  owner_centric: {
    id: 'owner_centric',
    nameKo: '오너 직할 체제',
    nameEn: 'Owner-Centric Command',
    descKo: '위기 시 최고위층 지원 예산은 크지만 오너 관련 이슈에서 초기 압박이 높습니다.',
    descEn: 'Generous emergency top-down funding, but higher initial pressure on executive scandals.',
  },
  legal_first: {
    id: 'legal_first',
    nameKo: '법무 우선주의',
    nameEn: 'Legal-First Culture',
    descKo: '법무팀 동원 비용이 절감되지만 사과 결정 시 내부 설득 체력 소모가 조금 더 듭니다.',
    descEn: 'Lower Legal Team cost, though issuing official apologies takes extra internal stamina.',
  },
  transparent_pledge: {
    id: 'transparent_pledge',
    nameKo: 'ESG·투명경영 표방',
    nameEn: 'ESG Transparency Pledge',
    descKo: '정정·개선·사과 시 평판 회복량이 크지만, 은폐·로비 적발 시 역풍이 1.3배 강해집니다.',
    descEn: 'Higher reputation gain from honest reforms, but 1.3x harsher backlash if caught lobbying.',
  },
  growth_obsessed: {
    id: 'growth_obsessed',
    nameKo: '초고속 성과주의',
    nameEn: 'Hyper-Growth Driven',
    descKo: '스테이지 클리어 시 추가 예산 보너스가 높으나 기본 피로도 관리가 중요합니다.',
    descEn: 'Higher stage clear XP bonuses, while demanding careful stamina management.',
  },
  succession_era: {
    id: 'succession_era',
    nameKo: '세대교체·승계 전환기',
    nameEn: 'Succession Transition Era',
    descKo: '내부 제보 변수가 잦지만 위기관리 컨설팅 및 TF 소집 효과가 뛰어납니다.',
    descEn: 'Frequent internal leaks, offset by stronger Crisis TF and Consultant effectiveness.',
  },
};

export const EXEC_TRAIT_LIST: ExecTraitDef[] = Object.values(EXEC_TRAITS);

const KNOWN_CORP_KEYWORDS = [
  '삼성', '현대', '엘지', '에스케이', '롯데', '포스코', '한화', '신세계', '카카오', '네이버', '쿠팡', '두산', '효성', '씨제이',
  '대한항공', '아시아나', '케이티', '유플러스', '셀트리온', '하이브', '크래프톤', '엔씨', '넥슨', '넷마블', '배민', '토스',
  'samsung', 'hyundai', 'lg', 'sk', 'lotte', 'posco', 'hanwha', 'kakao', 'naver', 'coupang', 'apple', 'google', 'meta', 'tesla', 'sony',
];

export function checkResemblesRealCompany(rawName: string): boolean {
  const normalized = rawName.toLowerCase().replace(/\s+/g, '');
  if (!normalized) return false;
  return KNOWN_CORP_KEYWORDS.some((kw) => normalized.includes(kw));
}
