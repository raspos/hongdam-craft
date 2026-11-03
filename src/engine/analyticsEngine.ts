import {
  ActionTelemetryRecord,
  CompanyScaleId,
  CounterfactualComparisonSide,
  GameState,
  JournalistArchetypeId,
  MonteCarloResult,
  SkillCategory,
  StageNumber,
  StageReplaySnapshot,
  StrategyPolicyId,
  WhatIfResult,
} from '../types/game';
import { COMPANY_SCALES } from '../data/companies';
import { JOURNALIST_ARCHETYPE_LIST, JOURNALIST_ARCHETYPES } from '../data/journalists';
import { PR_SKILLS, PR_SKILLS_BY_ID } from '../data/skills';
import { STAGES } from '../data/stages';
import {
  DEFAULT_PLAYER_PROFILE,
  initializeNewRun,
  playBattleTurn,
  proceedToNextStage,
  startStageBattle,
} from './gameEngine';
import { SeededRNG } from './rng';
import { computeEffectiveHpCost, computeEffectiveXpCost, evaluateSkillPreview } from './skillEngine';

export interface StrategyPolicyMeta {
  id: StrategyPolicyId;
  nameKo: string;
  nameEn: string;
  color: string;
  ruleDescKo: string;
  ruleDescEn: string;
}

export const STRATEGY_POLICY_META: Record<StrategyPolicyId, StrategyPolicyMeta> = {
  transparent_remedy: {
    id: 'transparent_remedy',
    nameKo: '투명한 위기관리형',
    nameEn: 'Transparent Crisis Management',
    color: '#10b981',
    ruleDescKo: '사내 팩트체크·제보 검증을 선행한 뒤 공식 사과, 피해 보상, 실질적 개선 조치와 기자회견을 우선 선택합니다 (HP≤30 시 휴식, XP 부족 시 실장 지원).',
    ruleDescEn: 'Verifies facts/leaks first, then prioritizes sincere apologies, victim compensation, substantive reforms, and open pressers.',
  },
  fact_check: {
    id: 'fact_check',
    nameKo: '정보·팩트체크형',
    nameEn: 'Intel & Fact-Check Driven',
    color: '#38bdf8',
    ruleDescKo: '기자 성향 분석, 공시 대조, 사내 팩트체크로 근거를 확보한 뒤 정정 요청·추가 취재자료·해명자료를 집중 구사합니다.',
    ruleDescEn: 'Prioritizes reporter profiling, disclosure audits, and internal fact-checks followed by factual corrections and raw reference data.',
  },
  relationship: {
    id: 'relationship',
    nameKo: '관계 중심형',
    nameEn: 'Relationship & Networking',
    color: '#f59e0b',
    ruleDescKo: '전화, 커피, 오찬, 저녁 술자리, 폭탄주, 백브리핑 등 스킨십 스킬을 최우선 선택하며 체력 저하 시 긴급 휴식을 사용합니다.',
    ruleDescEn: 'Prioritizes calls, coffee, meals, evening drinks, bomb shots, and background briefings while resting when stamina dips.',
  },
  legal_defense: {
    id: 'legal_defense',
    nameKo: '법적 대응형',
    nameEn: 'Legal-First Hardline',
    color: '#a855f7',
    ruleDescKo: '법무팀 긴급 소집과 공시 대조, 법적 대응 경고를 우선 배치하고 공식 해명자료로 방어선을 구축합니다.',
    ruleDescEn: 'Prioritizes mobilizing the Legal Team, injunctions/warnings, disclosure checks, and formal written statements.',
  },
  big_budget: {
    id: 'big_budget',
    nameKo: '예산 투입형',
    nameEn: 'Big-Budget Spend & Spin',
    color: '#ef4444',
    ruleDescKo: '그룹 홍보예산 총동원, 광고 집행, 협찬 제안, 외부 PR 대행사 투입을 공격적으로 사용하며 예산 부족 시 만찬·실장 지원을 호출합니다.',
    ruleDescEn: 'Aggressively deploys ad-spend leverage, sponsorships, PR blitzes, and external agencies, topping up XP via executive dinners.',
  },
  random_baseline: {
    id: 'random_baseline',
    nameKo: '무작위 대응형 (기준선)',
    nameEn: 'Random Baseline',
    color: '#64748b',
    ruleDescKo: '매 턴 현재 사용 가능한 모든 해금 스킬 중 하나를 시드 난수로 균등 무작위 선택합니다 (비교 통제군).',
    ruleDescEn: 'Uniformly selects at random among currently usable unlocked skills each turn as a statistical control baseline.',
  },
  player_habit: {
    id: 'player_habit',
    nameKo: '나의 실제 플레이 패턴',
    nameEn: 'My Observed Play Pattern',
    color: '#eab308',
    ruleDescKo: '이번 게임에서 플레이어가 실제로 사용한 스킬 및 계열 빈도 가중치를 반영하여 남은 스테이지 행동을 선택합니다.',
    ruleDescEn: 'Selects future skills weighted by your actual skill and category usage history in this playthrough.',
  },
};

function getUsableSkillIds(state: GameState): string[] {
  if (!state.stageBattle) return [];
  return state.unlockedSkillIds.filter((id) => evaluateSkillPreview(state, id).usable);
}

