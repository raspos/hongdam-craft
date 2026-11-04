import { DifficultyLevel } from '../types/game';

export interface DifficultySetting {
  id: DifficultyLevel;
  nameKo: string;
  nameEn: string;
  badgeKo: string;
  badgeEn: string;
  descKo: string;
  descEn: string;
  defaultYears: number;
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
    nameKo: '신입 팀장 (초보)',
    nameEn: 'Rookie Team Lead (Beginner)',
    badgeKo: '🌱 신입 팀장',
    badgeEn: '🌱 Rookie Team Lead',
    descKo: '첫 플레이 추천. 돌발 위험 감소(22%), 기자 반격 완화, 1단계 튜토리얼 및 패배 시 스테이지 재도전 허용.',
    descEn: 'Recommended for first run. Reduced events (22%), gentler reporter attacks, Stage 1 tutorial, and stage retry on defeat.',
    defaultYears: 3,
    eventProb: 0.22,
    enemyPressureMultiplier: 0.78,
    scoreMultiplier: 0.85,
    allowStageRetry: true,
    tutorialEnabled: true,
    lethalWarningAggressive: true,
  },
  normal: {
    id: 'normal',
    nameKo: '전략 팀장 (표준)',
    nameEn: 'Strategy Team Lead (Normal)',
    badgeKo: '💼 전략 팀장',
    badgeEn: '💼 Strategy Team Lead',
    descKo: '표준 정통 난이도. 기자 상성과 돌발 이벤트(44%)가 완전하게 적용되며, 자원 배분과 타이밍 전략이 승패를 가릅니다.',
    descEn: 'Standard balance. Complete reporter affinities and sudden events (44%). Demands prudent resource budgeting and tactical timing.',
    defaultYears: 7,
    eventProb: 0.44,
    enemyPressureMultiplier: 1.0,
    scoreMultiplier: 1.0,
    allowStageRetry: false,
    tutorialEnabled: false,
    lethalWarningAggressive: false,
  },
  veteran: {
    id: 'veteran',
    nameKo: '전설의 팀장 (도전)',
    nameEn: 'Legendary Team Lead (Veteran)',
    badgeKo: '🔥 전설의 팀장',
    badgeEn: '🔥 Legendary Team Lead',
    descKo: '숙련자를 위한 극한 도전. 매서운 기자 반격(+20%), 높은 돌발 위험(50%), 제한된 회복 기회 속 최종 점수 1.5배 보너스 제공.',
    descEn: 'Extreme challenge for seasoned players. Stricter counter-attacks (+20%), higher event volatility (50%), with a 1.5× final score bonus.',
    defaultYears: 12,
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
