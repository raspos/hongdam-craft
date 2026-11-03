import { BambooPost } from '../types/game';

/**
 * Virtual preset posts strictly marked with `isPresetSample: true`
 * so first-time visitors can feel the satirical PR atmosphere without ever
 * mistaking them for real user-submitted posts.
 */
export const PRESET_BAMBOO_POSTS: BambooPost[] = [
  {
    id: 'sample_preset_1',
    authorNickname: '광화문야근요정',
    companyLabel: '대기업 · 플랫폼',
    endingBadgeKo: '홍보담당 임원 승진',
    endingBadgeEn: 'Promoted to PR Executive',
    archetypeBadgeKo: '팩트체크형 홍담',
    archetypeBadgeEn: 'The Data & Fact Strategist',
    category: 'defense_win',
    content:
      '[예시] 스테이지 3 공시 숫자 오류 위기 때 술자리 유혹 참고 사내 팩트체크 → 공시 대조 → 정정 요청 3연타로 정면 돌파했습니다! 데이터 저널리스트가 고개 끄덕일 때 쾌감 진짜 짜릿하네요.',
    contentEn:
      '[Sample] In Stage 3’s leaked-memo crisis, I skipped drinks and ran Internal Fact-Check → Disclosure Audit → Factual Correction. Watching the Data Journalist nod in agreement felt amazing!',
    createdAt: Date.now() - 1000 * 60 * 180,
    isPresetSample: true,
    reactions: { soju: 14, summon_reporter: 3, call_chairman: 2, comfort: 4, congrats: 21 },
  },
  {
    id: 'sample_preset_2',
    authorNickname: '간수치비상팀장',
    companyLabel: '중견기업 · 건설',
    endingBadgeKo: '병원 입원',
    endingBadgeEn: 'Hospitalized — Overwork',
    archetypeBadgeKo: '폭탄주형 홍담',
    archetypeBadgeEn: 'The Bomb-Shot Networking Chief',
    category: 'hangover',
    content:
      '[예시] 원칙주의 팩트체커 기자한테 폭탄주 원샷 스킬 썼다가 역효과 터지고 다음 턴 숙취 디버프까지 겹쳐서 응급실 실려 갔습니다… 기자 성향 분석(11번)부터 먼저 쓸걸 그랬어요 ㅠㅠ',
    contentEn:
      '[Sample] Used Bomb-Shot Bottoms-Up on a Principled Fact-Checker—massive backfire plus hangover debuff sent me straight to the hospital! Always run Reporter Profile Analysis (#11) first…',
    createdAt: Date.now() - 1000 * 60 * 320,
    isPresetSample: true,
    reactions: { soju: 29, summon_reporter: 8, call_chairman: 5, comfort: 33, congrats: 1 },
  },
  {
    id: 'sample_preset_3',
    authorNickname: '여의도소방수',
    companyLabel: '재벌그룹 · 자동차',
    endingBadgeKo: '오너 리스크 경질',
    endingBadgeEn: 'Dismissed — Scapegoated',
    archetypeBadgeKo: '돈으로 해결하는 홍담',
    archetypeBadgeEn: 'The Big-Budget Fixer',
    category: 'chairman_risk',
    content:
      '[예시] 예산 1000이라고 광고·협찬 남발했다가 스테이지 6 회장님 안전사고 은폐 사건에서 전설의 탐사 기자한테 영혼까지 털렸습니다. RISK 관리 안 하면 마지막 보스에서 지옥 봅니다!',
    contentEn:
      '[Sample] Thought 1,000 Chaebol XP made me invincible, spammed ad-spend cards, and got obliterated by the Legendary Investigative Journalist in Stage 6. Watch your RISK meter!',
    createdAt: Date.now() - 1000 * 60 * 540,
    isPresetSample: true,
    reactions: { soju: 19, summon_reporter: 12, call_chairman: 27, comfort: 22, congrats: 2 },
  },
  {
    id: 'sample_preset_4',
    authorNickname: '판교100XP기적',
    companyLabel: '스타트업 · 게임',
    endingBadgeKo: '[히든] 위기관리 부티크 창업 대박',
    endingBadgeEn: '[HIDDEN] Crisis Boutique Founder',
    archetypeBadgeKo: '위기관리의 달인',
    archetypeBadgeEn: 'The Master of Crisis Harmony',
    category: 'survival_log',
    content:
      '[예시] 스타트업 100 XP로 시작해서 홍보실장 지원금 + 진심 사과 + 실질 개선으로 6스테이지 무패 완주했더니 히든 엔딩 떴어요!! WHAT IF 리플레이로 비교해 보니 팩트체크 선행이 신의 한 수였네요.',
    contentEn:
      '[Sample] Started with 100 Startup XP and cleared all 6 stages undefeated via sincere apologies & reforms—unlocked the Hidden Boutique Founder ending!!',
    createdAt: Date.now() - 1000 * 60 * 780,
    isPresetSample: true,
    reactions: { soju: 8, summon_reporter: 4, call_chairman: 3, comfort: 5, congrats: 38 },
  },
  {
    id: 'sample_preset_5',
    authorNickname: '오늘부터자유인',
    companyLabel: '대기업 · 유통',
    endingBadgeKo: '사표 제출 · 홍담 탈출',
    endingBadgeEn: 'Resigned — Free at Last',
    archetypeBadgeKo: '전화통형 홍담',
    archetypeBadgeEn: 'The 24/7 Hotline Operator',
    category: 'resign_escape',
    content:
      '[예시] 압수수색 D-DAY에서 파란 박스 들어오는 3D 연출 보자마자 과감하게 사직서 버튼 눌렀습니다ㅋㅋ 선글라스 끼고 퇴장하는 캐릭터 보는데 괜히 속이 뻥 뚫리네요!',
    contentEn:
      '[Sample] The moment the 3D prosecution raid van pulled up on Stage 5, I hit Submit Resignation! Watching my voxel character put on sunglasses and walk out felt cathartic!',
    createdAt: Date.now() - 1000 * 60 * 1020,
    isPresetSample: true,
    reactions: { soju: 24, summon_reporter: 6, call_chairman: 11, comfort: 9, congrats: 31 },
  },
];
