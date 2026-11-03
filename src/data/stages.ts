import { JournalistArchetypeId, OwnerRiskVariantId, StageNumber } from '../types/game';

export interface OwnerRiskVariantDef {
  id: OwnerRiskVariantId;
  nameKo: string;
  nameEn: string;
  headlineKo: string;
  headlineEn: string;
  subheadKo: string;
  subheadEn: string;
  recommendedHintKo: string;
  recommendedHintEn: string;
}

export const OWNER_RISK_VARIANTS: Record<OwnerRiskVariantId, OwnerRiskVariantDef> = {
  embezzlement: {
    id: 'embezzlement',
    nameKo: '오너 일가의 배임·횡령 의혹',
    nameEn: 'Owner Family Embezzlement & Breach of Trust',
    headlineKo: '“[단독] {company} 오너 일가 비자금·배임 정황 포착…그룹 전체로 파장 확산”',
    headlineEn: '“[Exclusive] Slush Fund & Embezzlement Trail Hits {company} Owner Family”',
    subheadKo: '해외 페이퍼컴퍼니 자금 흐름 문건이 탐사보도팀 손에 들어갔습니다.',
    subheadEn: 'Offshore shell-company transfer records have landed on the investigative desk.',
    recommendedHintKo: '어설픈 거짓 해명은 즉시 후속 폭로를 부릅니다. 공시·법무 검증과 투명한 책임 조치를 조합하세요.',
    recommendedHintEn: 'False denials trigger instant follow-up leaks. Combine disclosure audits, legal review, and decisive accountability.',
  },
  management_failure: {
    id: 'management_failure',
    nameKo: '대규모 경영 실패 책임론',
    nameEn: 'Massive Strategic Management Failure',
    headlineKo: '“수조 원대 신사업 좌초…{company} 오너 독단 경영이 부른 참사”',
    headlineEn: '“Billions Evaporated: How {company} Owner’s Solo Gamble Crashed Flagship Venture”',
    subheadKo: '이사회 반대 의견을 묵살한 회의록이 유출되며 주주와 여론이 들끓고 있습니다.',
    subheadEn: 'Leaked board minutes showing ignored warnings have ignited shareholder fury.',
    recommendedHintKo: '데이터 대조와 CEO/책임 임원 쇄신, 실질적 재발 방지책이 주효합니다.',
    recommendedHintEn: 'Cross-check financial disclosures, announce leadership accountability, and present concrete reforms.',
  },
  unfair_trading: {
    id: 'unfair_trading',
    nameKo: '계열사 일감 몰아주기·불공정거래 의혹',
    nameEn: 'Affiliate Self-Dealing & Unfair Trading Scandal',
    headlineKo: '“오너 일가 개인회사에 부당 지원…{company} 불공정거래 전방위 의혹”',
    headlineEn: '“ Rigged Contracts Funnel Profits to {company} Owner Family’s Private Firm”',
    subheadKo: '공정위 조사설과 내부 거래 단가 비교표가 동시에 보도될 위기입니다.',
    subheadEn: 'Antitrust probe rumors and internal pricing tables are hours away from publication.',
    recommendedHintKo: '공시 검증, 백그라운드 브리핑, 거래 구조 전면 개선안 발표가 효과적입니다.',
    recommendedHintEn: 'Use disclosure audits, deep background briefings, and structural reform commitments.',
  },
  succession_scandal: {
    id: 'succession_scandal',
    nameKo: '편법 경영권 승계 논란',
    nameEn: 'Controversial Management Succession Scheme',
    headlineKo: '“꼼수 합병·전환사채 발행?…{company} 오너 승계 시나리오 집중 해부”',
    headlineEn: '“Convertible Bonds & Backdoor Merger? Inside {company}’s Succession Playbook”',
    subheadKo: '소액주주 연대와 경제·탐사 기자들이 합동 검증에 나섰습니다.',
    subheadEn: 'Minority shareholder coalitions and investigative reporters have teamed up.',
    recommendedHintKo: '위기관리 컨설턴트·기자회견·지배구조 개선 조치로 정면 돌파하세요.',
    recommendedHintEn: 'Engage crisis consultants, hold a transparent press conference, and pledge governance reform.',
  },
  safety_coverup: {
    id: 'safety_coverup',
    nameKo: '중대한 안전사고 은폐 의혹',
    nameEn: 'Cover-Up of Major Industrial Safety Incident',
    headlineKo: '“사고 직후 보고서 삭제 지시?…{company} 오너 일가 은폐 개입 의혹”',
    headlineEn: '“Orders to Scrub the Logs? {company} Leadership Accused of Safety Incident Cover-Up”',
    subheadKo: '현장 녹취록 일부가 확보되어 방송과 신문 동시 타격이 예고됐습니다.',
    subheadEn: 'Partial audio recordings are in reporters’ hands ahead of a joint broadcast-print drop.',
    recommendedHintKo: '보도 자제 압박은 치명적입니다! 진심 어린 공식 사과, 피해자 보상, 책임자 문책이 유일한 살길입니다.',
    recommendedHintEn: 'Suppressing coverage will explode! Sincere apology, victim compensation, and executive dismissal are vital.',
  },
  outrageous_conduct: {
    id: 'outrageous_conduct',
    nameKo: '오너의 부적절한 언행·갑질 파문',
    nameEn: 'Owner’s Outrageous Conduct & Verbal Abuse Leak',
    headlineKo: '“충격 녹취 공개 임박…{company} 오너의 폭언·일탈에 그룹 전체 비상”',
    headlineEn: '“Explosive Audio Teased: {company} Chairman’s Tirade Sends Shockwaves Across Group”',
    subheadKo: 'SNS와 영상 플랫폼으로 2차 확산되기 직전, 최종 데스크 마감이 임박했습니다.',
    subheadEn: 'With viral social clips looming, the investigative desk’s final deadline is ticking down.',
    recommendedHintKo: '여론 모니터링, 대국민 공식 사과, 실질적 재발 방지 및 피해 회복 조치를 신속히 실행하세요.',
    recommendedHintEn: 'Monitor sentiment closely, issue an immediate public apology, and announce concrete restitution.',
  },
};

