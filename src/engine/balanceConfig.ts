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

export const MAX_COMPANY_REROLLS = 2;

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
    startup: 22,
    sme: 38,
    midsize: 62,
    large: 96,
    chaebol: 148,
  } as Record<CompanyScaleId, number>,

  OWNER_BANQUET_XP: {
    startup: 38,
    sme: 68,
    midsize: 112,
    large: 175,
    chaebol: 265,
  } as Record<CompanyScaleId, number>,

  // Sharper diminishing returns when repeating the same skill category consecutively
  SAME_CATEGORY_STREAK_PENALTY: [1.0, 0.80, 0.55, 0.38],

  // Stage difficulty enemy counter multiplier: gentler onboarding in Stages 1–2, steeper late crisis in 4–6
  STAGE_ENEMY_SCALE: {
    1: 0.66,
    2: 0.80,
    3: 1.14,
    4: 1.36,
    5: 1.54,
    6: 1.66,
  } as Record<StageNumber, number>,

  // Sudden event probability per turn
  SUDDEN_EVENT_BASE_PROB: 0.44,
};

/**
 * Experience years modifier:
 * Rank is always '홍보팀장', while career years (1~25) trade off junior physical stamina
 * against veteran persuasion polish—without creating an unfair beginner cliff.
 */
export function getExperienceModifiers(years: number) {
  const y = clamp(years, 1, 25);
  return {
    skillProficiencyBonus: Math.min(0.10, (y - 1) * 0.0045), // +0% ~ +10% persuasion efficiency
    initialTrustBonus: Math.min(7, Math.floor((y - 1) * 0.32)), // +0 ~ +7 initial reporter intimacy
    eventFavorBonus: Math.min(0.08, (y - 1) * 0.0035),
    youthStaminaSave: y <= 5 ? 2 : y <= 10 ? 1 : 0, // Junior PR leads spend less HP on field footwork
  };
}
