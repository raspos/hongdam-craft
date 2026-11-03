import { GameState } from '../types/game';
import { SUDDEN_EVENTS, SuddenEventDef } from '../data/events';
import { BALANCE, getExperienceModifiers } from './balanceConfig';
import { SeededRNG } from './rng';

export function rollSuddenEvent(
  state: GameState,
  lastSkillId: string,
  rng: SeededRNG
): SuddenEventDef | null {
  const battle = state.stageBattle;
  if (!battle) return null;

  // Contextual trigger boost (e.g. high RISK, drinking, unverified statement)
  const isDrinking = lastSkillId === 'A05_dinner_drinks' || lastSkillId === 'A06_bomb_shot';
  const isUnverifiedStatement = lastSkillId === 'A07_press_statement' && !battle.buffs.factChecked;
  const isSincereRemedy =
    lastSkillId === 'E35_official_apology' ||
    lastSkillId === 'E37_victim_compensation' ||
    lastSkillId === 'E39_substantive_reform';

  let triggerProb = BALANCE.SUDDEN_EVENT_BASE_PROB;
  if (isDrinking || isUnverifiedStatement || state.resources.risk >= 55) {
    triggerProb = 0.62;
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
        return battle.buffs.legalShieldActive || lastSkillId === 'D33_legal_warning';
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