/**
 * Rule-based policy selector for simulations & counterfactual strategy rollouts.
 */
export function selectSkillByPolicy(
  state: GameState,
  policy: StrategyPolicyId,
  rng: SeededRNG
): string | null {
  const usable = getUsableSkillIds(state);
  if (usable.length === 0) return null;

  const battle = state.stageBattle!;

  // Survival guardrails for non-random policies
  if (policy !== 'random_baseline') {
    if (state.resources.hp <= 28 && usable.includes('E40_emergency_rest')) {
      return 'E40_emergency_rest';
    }
    if (state.resources.xp <= 22) {
      if (usable.includes('C25_owner_banquet') && state.resources.hp >= 40) return 'C25_owner_banquet';
      if (usable.includes('C19_vp_support') && state.resources.hp >= 30) return 'C19_vp_support';
    }
  }

  if (policy === 'random_baseline') {
    return rng.pick(usable);
  }

  if (policy === 'player_habit') {
    const totalUsed = Object.values(state.skillUsageCounts).reduce((a, b) => a + b, 0);
    if (totalUsed === 0) {
      return selectSkillByPolicy(state, 'transparent_remedy', rng);
    }
    // Weighted pick by past skill usage + category usage
    const catCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    Object.entries(state.skillUsageCounts).forEach(([id, c]) => {
      const sk = PR_SKILLS_BY_ID[id];
      if (sk) catCounts[sk.category] = (catCounts[sk.category] || 0) + c;
    });

    const weights = usable.map((id) => {
      const sk = PR_SKILLS_BY_ID[id];
      const direct = (state.skillUsageCounts[id] || 0) * 3;
      const cat = sk ? (catCounts[sk.category] || 0) : 0;
      return Math.max(1, 1 + direct + cat);
    });
    const sumW = weights.reduce((a, b) => a + b, 0);
    let r = rng.next() * sumW;
    for (let i = 0; i < usable.length; i++) {
      r -= weights[i];
      if (r <= 0) return usable[i];
    }
    return usable[usable.length - 1];
  }

  const priorityQueues: Record<Exclude<StrategyPolicyId, 'random_baseline' | 'player_habit'>, string[]> = {
    transparent_remedy: [
      !battle.buffs.factChecked ? 'B14_internal_factcheck' : '',
      !battle.buffs.whistleblowerVerified && battle.stage >= 2 ? 'B16_whistleblower_verify' : '',
      'E39_substantive_reform',
      'E37_victim_compensation',
      'E35_official_apology',
      'E38_exec_replacement',
      'C23_emergency_press_conf',
      'C24_ceo_statement',
      'E36_correct_misinfo',
      'B17_crisis_tf',
      'A10_extra_materials',
      'A08_background_briefing',
      'A07_press_statement',
      'A01_phone_call',
      'A02_text_message',
    ],
    fact_check: [
      !battle.journalists[0].isAnalyzed ? 'B11_profile_analysis' : '',
      !battle.buffs.disclosureAudited ? 'B15_disclosure_audit' : '',
      !battle.buffs.factChecked ? 'B14_internal_factcheck' : '',
      !battle.buffs.deadlineChecked ? 'B13_deadline_check' : '',
      'E36_correct_misinfo',
      'A10_extra_materials',
      'A07_press_statement',
      'C22_crisis_consultant',
      'B12_intent_probe',
      'A08_background_briefing',
      'B18_sentiment_monitor',
      'A01_phone_call',
      'A02_text_message',
    ],
    relationship: [
      'A06_bomb_shot',
      'A05_dinner_drinks',
      'A04_lunch_meeting',
      'A03_coffee_chat',
      'D30_ex_journalist_net',
      'A09_press_roundtable',
      'A08_background_briefing',
      'A01_phone_call',
      'A02_text_message',
      'C19_vp_support',
    ],
    legal_defense: [
      !battle.buffs.legalShieldActive ? 'C20_legal_team' : '',
      'D33_legal_warning',
      !battle.buffs.disclosureAudited ? 'B15_disclosure_audit' : '',
      !battle.buffs.factChecked ? 'B14_internal_factcheck' : '',
      'C22_crisis_consultant',
      'A07_press_statement',
      'E36_correct_misinfo',
      'B18_sentiment_monitor',
      'A01_phone_call',
      'A02_text_message',
    ],
    big_budget: [
      'D34_all_out_budget',
      'D27_ad_leverage',
      'D28_sponsorship_offer',
      'C21_pr_agency',
      'D32_issue_diversion',
      'C22_crisis_consultant',
      'A09_press_roundtable',
      'C25_owner_banquet',
      'C19_vp_support',
      'A07_press_statement',
      'A02_text_message',
    ],
  };

  const queue = priorityQueues[policy].filter(Boolean);
  for (const cand of queue) {
    if (usable.includes(cand)) {
      // Avoid repeating same category 3x in a row if an alternative exists
      const sk = PR_SKILLS_BY_ID[cand];
      if (sk && battle.lastCategory === sk.category && battle.sameCategoryStreak >= 2 && usable.length > 2) {
        continue;
      }
      return cand;
    }
  }

  return usable[0];
}

// ==================== SECTION 3: COUNTERFACTUAL WHAT-IF ENGINE ====================

