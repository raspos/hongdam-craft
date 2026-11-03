import { Character3DAction, EndingId, PRArchetypeId } from '../types/game';

export interface EndingDef {
  id: EndingId;
  isVictory: boolean;
  isHidden: boolean;
  badgeKo: string;
  badgeEn: string;
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  storyKo: string;
  storyEn: string;
  quoteKo: string;
  quoteEn: string;
  sceneAction: Character3DAction;
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  ending_exec_promotion: {
    id: 'ending_exec_promotion',
    isVictory: true,
    isHidden: false,
    badgeKo: '홍보담당 임원 승진',
    badgeEn: 'Promoted to PR Executive',
    titleKo: '🏆 홍보담당 상무 승진 — 별을 달다!',
    titleEn: '🏆 Promoted to VP of Communications!',
    subtitleKo: '6대 언론 위기를 모두 돌파하고 그룹 최고홍보책임자(CCO)의 자리에 올랐습니다!',
    subtitleEn: 'You weathered all six media storms and earned your executive nameplate as CCO!',
    storyKo:
      '쏟아지는 단독 기사와 압수수색, 회장님의 초대형 사고까지 막아낸 당신에게 정기 임원 인사에서 마침내 ‘상무’ 발령장이 수여되었습니다. 법인카드 한도는 늘어났지만… 오늘 밤에도 휴대전화 벨소리는 멈추지 않습니다.',
    storyEn:
      'Having navigated product crises, leaked filings, live TV probes, raids, and the Chairman’s scandal, the board promoted you to Vice President of Communications. Your corporate card limit is bigger—though your phone still rings at midnight.',
    quoteKo: '“임원 별은 달았지만, 내일 조간 가판은 여전히 두렵다.”',
    quoteEn: '“Earned the executive star, yet tomorrow’s morning edition still keeps me awake.”',
    sceneAction: 'celebrate_promo',
  },

  ending_crisis_legend: {
    id: 'ending_crisis_legend',
    isVictory: true,
    isHidden: false,
    badgeKo: '전설의 위기관리 전문가',
    badgeEn: 'Legendary Crisis Master',
    titleKo: '🌟 전설의 위기관리 전문가 — 정론과 신뢰의 승리',
    titleEn: '🌟 Legendary Crisis Strategist — Triumph of Trust',
    subtitleKo: '꼼수 로비 없이 투명한 팩트와 실질적 개혁만으로 평판과 언론 신뢰를 모두 지켰습니다!',
    subtitleEn: 'Without dark lobbying, you protected both corporate reputation and press trust through facts and reform!',
    storyKo:
      '당신은 무조건 기사를 삭제하려 드는 대신, 정확한 데이터 검증과 진정성 있는 피해 구제·지배구조 개선으로 위기를 기회로 바꿨습니다. 까다롭기로 소문난 탐사기자들조차 당신을 ‘가장 신뢰할 수 있는 취재 파트너’로 꼽으며, 대학원 위기관리 교과서에 당신의 사례가 실렸습니다!',
    storyEn:
      'Instead of burying stories with backroom pressure, you turned crises into trust through verified data, sincere apologies, and real reform. Even tough investigative reporters respect your word, making your playbook a textbook case study!',
    quoteKo: '“최고의 언론 대응은 숨기는 기술이 아니라 바로잡는 용기다.”',
    quoteEn: '“True PR mastery isn’t hiding the truth—it’s having the courage to fix it.”',
    sceneAction: 'celebrate_promo',
  },