export const OWNER_RISK_VARIANT_LIST: OwnerRiskVariantDef[] = Object.values(OWNER_RISK_VARIANTS);

export interface StageDef {
  stage: StageNumber;
  stars: string;
  titleKo: string;
  titleEn: string;
  themeBadgeKo: string;
  themeBadgeEn: string;
  defaultHeadlineKo: string;
  defaultHeadlineEn: string;
  subheadKo: string;
  subheadEn: string;
  briefingKo: string;
  briefingEn: string;
  basePressure: number;
  baseDeadline: number;
  candidateArchetypes: JournalistArchetypeId[];
  coReporterArchetypes?: JournalistArchetypeId[];
  isCoReporting: boolean;
  isPackRaid: boolean;
  isFinalBoss: boolean;
  envTheme: 'office_lobby' | 'night_whistle' | 'finance_vault' | 'broadcast_studio' | 'raid_plaza' | 'boss_penthouse';
}

export const STAGES: Record<StageNumber, StageDef> = {
  1: {
    stage: 1,
    stars: '★',
    titleKo: 'STAGE 1 — 기사 한 줄의 무게',
    titleEn: 'STAGE 1 — Weight of a Single Line',
    themeBadgeKo: '제품·서비스 품질 논란',
    themeBadgeEn: 'Product & Service Backlash',
    defaultHeadlineKo: '“소비자 불만 폭주…{company} 제품·서비스 품질 논란”',
    defaultHeadlineEn: '“Consumer Complaints Surge Over {company} Quality Issues”',
    subheadKo: '출입기자로부터 사실 확인 전화가 걸려왔습니다. 첫 단추를 어떻게 끼우느냐가 평판을 좌우합니다.',
    subheadEn: 'A beat reporter is calling for comment. Your opening response will set the tone for corporate trust.',
    briefingKo: '기자에게 전화해 취재 의도를 파악하고, 사내 팩트체크 후 정확한 해명자료나 소비자 보상안을 제시해 보세요.',
    briefingEn: 'Call the reporter, verify internal facts, and respond with accurate statements or consumer remedies.',
    basePressure: 48,
    baseDeadline: 5,
    candidateArchetypes: ['rookie_passion', 'metro_striker', 'networker', 'deadline_racer'],
    isCoReporting: false,
    isPackRaid: false,
    isFinalBoss: false,
    envTheme: 'office_lobby',
  },
  2: {
    stage: 2,
    stars: '★★',
    titleKo: 'STAGE 2 — 갑질 제보의 습격',
    titleEn: 'STAGE 2 — Ambush of the Workplace Tip-off',
    themeBadgeKo: '직장 내 괴롭힘·내부 폭로',
    themeBadgeEn: 'Workplace Culture & Whistleblower',
    defaultHeadlineKo: '“직원들 ‘더는 못 참겠다’…{company} 불합리한 조직문화 내부 폭로”',
    defaultHeadlineEn: '“Employees Say ‘Enough Is Enough’: Inside {company}’s Toxic Culture Leak”',
    subheadKo: '익명 커뮤니티 게시글과 내부 녹취 제보가 기자에게 전달되었습니다. 단순 부인은 화를 키울 수 있습니다.',
    subheadEn: 'Anonymous forum posts and internal recordings reached the press. Blanket denial could backfire.',
    briefingKo: '내부 제보 내용을 먼저 검증하세요! 제보 신빙성에 따라 공식 사과·인사 조치·실질적 개선이 핵심 해법이 됩니다.',
    briefingEn: 'Verify the whistleblower claim first! Depending on internal truth, sincere apology and reform outperform denial.',
    basePressure: 55,
    baseDeadline: 5,
    candidateArchetypes: ['sns_star', 'metro_striker', 'fact_checker', 'followup_obsessed'],
    isCoReporting: false,
    isPackRaid: false,
    isFinalBoss: false,
    envTheme: 'night_whistle',
  },
  3: {
    stage: 3,
    stars: '★★★',
    titleKo: 'STAGE 3 — 유출된 보고서',
    titleEn: 'STAGE 3 — The Leaked Report',
    themeBadgeKo: '내부 경영문건·공시 의혹',
    themeBadgeEn: 'Leaked Financials & Disclosure Gap',
    defaultHeadlineKo: '“[단독] 입수한 {company} 내부 문건…공식 발표와 다른 숫자”',
    defaultHeadlineEn: '“[Exclusive] Leaked {company} Memo Contradicts Official Financial Filings”',
    subheadKo: '수치에 밝은 전문 기자가 대외비 경영자료를 입수해 팩트 대조에 들어갔습니다.',
    subheadEn: 'A numbers-savvy specialist reporter obtained a confidential deck and is cross-checking filings.',
    briefingKo: '사내 팩트체크나 공시·자료 대조 없이 성급히 해명자료를 내면 숫자 오류 역풍을 맞을 수 있습니다!',
    briefingEn: 'Issuing statements without cross-checking disclosures first risks a devastating numerical error backfire!',
    basePressure: 60,
    baseDeadline: 5,
    candidateArchetypes: ['econ_veteran', 'data_journalist', 'fact_checker', 'scoop_hunter'],
    isCoReporting: false,
    isPackRaid: false,
    isFinalBoss: false,
    envTheme: 'finance_vault',
  },
  4: {
    stage: 4,
    stars: '★★★★',
    titleKo: 'STAGE 4 — 탐사보도의 역습',
    titleEn: 'STAGE 4 — Investigative Team Strikes Back',
    themeBadgeKo: '방송·탐사팀 6개월 공동 취재',
    themeBadgeEn: '6-Month Joint Broadcast Investigation',
    defaultHeadlineKo: '“6개월 추적…{company}의 감춰진 진실, 이번 주 심층 방영 예고”',
    defaultHeadlineEn: '“6 Months on the Trail: Prime-Time Broadcast Teases {company}’s Hidden Truth”',
    subheadKo: '방송 탐사 PD와 취재기자가 2인 1조로 카메라를 대동하고 공식 인터뷰를 요청했습니다!',
    subheadEn: 'An investigative broadcast PD and a co-reporter have teamed up with cameras rolling!',
    briefingKo: '2인 공동 취재 스테이지입니다. 어설픈 광고·협찬 로비는 카메라 앞 폭로 소재가 되며, 체계적 TF·브리핑·개선안이 빛을 발합니다.',
    briefingEn: 'Co-reporting battle! Crude ad lobbying becomes on-camera fodder; structured TF, briefings, and real reform shine.',
    basePressure: 65,
    baseDeadline: 5,
    candidateArchetypes: ['broadcast_pd'],
    coReporterArchetypes: ['followup_obsessed', 'data_journalist', 'scoop_hunter', 'fact_checker'],
    isCoReporting: true,
    isPackRaid: false,
    isFinalBoss: false,
    envTheme: 'broadcast_studio',
  },
  5: {
    stage: 5,
    stars: '★★★★★',
    titleKo: 'STAGE 5 — 압수수색 D-DAY',
    titleEn: 'STAGE 5 — Raid D-DAY',
    themeBadgeKo: '검찰 압수수색·속보 전쟁',
    themeBadgeEn: 'Prosecution Raid & Breaking News Blitz',
    defaultHeadlineKo: '“[속보] 검찰, {company} 본사 전격 압수수색…경영진 수사 확대”',
    defaultHeadlineEn: '“[Breaking] Prosecutors Raid {company} HQ as Executive Probe Widens”',
    subheadKo: '파란 압수수색 박스가 본사 로비를 지나는 순간 수십 개 언론사 속보 경쟁이 시작됐습니다! 마감이 매우 짧습니다.',
    subheadEn: 'As blue seizure boxes exit the lobby, dozens of outlets race to file breaking alerts! Deadline is razor-thin.',
    briefingKo: '남은 마감 턴이 4턴뿐입니다! 그동안 쌓아온 기자 신뢰와 법무·위기관리 역량, 비축한 예산을 집중 투입하세요.',
    briefingEn: 'Only 4 turns until deadline! Leverage your built-up reporter trust, legal coordination, and saved budget.',
    basePressure: 70,
    baseDeadline: 4,
    candidateArchetypes: ['scoop_hunter', 'metro_striker', 'deadline_racer', 'econ_veteran'],
    coReporterArchetypes: ['sns_star', 'networker'],
    isCoReporting: true,
    isPackRaid: true,
    isFinalBoss: false,
    envTheme: 'raid_plaza',
  },
  6: {
    stage: 6,
    stars: '★★★★★★',
    titleKo: 'STAGE 6 — 회장님이 사고를 쳤다',
    titleEn: 'STAGE 6 — The Chairman Did What?!',
    themeBadgeKo: 'FINAL BOSS · 오너 일가 초대형 위기',
    themeBadgeEn: 'FINAL BOSS · Chairman’s Mega-Scandal',
    defaultHeadlineKo: '“오너 일가 초대형 의혹…{company} 그룹 전체로 파장 확산”',
    defaultHeadlineEn: '“Mega-Scandal Engulfs {company} Chairman’s Family; Group-Wide Crisis”',
    subheadKo: '전설의 탐사 기자가 직접 등판했습니다. 지난 5개 스테이지의 모든 선택과 신뢰·업보가 이곳에서 결산됩니다!',
    subheadEn: 'The Legendary Investigative Journalist steps onto the field. Every choice from Stages 1–5 converges now!',
    briefingKo: '최종 보스전입니다. 과거 정직한 대응을 쌓았다면 기자단 신뢰 보너스를 얻지만, 높은 RISK와 공작 이력은 거센 폭풍으로 돌아옵니다.',
    briefingEn: 'Final Boss! Past integrity grants press trust bonuses, while high accumulated RISK triggers relentless counter-fire.',
    basePressure: 74,
    baseDeadline: 5,
    candidateArchetypes: ['legend_investigative'],
    coReporterArchetypes: ['broadcast_pd', 'data_journalist', 'econ_veteran'],
    isCoReporting: true,
    isPackRaid: false,
    isFinalBoss: true,
    envTheme: 'boss_penthouse',
  },
};

export const STAGE_LIST: StageDef[] = [STAGES[1], STAGES[2], STAGES[3], STAGES[4], STAGES[5], STAGES[6]];