function restoreStateFromStageSnapshot(baseState: GameState, snap: StageReplaySnapshot): GameState {
  return {
    ...JSON.parse(JSON.stringify(baseState)),
    phase: 'battle',
    currentStage: snap.stage,
    rngState: snap.rngStateAtStart,
    resources: JSON.parse(JSON.stringify(snap.resourcesAtStart)),
    stageBattle: JSON.parse(JSON.stringify(snap.stageBattleAtStart)),
    journalistPool: JSON.parse(JSON.stringify(snap.journalistPoolAtStart)),
    unlockedSkillIds: [...snap.unlockedSkillIdsAtStart],
    skillUsageCounts: { ...snap.skillUsageCountsAtStart },
    lastStageSummary: null,
    endingSummary: null,
    telemetryLogs: [],
    battleLogs: [],
  };
}

function simulateStageWithPlan(
  initialStageState: GameState,
  labelKo: string,
  labelEn: string,
  planFn: (currentState: GameState, stepIndex: number, rng: SeededRNG) => string | null
): CounterfactualComparisonSide {
  let sim = JSON.parse(JSON.stringify(initialStageState)) as GameState;
  const startResources = JSON.parse(JSON.stringify(sim.resources));
  const decisionRng = new SeededRNG((sim.rngState ^ 0x9e3779b9) >>> 0);

  const trajectory: CounterfactualComparisonSide['turnTrajectory'] = [
    {
      turn: 0,
      pressure: sim.stageBattle!.pressure,
      xp: sim.resources.xp,
      hp: sim.resources.hp,
      risk: sim.resources.risk,
      reputation: sim.resources.reputation,
      trust: sim.stageBattle!.journalists[0].stats.intimacy,
    },
  ];

  const executedSkills: string[] = [];
  let safetyCounter = 0;

  while (sim.phase === 'battle' && safetyCounter < 15) {
    safetyCounter += 1;
    const chosen = planFn(sim, executedSkills.length, decisionRng);
    if (!chosen) break;

    // Track pre-stage-reward resources from telemetry if this turn ends the stage
    executedSkills.push(chosen);
    sim = playBattleTurn(sim, chosen);

    const lastTel = sim.telemetryLogs[sim.telemetryLogs.length - 1];
    trajectory.push({
      turn: executedSkills.length,
      skillId: chosen,
      pressure: sim.stageBattle?.pressure ?? 0,
      xp: sim.resources.xp,
      hp: sim.resources.hp,
      risk: sim.resources.risk,
      reputation: sim.resources.reputation,
      trust: lastTel ? lastTel.afterTurnComplete.trust : (sim.stageBattle?.journalists[0]?.stats.intimacy ?? 0),
    });
  }

  const summary = sim.lastStageSummary;
  const carryOver = JSON.parse(JSON.stringify(sim.resources));

  // Pre-reward end-of-battle resources (if stage resolved, subtract xpReward/hpReward to show pure battle end vs carryOver)
  const finalBattleResources = summary
    ? {
        ...startResources,
        ...sim.resources,
        xp: Math.max(0, sim.resources.xp - summary.xpReward),
        hp: Math.max(0, sim.resources.hp - summary.hpReward),
      }
    : sim.resources;

  return {
    labelKo,
    labelEn,
    skillSequence: executedSkills,
    finalResources: finalBattleResources,
    carryOverResources: carryOver,
    finalPressure: sim.stageBattle?.pressure ?? 0,
    finalTrust: sim.stageBattle?.journalists[0]?.stats.intimacy ?? 0,
    resolution: sim.endingSummary && !sim.endingSummary.isVictory
      ? 'game_over'
      : summary?.resolution ?? (sim.endingSummary?.isVictory ? 'crisis_calmed' : 'game_over'),
    gameOverEndingId: sim.endingSummary && !sim.endingSummary.isVictory ? sim.endingSummary.endingId : undefined,
    grade: summary?.grade ?? (sim.endingSummary?.isVictory ? 'A' : 'F'),
    turnTrajectory: trajectory,
  };
}

export function getWhatIfSkillOptionsAtTurn(
  state: GameState,
  stage: StageNumber,
  turnIndex: number
): {
  skillId: string;
  usable: boolean;
  lockReasonKo?: string;
  lockReasonEn?: string;
}[] {
  const snap = state.stageSnapshots[stage];
  if (!snap || snap.chosenSkillSequence.length === 0) return [];

  let sim = restoreStateFromStageSnapshot(state, snap);
  const safeTurn = Math.max(0, Math.min(turnIndex, snap.chosenSkillSequence.length - 1));
  for (let i = 0; i < safeTurn; i++) {
    if (sim.phase !== 'battle') break;
    const skId = snap.chosenSkillSequence[i];
    if (evaluateSkillPreview(sim, skId).usable) {
      sim = playBattleTurn(sim, skId, { fastSim: true });
    }
  }

  return PR_SKILLS.filter((s) => snap.unlockedSkillIdsAtStart.includes(s.id)).map((s) => {
    const prev = evaluateSkillPreview(sim, s.id);
    return {
      skillId: s.id,
      usable: prev.usable,
      lockReasonKo: prev.lockReasonKo,
      lockReasonEn: prev.lockReasonEn,
    };
  });
}

