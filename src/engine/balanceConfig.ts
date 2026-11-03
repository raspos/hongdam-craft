import { CompanyScaleId, StageNumber } from '../types/game';

export function safeNum(val: number, fallback = 0): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return val;
}

export function clamp(val: number, min: number, max: number): number {
  const n = safeNum(val, min);
  return Math.max(min, Math.min(max, Math.round(n)));
}

export const BALANCE = {
  INITIAL_HP: 100,
  MAX_HP: 100,
  INITIAL_RISK: 0,
  MAX_RISK: 100,
  INITIAL_REPUTATION: 50,
  MAX_REPUTATION: 100,
  MIN_PRESSURE: 0,
  MAX_PRESSURE: 100,

  // Early instant clear if pressure drops to or below 15
  EARLY_CLEAR_PRESSURE: 15,

  // Deadline resolution pressure thresholds
  CLEAR_PRESSURE_THRESHOLD: 68,
  FACT_CORRECT_THRESHOLD: 48,
  REBUTTAL_THRESHOLD: 60,
  DELAY_THRESHOLD: 58,
  TRUST_RESTORE_THRESHOLD: 62,

  // Emergency XP grants by company scale
  VP_SUPPORT_XP: {
    startup: 26,
    sme: 42,
    midsize: 65,
    large: 95,
    chaebol: 140,
  } as Record<CompanyScaleId, number>,

  OWNER_BANQUET_XP: {
    startup: 45,
    sme: 75,
    midsize: 115,
    large: 175,
    chaebol: 260,
  } as Record<CompanyScaleId, number>,

  // Diminishing returns when repeating the same skill category consecutively
  SAME_CATEGORY_STREAK_PENALTY: [1.0, 0.92, 0.75, 0.6],

  // Stage difficulty enemy counter multiplier
  STAGE_ENEMY_SCALE: {
    1: 0.86,
    2: 1.0,
    3: 1.14,
    4: 1.26,
    5: 1.38,
    6: 1.5,
  } as Record<StageNumber, number>,

  // Sudden event probability per turn
  SUDDEN_EVENT_BASE_PROB: 0.42,
};

/**
 * Experience years modifier:
 * Rank is always '홍보팀장', while career years (1~25) shape skill proficiency,
 * initial journalist trust, and subtle stamina resilience.
 */
export function getExperienceModifiers(years: number) {
  const y = clamp(years, 1, 25);
  return {
    skillProficiencyBonus: Math.min(0.18, (y - 1) * 0.01), // +0% ~ +18% persuasion efficiency
    initialTrustBonus: Math.min(12, Math.floor((y - 1) * 0.65)), // +0 ~ +12 initial reporter intimacy
    eventFavorBonus: Math.min(0.12, (y - 1) * 0.006),
    youthStaminaSave: y <= 4 ? 1 : 0, // Junior team leads recover/spend 1 less HP on footwork
  };
}