  ending_eternal_lead: {
    id: 'ending_eternal_lead',
    isVictory: true,
    isHidden: false,
    badgeKo: '만년 홍보팀장',
    badgeEn: 'Eternal PR Team Lead',
    titleKo: '☕ 만년 홍보팀장 — 살아남은 자의 애환',
    titleEn: '☕ Eternal PR Team Lead — Still Standing',
    subtitleKo: '여섯 번의 폭풍우를 꾸역꾸역 버텨냈지만 임원 승진 명단에서는 아슬아슬하게 빠졌습니다.',
    subtitleEn: 'You survived all six storms by the skin of your teeth, though the executive promotion slipped by.',
    storyKo:
      '회사는 무사히 굴러가고 당신의 자리도 보전됐지만, 깎여나간 기업 평판과 아슬아슬한 뒷수습 탓에 올해 임원 승진은 ‘내년 기약’으로 미뤄졌습니다. 그래도 잘리지 않고 살아남은 게 어디입니까! 오늘도 해장국 한 그릇 비우고 출입기자 전화를 받습니다.',
    storyEn:
      'The company survived, and so did your desk—barely. Bruised reputation scores and messy compromises meant the board deferred your promotion to “next year.” Still, survival in K-PR is no small feat!',
    quoteKo: '“승진은 못 했어도 살아남았다… 그게 홍담의 숙명이다.”',
    quoteEn: '“No promotion this year, yet I survived—such is the PR chief’s fate.”',
    sceneAction: 'phone_call',
  },

  ending_budget_exhausted: {
    id: 'ending_budget_exhausted',
    isVictory: false,
    isHidden: false,
    badgeKo: '타 부서 강등',
    badgeEn: 'Demoted — Budget Depleted',
    titleKo: '📦 [게임 오버] 홍보예산 소진 — 한직 타 부서 발령',
    titleEn: '📦 [GAME OVER] PR Budget Depleted — Transferred Away',
    subtitleKo: '연간 홍보예산(XP)이 바닥나 더 이상 전화 한 통, 간담회 한 번 열 여력이 없습니다.',
    subtitleEn: 'With zero PR budget (XP) left, the CFO froze your corporate card and reassigned your seat.',
    storyKo:
      '재무팀으로부터 “법인카드 정지 및 홍보실 예산 감사 착수” 통보가 날아왔습니다. 인사발령 공고에 찍힌 당신의 새 소속은 본사 외곽 자료보관실. 짐 박스를 챙겨 나오는데 기자들에게서 “팀장님 인사 나셨어요?” 문자가 띵동 울립니다.',
    storyEn:
      'Finance froze your department budget and issued a sudden transfer order to the suburban archive annex. As you carry your cardboard box out the lobby, reporters text: “Heard you got moved, Chief?”',
    quoteKo: '“실탄 떨어진 홍보팀장에게 남은 건 누런 짐 박스뿐이었다.”',
    quoteEn: '“An out-of-budget PR chief is left with only a cardboard moving box.”',
    sceneAction: 'demoted_box',
  },

  ending_overwork_hospital: {
    id: 'ending_overwork_hospital',
    isVictory: false,
    isHidden: false,
    badgeKo: '병원 입원',
    badgeEn: 'Hospitalized — Overwork',
    titleKo: '🚑 [게임 오버] 과로 누적 — 응급실 입원',
    titleEn: '🚑 [GAME OVER] Burnout Collapse — Hospitalized',
    subtitleKo: '야근과 술자리, 빗발치는 확인 전화 끝에 홍보팀장의 체력(HP)이 0이 되었습니다.',
    subtitleEn: 'Endless midnight calls, stress, and drinking rounds pushed your HP to zero.',
    storyKo:
      '새벽 가판 기사를 확인하던 당신은 결국 사무실 바닥에 쓰러져 구급차에 실려 갔습니다. 다행히 생명에는 지장이 없지만 전치 4주 절대 안정 진단이 내려졌습니다. 링거를 꽂은 채 눈을 뜨자 병실 밖에서조차 휴대폰 진동이 울리는 환청이 들립니다.',
    storyEn:
      'Checking the midnight edition at your desk, you collapsed from exhaustion and woke up beside an IV drip stand. Doctors ordered four weeks of strict rest—please put your phone on airplane mode!',
    quoteKo: '“회사는 내 빈자리를 금방 채우지만, 내 건강은 아무도 대신 지켜주지 않는다.”',
    quoteEn: '“The company replaces your seat tomorrow, but nobody replaces your health.”',
    sceneAction: 'hospital_bed',
  },