export function runWhatIfSingleTurn(
  state: GameState,
  stage: StageNumber,
  turnIndexToReplace: number,
  alternativeSkillId: string
): WhatIfResult | null {
  const snap = state.stageSnapshots[stage];
  if (!snap || snap.chosenSkillSequence.length === 0) return null;

  const baseStageState = restoreStateFromStageSnapshot(state, snap);
  const origSeq = snap.chosenSkillSequence;
  const origSkill = PR_SKILLS_BY_ID[origSeq[turnIndexToReplace]];
  const altSkill = PR_SKILLS_BY_ID[alternativeSkillId];
  if (!origSkill || !altSkill) return null;

  const actualSide = simulateStageWithPlan(
    baseStageState,
    `실제 플레이 (${origSkill.nameKo})`,
    `Actual Play (${origSkill.nameEn})`,
    (cur, idx, rng) => {
      if (idx < origSeq.length && evaluateSkillPreview(cur, origSeq[idx]).usable) {
        return origSeq[idx];
      }
      return selectSkillByPolicy(cur, 'transparent_remedy', rng);
    }
  );

  const counterSide = simulateStageWithPlan(
    baseStageState,
    `WHAT IF: ${turnIndexToReplace + 1}턴 [${altSkill.nameKo}]`,
    `WHAT IF: Turn ${turnIndexToReplace + 1} [${altSkill.nameEn}]`,
    (cur, idx, rng) => {
      if (idx === turnIndexToReplace && evaluateSkillPreview(cur, alternativeSkillId).usable) {
        return alternativeSkillId;
      }
      if (idx < origSeq.length && evaluateSkillPreview(cur, origSeq[idx]).usable) {
        return origSeq[idx];
      }
      return selectSkillByPolicy(cur, 'transparent_remedy', rng);
    }
  );

  return {
    stage,
    seedUsed: snap.rngStateAtStart,
    mode: 'single_turn',
    turnIndexReplaced: turnIndexToReplace,
    questionKo: `만약 ${turnIndexToReplace + 1}턴에서 ‘${origSkill.nameKo}’ 대신 ‘${altSkill.nameKo}’ 스킬을 선택했다면?`,
    questionEn: `What if on Turn ${turnIndexToReplace + 1} you chose “${altSkill.nameEn}” instead of “${origSkill.nameEn}”?`,
    actual: actualSide,
    counterfactual: counterSide,
  };
}

export function runWhatIfFullStrategy(
  state: GameState,
  stage: StageNumber,
  policy: StrategyPolicyId
): WhatIfResult | null {
  const snap = state.stageSnapshots[stage];
  if (!snap || snap.chosenSkillSequence.length === 0) return null;

  const baseStageState = restoreStateFromStageSnapshot(state, snap);
  const origSeq = snap.chosenSkillSequence;
  const policyMeta = STRATEGY_POLICY_META[policy];

  const actualSide = simulateStageWithPlan(
    baseStageState,
    '실제 나의 대응 전략',
    'My Actual Stage Play',
    (cur, idx, rng) => {
      if (idx < origSeq.length && evaluateSkillPreview(cur, origSeq[idx]).usable) {
        return origSeq[idx];
      }
      return selectSkillByPolicy(cur, 'transparent_remedy', rng);
    }
  );

  const counterSide = simulateStageWithPlan(
    baseStageState,
    `대안 전략: [${policyMeta.nameKo}]`,
    `Alt Strategy: [${policyMeta.nameEn}]`,
    (cur, _idx, rng) => selectSkillByPolicy(cur, policy, rng)
  );

  return {
    stage,
    seedUsed: snap.rngStateAtStart,
    mode: 'full_strategy',
    questionKo: `만약 STAGE ${stage} 전체를 [${policyMeta.nameKo}] 전략으로 일관되게 대응했다면?`,
    questionEn: `What if you handled all of STAGE ${stage} using the [${policyMeta.nameEn}] strategy?`,
    actual: actualSide,
    counterfactual: counterSide,
  };
}

