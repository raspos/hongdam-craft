import { DifficultyLevel } from '../types/game';

export interface DifficultySetting {
  id: DifficultyLevel;
  nameKo: string;
  nameEn: string;
  badgeKo: string;
  badgeEn: string;
  descKo: string;
  descEn: string;
  eventProb: number;
  enemyPressureMultiplier: number;
  scoreMultiplier: number;
  allowStageRetry: boolean;
  tutorialEnabled: boolean;
  lethalWarningAggressive: boolean;
}

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySetting> = {
  rookie: {
    id: 'rookie',
    nameKo: '신입 홍담 (초보 모드)',
    nameEn: 'Rookie PR (Beginner)',
    badgeKo: '🌱 신입 홍담',
    badgeEn: '🌱 Rookie PR',
    descKo: '첫 플레이어 추천. 돌발 이벤트 감소(약 22%), 기자 반격 완화, 1단계 튜토리얼 및 패배 시 스테이지 재도전 허용.',
    descEn: 'Recommended for first runs. Reduced sudden events (~22%), gentler reporter attacks, Stage 1 tutorial, and stage retry on game over.',
    eventProb: 0.22,
    enemyPressureMultiplier: 0.78,
    scoreMultiplier: 0.85,
    allowStageRetry: true,
    tutorialEnabled: true,
    lethalWarningAggressive: true,
  },
  normal: {
    id: 'normal',
    nameKo: '홍보팀장 (표준 모드)',
    nameEn: 'PR Team Lead (Normal)',
    badgeKo: '💼 홍보팀장',
    badgeEn: '💼 PR Team Lead',
    descKo: '표준 정통 난이도. 기자 상성과 돌발 이벤트(44%)가 완전하게 적용되며, 자원 배분과 타이밍 전략이 승패를 가릅니다.',
    descEn: 'Standard balance. Complete reporter affinities and sudden events (44%). Demands prudent resource budgeting and tactical timing.',
    eventProb: 0.44,
    enemyPressureMultiplier: 1.0,
    scoreMultiplier: 1.0,
    allowStageRetry: false,
    tutorialEnabled: false,
    lethalWarningAggressive: false,
  },
  veteran: {
    id: 'veteran',
    nameKo: '홍보의 신 (베테랑 모드)',
    nameEn: 'God of PR (Veteran)',
    badgeKo: '🔥 홍보의 신',
    badgeEn: '🔥 God of PR',
    descKo: '숙련자를 위한 극한 도전. 매서운 기자 반격(+20%), 높은 돌발 위험(50%), 제한된 회복 기회 속 최종 점수 1.5배 보너스 제공.',
    descEn: 'Extreme challenge for seasoned players. Stricter counter-attacks (+20%), higher event volatility (50%), with a 1.5× final score bonus.',
    eventProb: 0.50,
    enemyPressureMultiplier: 1.20,
    scoreMultiplier: 1.5,
    allowStageRetry: false,
    tutorialEnabled: false,
    lethalWarningAggressive: false,
  },
};

export const DIFFICULTY_LIST: DifficultySetting[] = [
  DIFFICULTY_SETTINGS.rookie,
  DIFFICULTY_SETTINGS.normal,
  DIFFICULTY_SETTINGS.veteran,
];