  ending_lobby_exposed: {
    id: 'ending_lobby_exposed',
    isVictory: false,
    isHidden: false,
    badgeKo: '홍보 공작 의혹 폭로',
    badgeEn: 'Dark PR Scandal Exposed',
    titleKo: '💣 [게임 오버] 홍보 공작 의혹 대폭로!',
    titleEn: '💣 [GAME OVER] Backroom PR Manipulation Exposed!',
    subtitleKo: '무리한 광고 압박·외압·물타기 누적(RISK 100)이 탐사보도 특집 기사로 터졌습니다!',
    subtitleEn: 'Your high-RISK suppression tactics hit 100 and became the headline scandal itself!',
    storyKo:
      '원래 막으려던 사건보다 “언론 입막음 시도 녹취록 및 협찬 거래 문건”이 더 큰 사회적 파문을 일으켰습니다! 포털 메인 1위부터 10위까지 당신의 대응 방식이 도배되었고, 경영진은 모든 책임을 홍보팀장 개인의 일탈로 돌렸습니다.',
    storyEn:
      'The cover-up became bigger than the crime! Leaked logs of ad-spend leverage and desk lobbying dominated top headlines, and top brass swiftly blamed “rogue PR overreach.”',
    quoteKo: '“기사를 힘으로 누르려 한 순간, 홍보팀장이 기사의 주인공이 되었다.”',
    quoteEn: '“The moment you tried to muscle the press, you became the front-page story.”',
    sceneAction: 'news_publish',
  },

  ending_owner_scapegoat: {
    id: 'ending_owner_scapegoat',
    isVictory: false,
    isHidden: false,
    badgeKo: '오너 리스크 경질',
    badgeEn: 'Dismissed — Scapegoated',
    titleKo: '⚡ [게임 오버] 오너 리스크 책임 전가 — 전격 경질',
    titleEn: '⚡ [GAME OVER] Scapegoated for Crisis — Dismissed',
    subtitleKo: '걷잡을 수 없는 보도 폭풍과 기업 평판 붕괴 끝에 홍보라인 전원 문책 인사가 단행되었습니다.',
    subtitleEn: 'Uncontained headlines shattered corporate reputation, triggering a sweeping PR purge.',
    storyKo:
      '사고는 경영진과 현업에서 쳤는데, 조간신문을 본 회장님의 불호령은 “홍보팀은 도대체 뭐 했냐!”로 떨어졌습니다. 억울함을 항변할 틈도 없이 대기발령 통보서가 책상 위에 놓였습니다.',
    storyEn:
      'Executives caused the disaster, yet the Chairman’s morning fury landed squarely on one question: “What on earth was PR doing?!” You took the fall for leadership’s sins.',
    quoteKo: '“잘되면 경영진 덕분, 터지면 홍보팀 탓… 만고불변의 직장 법칙.”',
    quoteEn: '“Success belongs to the C-suite; headlines get blamed on PR.”',
    sceneAction: 'demoted_box',
  },

  ending_resignation_escape: {
    id: 'ending_resignation_escape',
    isVictory: false,
    isHidden: false,
    badgeKo: '사표 제출 · 홍담 탈출',
    badgeEn: 'Resigned — Free at Last',
    titleKo: '🕊️ 사표 제출 — 오늘부로 홍담 탈출합니다!',
    titleEn: '🕊️ Resignation Accepted — Escaped PR Hell!',
    subtitleKo: '흰 봉투에 고이 접어 품어왔던 사직서를 마침내 던지고 광화문 하늘 아래 자유인이 되었습니다!',
    subtitleEn: 'You finally slapped that crisp white resignation envelope onto the desk and walked into the sunshine!',
    storyKo:
      '“이 기사부터는 다음 팀장님께 문의하세요!” 출입기자 단톡방에 정중한 작별 인사를 남기고 알림을 껐습니다. 10년 만에 처음으로 조간신문 알람 없이 늦잠을 자는 아침, 공기가 이렇게 달콤할 줄이야!',
    storyEn:
      '“Please direct future queries to my successor!” You muted every press group chat and stepped outside into crisp morning air—sleeping past dawn without breaking-news alerts at last!',
    quoteKo: '“사직서를 내는 순간, 세상의 모든 속보 알림이 자장가가 되었다.”',
    quoteEn: '“The second my resignation landed, every breaking-news chime turned into birdsong.”',
    sceneAction: 'resignation_exit',
  },