export function buildContextualWhatIfPresets(
  state: GameState,
  stage: StageNumber
): { labelKo: string; labelEn: string; turnIdx: number; altSkillId: string }[] {
  const snap = state.stageSnapshots[stage];
  if (!snap || snap.chosenSkillSequence.length === 0) return [];

  const presets: { labelKo: string; labelEn: string; turnIdx: number; altSkillId: string }[] = [];

  let simAtTurn = restoreStateFromStageSnapshot(state, snap);

  snap.chosenSkillSequence.forEach((skId, idx) => {
    const sk = PR_SKILLS_BY_ID[skId];
    if (sk && simAtTurn.phase === 'battle') {
      let altId = 'B14_internal_factcheck';
      if (skId === 'A05_dinner_drinks' || skId === 'A06_bomb_shot') {
        altId = 'A07_press_statement';
      } else if (sk.category === 'D') {
        altId = snap.unlockedSkillIdsAtStart.includes('C23_emergency_press_conf')
          ? 'C23_emergency_press_conf'
          : 'E35_official_apology';
      } else if (skId === 'A01_phone_call') {
        altId = snap.unlockedSkillIdsAtStart.includes('C20_legal_team')
          ? 'C20_legal_team'
          : 'B14_internal_factcheck';
      } else if (skId === 'B14_internal_factcheck') {
        altId = 'A05_dinner_drinks';
      } else if (sk.category === 'E') {
        altId = snap.unlockedSkillIdsAtStart.includes('D27_ad_leverage')
          ? 'D27_ad_leverage'
          : 'A08_background_briefing';
      } else {
        altId = snap.unlockedSkillIdsAtStart.includes('E39_substantive_reform')
          ? 'E39_substantive_reform'
          : 'E35_official_apology';
      }

      if (!evaluateSkillPreview(simAtTurn, altId).usable) {
        const fallbackUsable = snap.unlockedSkillIdsAtStart.find(
          (cand) => cand !== skId && evaluateSkillPreview(simAtTurn, cand).usable
        );
        if (fallbackUsable) altId = fallbackUsable;
      }

      if (altId !== skId && evaluateSkillPreview(simAtTurn, altId).usable) {
        const alt = PR_SKILLS_BY_ID[altId]!;
        presets.push({
          turnIdx: idx,
          altSkillId: altId,
          labelKo: `${idx + 1}턴: ‘${sk.nameKo}’ 대신 ‘${alt.nameKo}’을 선택했다면?`,
          labelEn: `Turn ${idx + 1}: “${alt.nameEn}” instead of “${sk.nameEn}”?`,
        });
      }
    }

    if (simAtTurn.phase === 'battle' && evaluateSkillPreview(simAtTurn, skId).usable) {
      simAtTurn = playBattleTurn(simAtTurn, skId, { fastSim: true });
    }
  });

  return presets.slice(0, 4);
}

// ==================== SECTION 4: MONTE CARLO SURVIVAL SIMULATOR ====================

