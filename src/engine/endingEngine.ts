import {
  EndingId,
  EndingSummary,
  GameState,
  PRArchetypeId,
} from '../types/game';
import { PR_SKILLS_BY_ID } from '../data/skills';
import { computeEffectiveXpCost } from './skillEngine';

/**
 * Checks if player has zero usable skills left due to XP exhaustion
 * (Note: 0-XP skills on cooldown might block them on the current turn if XP === 0!).
 */
export function isXpCompletelyExhausted(state: GameState): boolean {
  if (!state.stageBattle) return false;
  const battle = state.stageBattle;

  // Check if any unlocked skill is currently usable with remaining XP
  const anyAffordableUsable = state.unlockedSkillIds.some((skillId) => {
    const sk = PR_SKILLS_BY_ID[skillId];
    if (!sk) return false;
    if ((battle.cooldowns[skillId] || 0) > 0) return false;
    if (battle.deadline < sk.deadlineMin) return false;
    const cost = computeEffectiveXpCost(sk, state.company, battle.buffs);
    return cost <= state.resources.xp;
  });

  return !anyAffordableUsable;
}

export function classifyPRArchetype(state: GameState): PRArchetypeId {
  const counts = state.skillUsageCounts;
  const getSum = (ids: string[]) => ids.reduce((acc, id) => acc + (counts[id] || 0), 0);

  const drinkCount = getSum(['A02_coffee_lunch', 'A03_bomb_shot']);
  const hotlineCount = getSum(['A01_phone_call', 'A02_coffee_lunch', 'A04_press_statement']);
  const moneyCount = getSum(['D13_ad_sponsorship', 'D16_all_out_blitz']);
  const legalCount = getSum(['C10_legal_agency_shield', 'D15_legal_warning']);
  const factCount = getSum(['B05_reporter_profiling', 'B06_internal_factcheck', 'A04_press_statement', 'E18_factual_correction']);
  const chairmanCount = getSum(['C09_emergency_budget', 'C12_ceo_chairman_call']);
  const warCount = getSum(['D14_network_hold', 'D15_legal_warning', 'D16_all_out_blitz']);
  const masterCount = getSum(['E17_apology_compensation', 'E19_exec_reform', 'B07_whistleblower_probe', 'B08_crisis_tf', 'C11_emergency_press_conf']);

  const buckets: { id: PRArchetypeId; score: number }[] = [
    { id: 'type_bomb_shot', score: drinkCount * 1.45 },
    { id: 'type_hotline', score: hotlineCount * 1.05 },
    { id: 'type_money_solver', score: moneyCount * 1.4 },
    { id: 'type_legal_shield', score: legalCount * 1.65 },
    { id: 'type_fact_checker', score: factCount * 1.25 },
    { id: 'type_chairman_loyalist', score: chairmanCount * 1.4 },
    { id: 'type_press_warrior', score: warCount * 1.45 },
    { id: 'type_crisis_master', score: masterCount * 1.3 },
  ];

  buckets.sort((a, b) => b.score - a.score);
  if (buckets[0].score <= 0) return 'type_hotline';
  return buckets[0].id;
}

export function determineFinalVictoryEnding(state: GameState): EndingId {
  const { reputation, risk } = state.resources;
  const failedStages = state.stageHistory.filter((h) => h.resolution === 'damaging_report').length;
  const stage6Entry = state.stageHistory.find((h) => h.stage === 6);

  // If Stage 6 itself failed badly -> scapegoated!
  if (stage6Entry && stage6Entry.resolution === 'damaging_report' && reputation < 42) {
    return 'ending_owner_scapegoat';
  }

  // Hidden Ending 1: Pure Integrity Guardian (Zero/near-zero dark PR risk, high reputation, zero D-category usage)
  const usedAnyDarkSkill = Object.entries(state.skillUsageCounts).some(
    ([id, cnt]) => cnt > 0 && PR_SKILLS_BY_ID[id]?.category === 'D'
  );
  if (!usedAnyDarkSkill && risk <= 8 && reputation >= 78 && failedStages === 0) {
    return 'hidden_whistleblower_hero';
  }

  // Hidden Ending 2: Startup Shoestring Legend (Startup cleared all 6 stages with 0 failed stages and rep >= 68)
  if (state.company.scale === 'startup' && failedStages === 0 && reputation >= 68 && risk <= 35) {
    return 'hidden_boutique_founder';
  }

  // Ending 2: Legendary Crisis Management Specialist
  if (reputation >= 76 && risk <= 28 && failedStages === 0) {
    return 'ending_crisis_legend';
  }

  // Ending 1: Executive Promotion (VP of Communications)
  if (reputation >= 52 && risk < 75 && failedStages <= 1) {
    return 'ending_exec_promotion';
  }

  // Ending 3: Eternal PR Team Lead (Survived all 6 stages, but bruised reputation or high risk)
  return 'ending_eternal_lead';
}

export function buildEndingSummary(state: GameState, endingId: EndingId): EndingSummary {
  const archetypeId = classifyPRArchetype(state);
  const topSkills = Object.entries(state.skillUsageCounts)
    .filter(([, count]) => count > 0)
    .map(([skillId, count]) => ({ skillId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const trustedCount = state.journalistPool.filter(
    (j) => j.relationshipTag === 'trusted_source' || j.relationshipTag === 'drinking_buddy' || j.stats.intimacy >= 65
  ).length;
  const hostileCount = state.journalistPool.filter(
    (j) => j.relationshipTag === 'hostile_watchdog' || j.stats.distrust >= 75
  ).length;

  const isVictory =
    endingId === 'ending_exec_promotion' ||
    endingId === 'ending_crisis_legend' ||
    endingId === 'ending_eternal_lead' ||
    endingId === 'hidden_whistleblower_hero' ||
    endingId === 'hidden_boutique_founder';

  const isHidden =
    endingId === 'hidden_whistleblower_hero' || endingId === 'hidden_boutique_founder';

  return {
    endingId,
    isVictory,
    isHidden,
    archetypeId,
    difficulty: state.difficulty,
    finalStage: state.currentStage,
    topSkills,
    trustedCount,
    hostileCount,
    completedAt: Date.now(),
  };
}