  // 히든 엔딩 2종
  hidden_whistleblower_hero: {
    id: 'hidden_whistleblower_hero',
    isVictory: true,
    isHidden: true,
    badgeKo: '[히든] 공익과 양심의 수호자',
    badgeEn: '[HIDDEN] Guardian of Truth',
    titleKo: '🌈 [히든 엔딩] 내부 개혁의 기수 — 언론계·재계 동시 헌정!',
    titleEn: '🌈 [HIDDEN ENDING] Conscience of the Boardroom!',
    subtitleKo: '오너 리스크 앞에서 단 한 번의 불법 공작(RISK 0~5)도 없이 진실 규명과 전면 개혁을 관철했습니다!',
    subtitleEn: 'With near-zero RISK and unwavering integrity, you forced genuine reform at the very top!',
    storyKo:
      '모두가 은폐를 종용할 때 당신은 끝까지 사실 검증과 피해자 구제, 지배구조 혁신만을 고집했습니다. 그 결과 이사회가 당신을 독립 준법·소통위원회 수장으로 추대했고, 한국기자협회로부터 ‘올해의 가장 투명한 커뮤니케이터’ 특별상을 수상하는 진기록을 세웠습니다!',
    storyEn:
      'When insiders whispered to bury the scandal, you insisted on zero spin, victim relief, and structural reform. The board named you Chief Integrity & Communications Officer, and the Journalists Association awarded you Communicator of the Year!',
    quoteKo: '“진실은 홍보의 적이 아니라, 기업을 살리는 마지막 방패였다.”',
    quoteEn: '“Truth was never PR’s enemy—it was the ultimate shield that saved the enterprise.”',
    sceneAction: 'celebrate_promo',
  },

  hidden_boutique_founder: {
    id: 'hidden_boutique_founder',
    isVictory: true,
    isHidden: true,
    badgeKo: '[히든] 위기관리 부티크 창업 대박',
    badgeEn: '[HIDDEN] Crisis Boutique Founder',
    titleKo: '🚀 [히든 엔딩] 여의도 전설의 PR 부티크 대표 등극!',
    titleEn: '🚀 [HIDDEN ENDING] Founded a Legendary Crisis PR Firm!',
    subtitleKo: '열악한 스타트업 예산으로 6대 위기를 평정하고, 대기업들이 줄 서서 모셔가는 독립 PR 대표가 되었습니다!',
    subtitleEn: 'Conquering all 6 stages on a shoestring Startup budget made you the hottest crisis advisor in town!',
    storyKo:
      '초기 예산 100 XP짜리 작은 스타트업에서 기적 같은 방어전을 펼친 당신의 무용담이 업계 전체에 퍼졌습니다! 임원 승진 제안을 정중히 사양하고 차린 위기관리 전문 부티크에 재벌그룹 회장실들이 자문 계약을 맺으려 번호표를 뽑고 있습니다!',
    storyEn:
      'Word spread fast of how you navigated six brutal media crises starting with just 100 Startup XP. Now conglomerate chairmen line up outside your own independent crisis advisory firm!',
    quoteKo: '“예산 100으로 살아남아 본 사람만이 진짜 위기관리를 안다.”',
    quoteEn: '“Survive six storms on a 100-XP shoestring, and every boardroom wants your number.”',
    sceneAction: 'celebrate_promo',
  },
};

export interface PRArchetypeDef {
  id: PRArchetypeId;
  icon: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
}