export function runMonteCarloSurvival(params: {
  baseState?: GameState;
  companyScale?: CompanyScaleId;
  experienceYears?: number;
  startStage?: StageNumber;
  strategyPolicy: StrategyPolicyId;
  iterations: number;
  seed: number;
}): MonteCarloResult {
  const iterations = Math.max(10, Math.min(5000, Math.round(params.iterations)));
  const baseSeed = (params.seed >>> 0) || 20261103;
  const policy = params.strategyPolicy;

  let reachedStage6 = 0;
  let execPromoCount = 0;
  let anyVictoryCount = 0;
  let xpExhaustCount = 0;
  let hpExhaustCount = 0;
  let riskExplodeCount = 0;
  let repCollapseCount = 0;

  let sumXp = 0;
  let sumHp = 0;
  let sumRisk = 0;
  let sumRep = 0;

  const repBins = Array.from({ length: 10 }, (_, idx) => ({
    bucketLabel: idx === 9 ? '90–100' : `${idx * 10}–${idx * 10 + 9}`,
    min: idx * 10,
    max: idx === 9 ? 100 : idx * 10 + 9,
    count: 0,
    rate: 0,
  }));

  const stageTrack: Record<StageNumber, { survived: number; xp: number; hp: number; risk: number; rep: number; reached: number }> = {
    1: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
    2: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
    3: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
    4: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
    5: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
    6: { survived: 0, xp: 0, hp: 0, risk: 0, rep: 0, reached: 0 },
  };

  let effectiveStartStage: StageNumber = params.startStage ?? 1;
  let effectiveScale: CompanyScaleId = params.companyScale ?? 'midsize';

  // Pre-serialize base state once if provided (when mid-run)
  const hasActiveRun =
    params.baseState &&
    (params.baseState.phase === 'battle' ||
      params.baseState.phase === 'stage_result' ||
      params.baseState.phase === 'company_assigned');
  const serializedBase = hasActiveRun ? JSON.stringify(params.baseState) : null;

  if (hasActiveRun && params.baseState) {
    effectiveScale = params.baseState.company.scale;
    effectiveStartStage =
      params.baseState.phase === 'stage_result'
        ? (Math.min(6, params.baseState.currentStage + 1) as StageNumber)
        : params.baseState.currentStage;
  }

  for (let i = 0; i < iterations; i++) {
    const trialSeed = ((baseSeed + Math.imul(i + 1, 2654435761)) >>> 0) || (i + 7);
    const decisionRng = new SeededRNG(trialSeed ^ 0x85ebca6b);

    let sim: GameState;
    if (serializedBase) {
      sim = JSON.parse(serializedBase) as GameState;
      sim.telemetryLogs = [];
      sim.battleLogs = [];
      sim.stageSnapshots = {};
      sim.rngState = trialSeed;
      if (sim.phase === 'company_assigned') {
        sim = startStageBattle(sim, 1, { fastSim: true });
      } else if (sim.phase === 'stage_result') {
        if (sim.currentStage >= 6) {
          sim = proceedToNextStage(sim, { fastSim: true });
        } else {
          sim = startStageBattle(sim, (sim.currentStage + 1) as StageNumber, { fastSim: true });
        }
      }
    } else {
      const prof = {
        ...DEFAULT_PLAYER_PROFILE,
        experienceYears: params.experienceYears ?? 7,
      };
      sim = initializeNewRun(prof, { seed: trialSeed, forcedScale: effectiveScale });
      sim = startStageBattle(sim, effectiveStartStage, { fastSim: true });
    }

    let stepGuard = 0;
    while (sim.phase !== 'ending' && stepGuard < 80) {
      stepGuard += 1;
      const curStg = sim.currentStage;

      if (sim.phase === 'battle') {
        const picked = selectSkillByPolicy(sim, policy, decisionRng);
        if (!picked) {
          break;
        }
        sim = playBattleTurn(sim, picked, { fastSim: true });

        if (sim.phase === 'stage_result') {
          stageTrack[curStg].survived += 1;
          stageTrack[curStg].xp += sim.resources.xp;
          stageTrack[curStg].hp += sim.resources.hp;
          stageTrack[curStg].risk += sim.resources.risk;
          stageTrack[curStg].rep += sim.resources.reputation;
          stageTrack[curStg].reached += 1;
          sim = proceedToNextStage(sim, { fastSim: true });
        } else if (sim.phase === 'ending') {
          stageTrack[curStg].reached += 1;
          if (sim.endingSummary?.isVictory) {
            stageTrack[curStg].survived += 1;
          }
          stageTrack[curStg].xp += sim.resources.xp;
          stageTrack[curStg].hp += sim.resources.hp;
          stageTrack[curStg].risk += sim.resources.risk;
          stageTrack[curStg].rep += sim.resources.reputation;
        }
      } else if (sim.phase === 'stage_result') {
        sim = proceedToNextStage(sim, { fastSim: true });
      } else {
        break;
      }
    }

    if (sim.currentStage === 6 || sim.stageHistory.some((h) => h.stage === 6)) {
      reachedStage6 += 1;
    }

    const endId = sim.endingSummary?.endingId;
    if (
      endId === 'ending_exec_promotion' ||
      endId === 'ending_crisis_legend' ||
      endId === 'hidden_whistleblower_hero' ||
      endId === 'hidden_boutique_founder'
    ) {
      execPromoCount += 1;
      anyVictoryCount += 1;
    } else if (endId === 'ending_eternal_lead') {
      anyVictoryCount += 1;
    } else if (endId === 'ending_budget_exhausted') {
      xpExhaustCount += 1;
    } else if (endId === 'ending_overwork_hospital') {
      hpExhaustCount += 1;
    } else if (endId === 'ending_lobby_exposed') {
      riskExplodeCount += 1;
    } else {
      repCollapseCount += 1;
    }

    sumXp += sim.resources.xp;
    sumHp += sim.resources.hp;
    sumRisk += sim.resources.risk;
    sumRep += sim.resources.reputation;

    const binIdx = Math.min(9, Math.max(0, Math.floor(sim.resources.reputation / 10)));
    repBins[binIdx].count += 1;
  }

  const pct = (c: number) => Math.round((c / iterations) * 1000) / 10;

  repBins.forEach((b) => {
    b.rate = pct(b.count);
  });

  // Cumulative stage survival % across all trials
  const stageList: StageNumber[] = [1, 2, 3, 4, 5, 6];
  const stageSurvivalRates = stageList
    .filter((s) => s >= effectiveStartStage)
    .map((s) => {
      const tr = stageTrack[s];
      const denom = Math.max(1, tr.reached);
      return {
        stage: s,
        survivedRate: pct(tr.survived),
        avgXp: Math.round(tr.xp / denom),
        avgHp: Math.round(tr.hp / denom),
        avgRisk: Math.round(tr.risk / denom),
        avgRep: Math.round(tr.rep / denom),
      };
    });

  return {
    iterations,
    seedUsed: baseSeed,
    startStage: effectiveStartStage,
    companyScale: effectiveScale,
    strategyPolicy: policy,
    reachStage6Rate: pct(reachedStage6),
    execPromotionRate: pct(execPromoCount),
    anySurvivalVictoryRate: pct(anyVictoryCount),
    xpExhaustedRate: pct(xpExhaustCount),
    hpExhaustedRate: pct(hpExhaustCount),
    riskExplodedRate: pct(riskExplodeCount),
    reputationCollapsedRate: pct(repCollapseCount),
    avgFinalXp: Math.round(sumXp / iterations),
    avgFinalHp: Math.round(sumHp / iterations),
    avgFinalRisk: Math.round(sumRisk / iterations),
    avgFinalReputation: Math.round(sumRep / iterations),
    reputationDistribution: repBins,
    stageSurvivalRates,
  };
}

// ==================== SECTION 5: HONGDAM DATA LAB ANALYTICS ====================

export interface JournalistLabMetric {
  id: JournalistArchetypeId;
  nameKo: string;
  nameEn: string;
  badgeIcon: string;
  reportingPower: number;
  persistence: number;
  expertise: number;
  sourceNetwork: number;
  skillResistance: number;
  trustDifficulty: number;
  overallDifficulty: number;
  categoryMultiplierAvg: Record<SkillCategory, number>;
}

