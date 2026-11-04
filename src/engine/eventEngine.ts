import { GameState } from '../types/game';
import { SUDDEN_EVENTS, SuddenEventDef } from '../data/events';
import { getExperienceModifiers } from './balanceConfig';
import { DIFFICULTY_SETTINGS } from './difficultyConfig';
import { SeededRNG } from './rng';

export function rollSuddenEvent(
  state: GameState,
  lastSkillId: string,
  rng: SeededRNG
): SuddenEventDef | null {
  const battle = state.stageBattle;
  if (!battle) return null;

  // Contextual trigger boost (e.g. high RISK, drinking, unverified statement)
  const isDrinking = lastSkillId === 'A03_bomb_shot';
  const isUnverifiedStatement = lastSkillId === 'A04_press_statement' && !battle.buffs.factChecked;
  const isSincereRemedy =
    lastSkillId === 'E17_apology_compensation' || lastSkillId === 'E19_exec_reform';

  const diffConfig = DIFFICULTY_SETTINGS[state.difficulty || 'normal'] || DIFFICULTY_SETTINGS.normal;
  let triggerProb = diffConfig.eventProb;
  if (isDrinking || isUnverifiedStatement || state.resources.risk >= 55) {
    triggerProb = Math.min(0.70, diffConfig.eventProb * 1.4);
  }

  if (!rng.chance(triggerProb)) return null;

  const leadTrust = battle.journalists[0]?.stats.intimacy ?? 40;
  const expMod = getExperienceModifiers(state.player.experienceYears);

  const eligible = SUDDEN_EVENTS.filter((ev) => {
    if (battle.triggeredEventIds.includes(ev.id)) return false;
    if (ev.minStage && battle.stage < ev.minStage) return false;

    switch (ev.condition) {
      case 'after_drinking':
        return isDrinking;
      case 'unverified_statement':
        return isUnverifiedStatement;
      case 'after_sincere_remedy':
        return isSincereRemedy;
      case 'high_risk_45':
        return state.resources.risk >= 45;
      case 'high_risk_70':
        return state.resources.risk >= 70;
      case 'high_trust_65':
        return leadTrust >= 65;
      case 'low_hp_40':
        return state.resources.hp <= 45;
      case 'legal_used':
        return battle.buffs.legalShieldActive || lastSkillId === 'D15_legal_warning';
      case 'stage_2_plus':
        return battle.stage >= 2;
      case 'stage_4_plus':
        return battle.stage >= 4;
      case 'stage_5_plus':
        return battle.stage >= 5;
      case 'any':
      default:
        return true;
    }
  });

  if (eligible.length === 0) return null;

  // Prioritize specific contextual events when triggered
  const contextual = eligible.filter((e) => e.condition !== 'any' && !e.condition.startsWith('stage_'));
  if (contextual.length > 0 && rng.chance(0.65)) {
    return rng.pick(contextual);
  }

  // Slight veteran favor toward positive events
  if (expMod.eventFavorBonus > 0 && rng.chance(expMod.eventFavorBonus)) {
    const goodOnes = eligible.filter((e) => e.tone === 'good');
    if (goodOnes.length > 0) return rng.pick(goodOnes);
  }

  return rng.pick(eligible);
}