export const PR_ARCHETYPES: Record<PRArchetypeId, PRArchetypeDef> = {
  type_bomb_shot: {
    id: 'type_bomb_shot',
    icon: '🍻',
    nameKo: '폭탄주형 홍담',
    nameEn: 'The Bomb-Shot Networking Chief',
    descKo: '오찬·만찬·폭탄주로 출입기자들과 인간적 의리를 쌓아 위기를 돌파하는 정통 스킨십파 홍보팀장입니다.',
    descEn: 'Old-school relationship builder who melts icy headlines over sizzling barbecue and perfectly mixed bomb shots.',
  },
  type_hotline: {
    id: 'type_hotline',
    icon: '📱',
    nameKo: '전화통형 홍담',
    nameEn: 'The 24/7 Hotline Operator',
    descKo: '벨이 울리기도 전에 수화기를 드는 기동력! 전화·문자·백브리핑으로 오해를 초동 진화하는 현장 밀착형입니다.',
    descEn: 'Fastest thumb and phone ear in the industry—diffusing misunderstandings with nonstop calls, texts, and quick briefings.',
  },
  type_money_solver: {
    id: 'type_money_solver',
    icon: '💰',
    nameKo: '돈으로 해결하는 홍담',
    nameEn: 'The Big-Budget Fixer',
    descKo: '막강한 광고·협찬·외부 에이전시 물량 공세로 판을 흔드는 자본주의 화력형 홍보팀장입니다.',
    descEn: 'Wields massive ad packages, sponsorships, and agency firepower—walking a razor’s edge with backlash risk.',
  },
  type_legal_shield: {
    id: 'type_legal_shield',
    icon: '⚖️',
    nameKo: '법무팀 의존형 홍담',
    nameEn: 'The Legal-Shield Strategist',
    descKo: '모든 문장을 변호사와 크로스체크하며 법리 검토와 가처분 방어막으로 빈틈을 차단하는 철벽 수비형입니다.',
    descEn: 'Vets every syllable alongside corporate counsel, erecting airtight legal shields against speculative claims.',
  },
  type_fact_checker: {
    id: 'type_fact_checker',
    icon: '🔬',
    nameKo: '팩트체크형 홍담',
    nameEn: 'The Data & Fact Strategist',
    descKo: '사내 팩트체크, 전자공시 대조, 로우 데이터 공개로 까다로운 전문 기자까지 납득시키는 스마트 정공법파입니다.',
    descEn: 'Wins arguments with raw datasets, disclosure audits, and factual corrections rather than favors.',
  },
  type_chairman_loyalist: {
    id: 'type_chairman_loyalist',
    icon: '🙇',
    nameKo: '회장님 바라기',
    nameEn: 'The Chairman’s Inner-Circle Guard',
    descKo: '홍보실장·CEO·오너 만찬과 최고위층 핫라인을 총동원해 그룹 차원의 결단으로 돌파하는 조직 권력형입니다.',
    descEn: 'Operates on a direct line to the C-suite and Chairman’s Secretariat to mobilize top-down breakthroughs.',
  },
  type_press_warrior: {
    id: 'type_press_warrior',
    icon: '⚔️',
    nameKo: '기자와 전쟁형 홍담',
    nameEn: 'The Press-Warfare Hardliner',
    descKo: '법적 경고, 인맥 압박, 이슈 맞불 등 강 대 강 정면충돌을 불사하는 초강경 매파 홍보팀장입니다.',
    descEn: 'Never backs down—fighting fire with injunctions, aggressive spin, and high-stakes brinkmanship.',
  },
  type_crisis_master: {
    id: 'type_crisis_master',
    icon: '🏛️',
    nameKo: '위기관리의 달인',
    nameEn: 'The Master of Crisis Harmony',
    descKo: '정보 분석, 투명한 사과, 피해 보상, 실질적 제도 개선을 황금 비율로 조율하는 교과서적 마에스트로입니다.',
    descEn: 'Blends intel analysis, sincere apologies, victim relief, and structural reform in textbook harmony.',
  },
};