export function computeJournalistLabMetrics(): JournalistLabMetric[] {
  return JOURNALIST_ARCHETYPE_LIST.map((arch) => {
    const mid = (r: { min: number; max: number }) => Math.round((r.min + r.max) / 2);
    const reportingPower = mid(arch.statRanges.reportingPower);
    const persistence = mid(arch.statRanges.persistence);
    const expertise = mid(arch.statRanges.expertise);
    const sourceNetwork = mid(arch.statRanges.sourceNetwork);
    const initIntimacy = mid(arch.statRanges.intimacy);
    const initDistrust = mid(arch.statRanges.distrust);

    const catSums: Record<SkillCategory, { sum: number; cnt: number }> = {
      A: { sum: 0, cnt: 0 },
      B: { sum: 0, cnt: 0 },
      C: { sum: 0, cnt: 0 },
      D: { sum: 0, cnt: 0 },
      E: { sum: 0, cnt: 0 },
    };

    let backfireSum = 0;
    let totalPressMult = 0;

    PR_SKILLS.forEach((sk) => {
      const aff = sk.affinities[arch.id];
      const pMult = aff ? aff.pressureMultiplier : 1.0;
      const bf = aff ? aff.backfireChanceBonus : 0;
      catSums[sk.category].sum += pMult;
      catSums[sk.category].cnt += 1;
      totalPressMult += pMult;
      backfireSum += bf;
    });

    const avgPressMult = totalPressMult / PR_SKILLS.length;
    // Higher resistance if average multiplier is lower or backfire sum is high
    const skillResistance = Math.min(
      98,
      Math.max(25, Math.round((1.35 - avgPressMult) * 85 + backfireSum * 11))
    );
    const trustDifficulty = Math.min(
      98,
      Math.max(25, Math.round((100 - initIntimacy) * 0.55 + initDistrust * 0.45))
    );

    const overallDifficulty = Math.round(
      (reportingPower + persistence + expertise + skillResistance + trustDifficulty) / 5
    );

    const categoryMultiplierAvg: Record<SkillCategory, number> = {
      A: Math.round((catSums.A.sum / catSums.A.cnt) * 100) / 100,
      B: Math.round((catSums.B.sum / catSums.B.cnt) * 100) / 100,
      C: Math.round((catSums.C.sum / catSums.C.cnt) * 100) / 100,
      D: Math.round((catSums.D.sum / catSums.D.cnt) * 100) / 100,
      E: Math.round((catSums.E.sum / catSums.E.cnt) * 100) / 100,
    };

    return {
      id: arch.id,
      nameKo: arch.nameKo,
      nameEn: arch.nameEn,
      badgeIcon: arch.badgeIcon,
      reportingPower,
      persistence,
      expertise,
      sourceNetwork,
      skillResistance,
      trustDifficulty,
      overallDifficulty,
      categoryMultiplierAvg,
    };
  });
}

export interface SkillBubbleDatum {
  id: string;
  num: number;
  nameKo: string;
  nameEn: string;
  category: SkillCategory;
  xpCost: number;
  hpCost: number;
  riskDelta: number;
  expectedEffectiveness: number; // Composite persuasion + reputation + tactical value
  expectedPressureReduction: number;
  backfireRiskPct: number;
}

export function computeSkillEfficiencyBubbles(
  archetype: JournalistArchetypeId | 'all',
  stage: StageNumber,
  companyScale: CompanyScaleId
): SkillBubbleDatum[] {
  const scaleDef = COMPANY_SCALES[companyScale];
  const companyStub = {
    scale: companyScale,
    industry: 'platform' as const,
    execTrait: 'data_driven' as const,
    initialXp: scaleDef.initialXp,
    xpCostMultiplier: scaleDef.xpCostMultiplier,
    pressureMultiplier: scaleDef.pressureMultiplier,
    reputationSensitivity: scaleDef.reputationSensitivity,
  };

  return PR_SKILLS.map((sk) => {
    const xpCost = computeEffectiveXpCost(sk, companyStub);
    const hpCost = computeEffectiveHpCost(sk, companyStub, 7);

    let pMult = 1.0;
    let tMult = 1.0;
    let riskExtra = 0;
    let bfChance = 0;

    if (archetype === 'all') {
      const archKeys = Object.keys(JOURNALIST_ARCHETYPES) as JournalistArchetypeId[];
      let sumP = 0;
      let sumT = 0;
      let sumR = 0;
      let sumB = 0;
      archKeys.forEach((ak) => {
        const aff = sk.affinities[ak];
        sumP += aff ? aff.pressureMultiplier : 1.0;
        sumT += aff ? aff.trustMultiplier : 1.0;
        sumR += aff ? aff.riskExtra : 0;
        sumB += aff ? aff.backfireChanceBonus : 0;
      });
      pMult = sumP / archKeys.length;
      tMult = sumT / archKeys.length;
      riskExtra = sumR / archKeys.length;
      bfChance = sumB / archKeys.length;
    } else {
      const aff = sk.affinities[archetype];
      if (aff) {
        pMult = aff.pressureMultiplier;
        tMult = aff.trustMultiplier;
        riskExtra = aff.riskExtra;
        bfChance = aff.backfireChanceBonus;
      }
    }

    // Stage synergy bonus
    let stageBonus = 0;
    if (sk.mechanic === 'audit_disclosure' && (stage === 3 || stage === 6)) stageBonus += 8;
    if (sk.mechanic === 'verify_whistleblower' && stage === 2) stageBonus += 7;
    if (sk.mechanic === 'victim_compensation' && (stage === 1 || stage === 2)) stageBonus += 7;
    if (sk.mechanic === 'legal_shield' && stage === 5) stageBonus += 6;
    if (sk.mechanic === 'grant_vp_xp') stageBonus += 18;
    if (sk.mechanic === 'owner_banquet_xp') stageBonus += 24;
    if (sk.mechanic === 'emergency_rest') stageBonus += 20;
    if (sk.mechanic === 'verify_facts' || sk.mechanic === 'convene_tf') stageBonus += 10;

    const rawPressReduction = -sk.pressureDelta * pMult;
    // Penalize expected value by backfire probability
    const expectedPressReduction = Math.round(
      rawPressReduction * (1 - bfChance) - Math.abs(sk.pressureDelta * 0.6) * bfChance
    );
    const trustContribution = sk.trustDelta * tMult * 0.45;
    const repContribution = sk.reputationDelta * 1.1;
    const riskPenalty = Math.max(0, sk.riskDelta + riskExtra) * 0.35;

    const expectedEffectiveness = Math.round(
      (expectedPressReduction + trustContribution + repContribution + stageBonus - riskPenalty) * 10
    ) / 10;

    return {
      id: sk.id,
      num: sk.num,
      nameKo: sk.nameKo,
      nameEn: sk.nameEn,
      category: sk.category,
      xpCost,
      hpCost,
      riskDelta: Math.round(sk.riskDelta + riskExtra),
      expectedEffectiveness,
      expectedPressureReduction: expectedPressReduction,
      backfireRiskPct: Math.round(bfChance * 100),
    };
  });
}

export function computeStageCrisisProfiles(companyScale: CompanyScaleId) {
  const scaleDef = COMPANY_SCALES[companyScale];
  return ([1, 2, 3, 4, 5, 6] as StageNumber[]).map((stg) => {
    const def = STAGES[stg];
    const startPressure = Math.round(def.basePressure * (0.9 + (scaleDef.pressureMultiplier - 1) * 0.45));
    const estXpNeeded = Math.round((42 + stg * 14) * scaleDef.xpCostMultiplier);
    const estHpNeeded = Math.round(24 + stg * 5);
    const repImpactPotential = Math.round((12 + stg * 4) * scaleDef.reputationSensitivity);
    return {
      stage: stg,
      stars: def.stars,
      titleKo: def.titleKo,
      titleEn: def.titleEn,
      themeKo: def.themeBadgeKo,
      themeEn: def.themeBadgeEn,
      startPressure,
      deadlineTurns: def.baseDeadline,
      isCoReporting: def.isCoReporting,
      estXpNeeded,
      estHpNeeded,
      repImpactPotential,
    };
  });
}

/**
 * Summarizes actual player telemetry logs for Stage Post-Analysis & Final Data Journalism Report.
 */
export function summarizeStageTelemetry(logs: ActionTelemetryRecord[], stage: StageNumber) {
  const stgLogs = logs.filter((l) => l.stage === stage);
  if (stgLogs.length === 0) return null;

  const first = stgLogs[0];
  const last = stgLogs[stgLogs.length - 1];

  const totalXpSpent = stgLogs.reduce((acc, l) => acc + Math.max(0, -l.playerSkillDeltas.xp), 0);
  const totalXpRecovered = stgLogs.reduce((acc, l) => acc + Math.max(0, l.netTurnDeltas.xp), 0);
  const totalHpSpent = stgLogs.reduce((acc, l) => acc + Math.max(0, -l.netTurnDeltas.hp), 0);
  const netReputationDelta = last.afterTurnComplete.reputation - first.before.reputation;
  const netTrustDelta = last.afterTurnComplete.trust - first.before.trust;
  const netRiskDelta = last.afterTurnComplete.risk - first.before.risk;

  const skillEfficiencyList = stgLogs.map((l) => {
    const sk = PR_SKILLS_BY_ID[l.skillId];
    const costWeight = Math.max(4, Math.abs(l.playerSkillDeltas.xp) + Math.max(0, -l.playerSkillDeltas.hp));
    const pressDrop = -l.playerSkillDeltas.pressure;
    const effRatio = Math.round(((pressDrop + l.playerSkillDeltas.trust * 0.5) / costWeight) * 100) / 100;
    return {
      turn: l.stageTurn,
      skillId: l.skillId,
      skillNameKo: sk?.nameKo || l.skillId,
      skillNameEn: sk?.nameEn || l.skillId,
      xpDelta: l.playerSkillDeltas.xp,
      hpDelta: l.playerSkillDeltas.hp,
      pressureDelta: l.playerSkillDeltas.pressure,
      trustDelta: l.playerSkillDeltas.trust,
      riskDelta: l.playerSkillDeltas.risk,
      outcome: l.skillOutcome,
      effRatio,
    };
  });

  const bestMove = [...skillEfficiencyList].sort((a, b) => a.pressureDelta - b.pressureDelta)[0];
  const worstMove = [...skillEfficiencyList].sort(
    (a, b) => (b.pressureDelta + b.riskDelta) - (a.pressureDelta + a.riskDelta)
  )[0];

  return {
    stage,
    logs: stgLogs,
    initialPressure: first.before.pressure,
    finalPressure: last.afterTurnComplete.pressure,
    totalXpSpent,
    totalXpRecovered,
    totalHpSpent,
    netReputationDelta,
    netTrustDelta,
    netRiskDelta,
    skillEfficiencyList,
    bestMove,
    worstMove,
  };
}
