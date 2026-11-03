import {
  ActionTelemetryRecord,
  AssignedCompany,
  BattleLogEntry,
  Character3DAction,
  CompanyScaleId,
  EndingId,
  GameState,
  InternalCredibility,
  PRPlayerProfile,
  ResourcePointSnapshot,
  StageBattleState,
  StageBuffs,
  StageHistoryEntry,
  StageNumber,
  StageReplaySnapshot,
} from '../types/game';
import {
  checkResemblesRealCompany,
  COMPANY_SCALE_LIST,
  COMPANY_SCALES,
  EXEC_TRAIT_LIST,
  INDUSTRIES,
  INDUSTRY_LIST,
} from '../data/companies';
import { PR_SKILLS, PR_SKILLS_BY_ID } from '../data/skills';
import { OWNER_RISK_VARIANT_LIST, STAGES } from '../data/stages';
import { BALANCE, clamp } from './balanceConfig';
import {
  buildEndingSummary,
  determineFinalVictoryEnding,
  isXpCompletelyExhausted,
} from './endingEngine';
import { rollSuddenEvent } from './eventEngine';
import { executeJournalistCounterTurn, spawnStageJournalists } from './journalistEngine';
import {
  calculateStageRewards,
  determineStageResolution,
  STAGE_RESOLUTION_META,
} from './progressionEngine';
import { SeededRNG } from './rng';
import { evaluateSkillPreview, executePlayerSkill } from './skillEngine';

export const GAME_STATE_VERSION = 3;

export const DEFAULT_PLAYER_PROFILE: PRPlayerProfile = {
  name: '김홍담',
  companyName: '한빛테크놀로지',
  resemblesRealCompany: false,
  experienceYears: 7,
  rankKo: '홍보팀장',
  rankEn: 'PR Team Lead',
  appearance: {
    skinTone: '#f3cfb3',
    hairStyle: 'neat',
    hairColor: '#1e293b',
    suitColor: '#1e3a8a',
    tieColor: '#dc2626',
    glasses: false,
    expression: 'determined',
  },
};

export function createEmptyBuffs(): StageBuffs {
  return {
    factChecked: false,
    disclosureAudited: false,
    whistleblowerVerified: false,
    tfTurnsLeft: 0,
    sentimentShieldTurns: 0,
    legalShieldActive: false,
    consultantActive: false,
    agencyActiveTurns: 0,
    deadlineChecked: false,
    hangoverNextTurn: false,
    dataMismatchDebuff: false,
    legalPrConflict: false,
    apologyIssued: false,
    reformIssued: false,
    compensationIssued: false,
  };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function createPlaceholderGameState(): GameState {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const scaleDef = COMPANY_SCALES.midsize;
  return {
    version: GAME_STATE_VERSION,
    playId: `play_${seed}`,
    seed,
    rngState: seed,
    phase: 'character_create',
    player: { ...DEFAULT_PLAYER_PROFILE },
    company: {
      scale: 'midsize',
      industry: 'platform',
      execTrait: 'data_driven',
      initialXp: scaleDef.initialXp,
      xpCostMultiplier: scaleDef.xpCostMultiplier,
      pressureMultiplier: scaleDef.pressureMultiplier,
      reputationSensitivity: scaleDef.reputationSensitivity,
    },
    resources: {
      xp: scaleDef.initialXp,
      initialXp: scaleDef.initialXp,
      hp: BALANCE.INITIAL_HP,
      maxHp: BALANCE.MAX_HP,
      risk: BALANCE.INITIAL_RISK,
      reputation: BALANCE.INITIAL_REPUTATION,
      careerScore: 0,
    },
    currentStage: 1,
    stageBattle: null,
    lastStageSummary: null,
    stageHistory: [],
    journalistPool: [],
    unlockedSkillIds: PR_SKILLS.filter((s) => s.minStage === 1).map((s) => s.id),
    skillUsageCounts: {},
    battleLogs: [],
    telemetryLogs: [],
    stageSnapshots: {},
    visualCue: {
      playerAction: 'idle',
      journalistAction: 'idle',
      propType: 'idle',
      timestamp: Date.now(),
    },
    endingSummary: null,
  };
}

export function initializeNewRun(
  profileInput: PRPlayerProfile,
  options?: { seed?: number; forcedScale?: CompanyScaleId }
): GameState {
  const seed = (options?.seed ?? ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0)) || 987654321;
  const rng = new SeededRNG(seed);

  const cleanCompanyName = profileInput.companyName.trim() || '한빛그룹';
  const cleanPlayerName = profileInput.name.trim() || '김홍담';

  const player: PRPlayerProfile = {
    ...profileInput,
    name: cleanPlayerName,
    companyName: cleanCompanyName,
    resemblesRealCompany: checkResemblesRealCompany(cleanCompanyName),
    rankKo: '홍보팀장',
    rankEn: 'PR Team Lead',
  };

  const scaleDef = options?.forcedScale
    ? COMPANY_SCALES[options.forcedScale]
    : rng.pick(COMPANY_SCALE_LIST);
  const industryDef = rng.pick(INDUSTRY_LIST);
  const traitDef = rng.pick(EXEC_TRAIT_LIST);

  const company: AssignedCompany = {
    scale: scaleDef.id,
    industry: industryDef.id,
    execTrait: traitDef.id,
    initialXp: scaleDef.initialXp,
    xpCostMultiplier: scaleDef.xpCostMultiplier,
    pressureMultiplier: scaleDef.pressureMultiplier,
    reputationSensitivity: scaleDef.reputationSensitivity,
  };

  // Veteran PR chiefs (10+ yrs) unlock Stage 2 intel skills slightly earlier
  const baseStageUnlock = player.experienceYears >= 10 ? 2 : 1;
  const unlockedSkillIds = PR_SKILLS.filter((s) =>
    s.minStage === 1 || (s.minStage === 2 && s.category === 'B' && baseStageUnlock >= 2)
  ).map((s) => s.id);

  return {
    version: GAME_STATE_VERSION,
    playId: `run_${seed}_${Date.now()}`,
    seed,
    rngState: rng.state,
    phase: 'company_assigned',
    player,
    company,
    resources: {
      xp: company.initialXp,
      initialXp: company.initialXp,
      hp: BALANCE.INITIAL_HP,
      maxHp: BALANCE.MAX_HP,
      risk: BALANCE.INITIAL_RISK,
      reputation: BALANCE.INITIAL_REPUTATION,
      careerScore: 0,
    },
    currentStage: 1,
    stageBattle: null,
    lastStageSummary: null,
    stageHistory: [],
    journalistPool: [],
    unlockedSkillIds,
    skillUsageCounts: {},
    battleLogs: [],
    telemetryLogs: [],
    stageSnapshots: {},
    visualCue: {
      playerAction: 'idle',
      journalistAction: 'notebook_out',
      propType: 'idle',
      timestamp: Date.now(),
    },
    endingSummary: null,
  };
}

export function startStageBattle(
  state: GameState,
  stage: StageNumber,
  opts?: { fastSim?: boolean }
): GameState {
  const next = opts?.fastSim ? state : deepClone(state);
  const rng = new SeededRNG(next.rngState);
  const stageDef = STAGES[stage];
  const compName = next.player.companyName;

  // Ensure all skills up to `stage` are unlocked
  const unlockedSet = new Set(next.unlockedSkillIds);
  PR_SKILLS.forEach((s) => {
    if (s.minStage <= stage) unlockedSet.add(s.id);
  });
  next.unlockedSkillIds = Array.from(unlockedSet);

  // Build headline & variant
  let headlineKo = stageDef.defaultHeadlineKo.replace('{company}', compName);
  let headlineEn = stageDef.defaultHeadlineEn.replace('{company}', compName);
  let subheadKo = stageDef.subheadKo;
  let subheadEn = stageDef.subheadEn;
  let ownerVariant = undefined;

  if (stage === 1) {
    const ind = INDUSTRIES[next.company.industry];
    headlineKo = `“[단독] ${compName}, ${ind.stage1IssueKo}”`;
    headlineEn = `“[Exclusive] ${compName}: ${ind.stage1IssueEn}”`;
  } else if (stage === 6) {
    const pickedVar = rng.pick(OWNER_RISK_VARIANT_LIST);
    ownerVariant = pickedVar.id;
    headlineKo = pickedVar.headlineKo.replace('{company}', compName);
    headlineEn = pickedVar.headlineEn.replace('{company}', compName);
    subheadKo = pickedVar.subheadKo;
    subheadEn = pickedVar.subheadEn;
  }

  // Internal credibility for whistleblower/document stages
  const credOptions: InternalCredibility[] = ['solid_company', 'mixed_fault', 'whistleblower_truth'];
  const internalCredibility = rng.pick(credOptions);

  // Spawn 1 or 2 journalists (integrating Journalist Memory Pool!)
  const { active, updatedPool } = spawnStageJournalists(
    stage,
    next.player.experienceYears,
    next.journalistPool,
    rng
  );
  next.journalistPool = updatedPool;

  // Starting pressure modulated by company scale + cumulative karma in Stage 6
  let startPressure = Math.round(stageDef.basePressure * (0.9 + (next.company.pressureMultiplier - 1) * 0.45));
  if (next.company.execTrait === 'owner_centric' && stage >= 5) {
    startPressure += 4;
  }
  if (stage === 6) {
    // Cumulative history effect!
    if (next.resources.risk >= 55) startPressure += 7;
    else if (next.resources.risk <= 15 && next.resources.reputation >= 65) startPressure -= 6;
  }
  startPressure = clamp(startPressure, 32, 85);

  const battle: StageBattleState = {
    stage,
    headlineKo,
    headlineEn,
    subheadKo,
    subheadEn,
    pressure: startPressure,
    deadline: stageDef.baseDeadline,
    maxDeadline: stageDef.baseDeadline,
    turnNumber: 1,
    internalCredibility,
    ownerVariant,
    journalists: active,
    cooldowns: {},
    buffs: createEmptyBuffs(),
    sameCategoryStreak: 0,
    triggeredEventIds: [],
  };

  next.currentStage = stage;
  next.stageBattle = battle;
  next.phase = 'battle';
  next.rngState = rng.state;

  const introLog: BattleLogEntry = {
    id: `log_stg${stage}_open_${Date.now()}`,
    turn: 0,
    actor: 'system',
    titleKo: `🚨 ${stageDef.titleKo} 개시!`,
    titleEn: `🚨 ${stageDef.titleEn} Begins!`,
    bodyKo: `${headlineKo} — 담당: ${active.map((j) => `${j.outletKo} ${j.nameKo}`).join(', ')} (마감 ${battle.deadline}턴)`,
    bodyEn: `${headlineEn} — Assigned: ${active.map((j) => `${j.nameEn} (${j.outletEn})`).join(', ')} (${battle.deadline} turns left)`,
    badgeKo: stageDef.stars,
    badgeEn: stageDef.stars,
    tone: 'warn',
  };

  const memoryLogs: BattleLogEntry[] = active
    .filter((j) => j.isReturning && j.returningNoteKo)
    .map((j, idx) => ({
      id: `log_mem_${stage}_${idx}_${Date.now()}`,
      turn: 0,
      actor: 'journalist',
      titleKo: `🧠 [기자 기억 발동] ${j.outletKo} ${j.nameKo}`,
      titleEn: `🧠 [Reporter Memory] ${j.nameEn} (${j.outletEn})`,
      bodyKo: j.returningNoteKo!,
      bodyEn: j.returningNoteEn!,
      tone: j.returningNoteKo!.includes('신뢰') ? 'good' : 'bad',
    }));

  next.battleLogs = [...memoryLogs, introLog];
  next.visualCue = {
    playerAction: 'idle',
    journalistAction: stage === 5 ? 'prosecution_van' : stage === 6 ? 'final_boss_aura' : 'notebook_out',
    propType: stage === 5 ? 'prosecution_van' : stage === 6 ? 'final_boss_aura' : 'idle',
    journalistSpeechKo: active[0].currentDialogueKo,
    journalistSpeechEn: active[0].currentDialogueEn,
    timestamp: Date.now(),
  };

  // Save deterministic StageReplaySnapshot for WHAT-IF counterfactuals!
  if (!opts?.fastSim) {
    const snapshot: StageReplaySnapshot = {
      stage,
      rngStateAtStart: next.rngState,
      resourcesAtStart: deepClone(next.resources),
      stageBattleAtStart: deepClone(battle),
      journalistPoolAtStart: deepClone(next.journalistPool),
      unlockedSkillIdsAtStart: [...next.unlockedSkillIds],
      skillUsageCountsAtStart: { ...next.skillUsageCounts },
      chosenSkillSequence: [],
    };
    next.stageSnapshots[stage] = snapshot;
  }

  return next;
}

function finalizeGameEnding(state: GameState, endingId: EndingId): GameState {
  state.phase = 'ending';
  state.endingSummary = buildEndingSummary(state, endingId);
  // Stamp finalEndingId on all telemetry records of this playId
  state.telemetryLogs = state.telemetryLogs.map((rec) =>
    rec.playId === state.playId ? { ...rec, finalEndingId: endingId } : rec
  );
  return state;
}

export function triggerVoluntaryResignation(state: GameState): GameState {
  const next = deepClone(state);
  next.visualCue = {
    playerAction: 'resignation_exit',
    journalistAction: 'shocked',
    propType: 'resignation_exit',
    playerSpeechKo: '사직서 제출합니다! 이 기사부터는 후임자랑 통화하세요!',
    playerSpeechEn: 'Here is my resignation! Take this headline up with my successor!',
    timestamp: Date.now(),
  };
  return finalizeGameEnding(next, 'ending_resignation_escape');
}

export function playBattleTurn(
  state: GameState,
  skillId: string,
  opts?: { fastSim?: boolean }
): GameState {
  const preview = evaluateSkillPreview(state, skillId);
  if (!preview.usable || !state.stageBattle) {
    return state;
  }

  const next = opts?.fastSim ? state : deepClone(state);
  const battle = next.stageBattle!;
  const skill = PR_SKILLS_BY_ID[skillId];
  const rng = new SeededRNG(next.rngState);
  const stageDef = STAGES[battle.stage];
  const turnNum = battle.turnNumber;

  const beforeSnap: ResourcePointSnapshot = {
    xp: next.resources.xp,
    hp: next.resources.hp,
    risk: next.resources.risk,
    reputation: next.resources.reputation,
    trust: battle.journalists[0].stats.intimacy,
    pressure: battle.pressure,
    deadline: battle.deadline,
  };

  // Record chosen skill in replay snapshot
  if (next.stageSnapshots[battle.stage]) {
    next.stageSnapshots[battle.stage]!.chosenSkillSequence.push(skillId);
  }

  // 1. Execute player skill
  const skillRes = executePlayerSkill(next, skillId, rng);
  next.journalistPool = skillRes.updatedPool;
  battle.buffs = skillRes.updatedBuffs;

  // Update category streak
  if (battle.lastCategory === skill.category) {
    battle.sameCategoryStreak += 1;
  } else {
    battle.lastCategory = skill.category;
    battle.sameCategoryStreak = 1;
  }
  battle.lastUsedSkillId = skillId;
  next.skillUsageCounts[skillId] = (next.skillUsageCounts[skillId] || 0) + 1;

  // Apply player resource deltas
  next.resources.xp = Math.max(0, next.resources.xp + skillRes.xpDelta);
  next.resources.hp = clamp(next.resources.hp + skillRes.hpDelta, 0, next.resources.maxHp);
  next.resources.risk = clamp(next.resources.risk + skillRes.riskDelta, 0, BALANCE.MAX_RISK);
  next.resources.reputation = clamp(next.resources.reputation + skillRes.reputationDelta, 0, BALANCE.MAX_REPUTATION);
  battle.pressure = clamp(battle.pressure + skillRes.pressureDelta, BALANCE.MIN_PRESSURE, BALANCE.MAX_PRESSURE);
  battle.deadline = Math.max(1, battle.deadline + skillRes.deadlineDelta);

  const afterPlayerSnap: ResourcePointSnapshot = {
    xp: next.resources.xp,
    hp: next.resources.hp,
    risk: next.resources.risk,
    reputation: next.resources.reputation,
    trust: battle.journalists[0].stats.intimacy,
    pressure: battle.pressure,
    deadline: battle.deadline,
  };

  const newLogs: BattleLogEntry[] = [
    {
      id: `log_p_${battle.stage}_${turnNum}_${rng.int(100, 999)}`,
      turn: turnNum,
      actor: 'player',
      titleKo: skillRes.logTitleKo,
      titleEn: skillRes.logTitleEn,
      bodyKo: skillRes.logBodyKo,
      bodyEn: skillRes.logBodyEn,
      tone: skillRes.outcome === 'backfire' ? 'bad' : skillRes.outcome === 'great' ? 'good' : 'info',
    },
  ];

  // Decrement existing cooldowns, then apply skill cooldown
  const nextCooldowns: Record<string, number> = {};
  Object.entries(battle.cooldowns).forEach(([k, v]) => {
    if (v > 1) nextCooldowns[k] = v - 1;
  });
  if (skill.cooldown > 0) {
    nextCooldowns[skillId] = skill.cooldown;
  }
  battle.cooldowns = nextCooldowns;

  // Helper to check immediate Game Over
  const checkImmediateGameOver = (): EndingId | null => {
    if (next.resources.hp <= 0) return 'ending_overwork_hospital';
    if (next.resources.risk >= BALANCE.MAX_RISK) return 'ending_lobby_exposed';
    if (next.resources.reputation <= 0) return 'ending_owner_scapegoat';
    return null;
  };

  let triggeredEventId: string | undefined;
  let triggeredEventTitleKo: string | undefined;
  let triggeredEventTitleEn: string | undefined;
  let enemySkillUsed: ActionTelemetryRecord['enemySkillId'];
  let resolvedType: ActionTelemetryRecord['stageResolution'] = 'in_progress';

  let gameOverId = checkImmediateGameOver();

  // Check Early Clear (Scoop Withdrawn!) before enemy attacks
  let earlyCleared = !gameOverId && battle.pressure <= BALANCE.EARLY_CLEAR_PRESSURE;

  if (!gameOverId && !earlyCleared) {
    // 2. Sudden Event Roll
    const suddenEv = rollSuddenEvent(next, skillId, rng);
    if (suddenEv) {
      triggeredEventId = suddenEv.id;
      triggeredEventTitleKo = suddenEv.titleKo;
      triggeredEventTitleEn = suddenEv.titleEn;
      battle.triggeredEventIds.push(suddenEv.id);

      next.resources.xp = Math.max(0, next.resources.xp + suddenEv.xpDelta);
      next.resources.hp = clamp(next.resources.hp + suddenEv.hpDelta, 0, next.resources.maxHp);
      next.resources.risk = clamp(next.resources.risk + suddenEv.riskDelta, 0, BALANCE.MAX_RISK);
      next.resources.reputation = clamp(next.resources.reputation + suddenEv.reputationDelta, 0, BALANCE.MAX_REPUTATION);
      battle.pressure = clamp(battle.pressure + suddenEv.pressureDelta, 0, 100);
      battle.deadline = Math.max(1, battle.deadline + suddenEv.deadlineDelta);
      battle.journalists[0].stats.intimacy = clamp(
        battle.journalists[0].stats.intimacy + suddenEv.trustDelta,
        0,
        100
      );

      if (suddenEv.setFlag) {
        battle.buffs[suddenEv.setFlag] = true;
      }

      newLogs.push({
        id: `log_ev_${battle.stage}_${turnNum}_${suddenEv.id}`,
        turn: turnNum,
        actor: 'event',
        titleKo: `⚡ [돌발 이벤트] ${suddenEv.titleKo}`,
        titleEn: `⚡ [Sudden Event] ${suddenEv.titleEn}`,
        bodyKo: suddenEv.descKo,
        bodyEn: suddenEv.descEn,
        tone: suddenEv.tone,
      });

      gameOverId = checkImmediateGameOver();
      earlyCleared = !gameOverId && battle.pressure <= BALANCE.EARLY_CLEAR_PRESSURE;
    }
  }

  let enemyAction3D: Character3DAction = battle.journalists[0].isLead ? 'notebook_out' : 'idle';

  if (!gameOverId && !earlyCleared) {
    // 3. Journalist Counter-Attack
    const counter = executeJournalistCounterTurn(
      battle,
      next.company.scale,
      next.company.pressureMultiplier,
      next.resources.risk,
      rng
    );
    enemySkillUsed = counter.skillId;
    battle.journalists[0].nextPlannedSkillId = counter.nextPlannedSkillId;

    battle.pressure = clamp(battle.pressure + counter.pressureDelta, 0, 100);
    battle.journalists[0].stats.evidenceLevel = clamp(
      battle.journalists[0].stats.evidenceLevel + counter.evidenceDelta,
      0,
      100
    );
    next.resources.reputation = clamp(next.resources.reputation + counter.reputationDelta, 0, 100);
    next.resources.hp = clamp(next.resources.hp + counter.hpStressDelta, 0, next.resources.maxHp);

    // Tick down duration buffs after guarding counter-turn
    if (battle.buffs.tfTurnsLeft > 0) battle.buffs.tfTurnsLeft -= 1;
    if (battle.buffs.sentimentShieldTurns > 0) battle.buffs.sentimentShieldTurns -= 1;
    if (battle.buffs.agencyActiveTurns > 0) battle.buffs.agencyActiveTurns -= 1;

    newLogs.push({
      id: `log_j_${battle.stage}_${turnNum}_${rng.int(100, 999)}`,
      turn: turnNum,
      actor: 'journalist',
      titleKo: counter.logTitleKo,
      titleEn: counter.logTitleEn,
      bodyKo: counter.logBodyKo,
      bodyEn: counter.logBodyEn,
      tone: 'warn',
    });

    // Advance deadline & turn
    battle.deadline = Math.max(0, battle.deadline - 1);
    battle.turnNumber += 1;

    gameOverId = checkImmediateGameOver();
    enemyAction3D = counter.skillId === 'exclusive_draft' || counter.skillId === 'disclosure_analysis' ? 'laptop_typing' : 'notebook_out';
  }

  // Update visual cue
  next.visualCue = {
    playerAction: skill.action3D,
    journalistAction: skillRes.outcome === 'backfire' ? 'angry_point' : enemyAction3D,
    propType: skill.action3D,
    playerSpeechKo: skill.nameKo,
    playerSpeechEn: skill.nameEn,
    journalistSpeechKo: skillRes.journalistReplyKo,
    journalistSpeechEn: skillRes.journalistReplyEn,
    timestamp: Date.now(),
  };

  next.rngState = rng.state;

  // Stage resolution or Game Over evaluation
  if (!gameOverId && (earlyCleared || battle.deadline <= 0 || battle.pressure <= BALANCE.EARLY_CLEAR_PRESSURE)) {
    const { resolution, grade } = determineStageResolution(battle, next.resources);
    resolvedType = resolution;

    const rewards = calculateStageRewards(
      battle.stage,
      resolution,
      grade,
      next.company,
      next.resources
    );

    next.resources = rewards.updatedResources;
    rewards.newlyUnlockedSkillIds.forEach((id) => {
      if (!next.unlockedSkillIds.includes(id)) next.unlockedSkillIds.push(id);
    });

    const summary: StageHistoryEntry = {
      stage: battle.stage,
      headlineKo: battle.headlineKo,
      headlineEn: battle.headlineEn,
      resolution,
      grade,
      finalPressure: battle.pressure,
      xpReward: rewards.xpReward,
      hpReward: rewards.hpReward,
      reputationShift: rewards.reputationShift,
      leadJournalistNameKo: `${battle.journalists[0].outletKo} ${battle.journalists[0].nameKo}`,
      leadJournalistNameEn: `${battle.journalists[0].nameEn} (${battle.journalists[0].outletEn})`,
    };

    next.lastStageSummary = summary;
    next.stageHistory.push(summary);

    const resMeta = STAGE_RESOLUTION_META[resolution];
    newLogs.push({
      id: `log_res_${battle.stage}_${Date.now()}`,
      turn: turnNum,
      actor: 'system',
      titleKo: `🏁 STAGE ${battle.stage} 결과: [${resMeta.nameKo}] (등급 ${grade})`,
      titleEn: `🏁 STAGE ${battle.stage} Result: [${resMeta.nameEn}] (Grade ${grade})`,
      bodyKo: resMeta.descKo,
      bodyEn: resMeta.descEn,
      tone: resMeta.isSuccess ? 'good' : 'bad',
    });

    // Check post-resolution reputation collapse, repeated defense failures, or Stage 6 finale
    const totalFailures = next.stageHistory.filter((h) => h.resolution === 'damaging_report').length;
    if (next.resources.reputation <= 0) {
      gameOverId = 'ending_owner_scapegoat';
    } else if (next.resources.risk >= BALANCE.MAX_RISK) {
      gameOverId = 'ending_lobby_exposed';
    } else if (resolution === 'damaging_report' && (battle.stage === 6 || totalFailures >= 2 || next.resources.reputation <= 22)) {
      gameOverId = 'ending_owner_scapegoat';
    } else if (battle.stage === 6) {
      const finalEnd = determineFinalVictoryEnding(next);
      gameOverId = finalEnd;
    } else {
      next.phase = 'stage_result';
    }
  } else if (!gameOverId) {
    // Mid-stage XP exhaustion check
    if (isXpCompletelyExhausted(next)) {
      gameOverId = 'ending_budget_exhausted';
    }
  }

  const afterTurnSnap: ResourcePointSnapshot = {
    xp: next.resources.xp,
    hp: next.resources.hp,
    risk: next.resources.risk,
    reputation: next.resources.reputation,
    trust: battle.journalists[0].stats.intimacy,
    pressure: battle.pressure,
    deadline: battle.deadline,
  };

  // Append structured telemetry log (Section 1 of Data Journalism Spec)
  const telemetryEntry: ActionTelemetryRecord = {
    id: `tel_${next.playId}_s${battle.stage}_t${turnNum}`,
    playId: next.playId,
    timestamp: Date.now(),
    stage: battle.stage,
    stageTurn: turnNum,
    globalTurn: next.telemetryLogs.length + 1,
    companyScale: next.company.scale,
    industry: next.company.industry,
    journalistArchetype: battle.journalists[0].archetype,
    journalistNameKo: `${battle.journalists[0].outletKo} ${battle.journalists[0].nameKo}`,
    journalistNameEn: `${battle.journalists[0].nameEn} (${battle.journalists[0].outletEn})`,
    journalistStats: { ...battle.journalists[0].stats },
    articleTypeKo: stageDef.themeBadgeKo,
    articleTypeEn: stageDef.themeBadgeEn,
    headlineKo: battle.headlineKo,
    headlineEn: battle.headlineEn,
    severity: battle.stage,
    skillId,
    skillCategory: skill.category,
    before: beforeSnap,
    afterPlayerAction: afterPlayerSnap,
    afterTurnComplete: afterTurnSnap,
    playerSkillDeltas: {
      xp: afterPlayerSnap.xp - beforeSnap.xp,
      hp: afterPlayerSnap.hp - beforeSnap.hp,
      risk: afterPlayerSnap.risk - beforeSnap.risk,
      reputation: afterPlayerSnap.reputation - beforeSnap.reputation,
      trust: afterPlayerSnap.trust - beforeSnap.trust,
      pressure: afterPlayerSnap.pressure - beforeSnap.pressure,
    },
    netTurnDeltas: {
      xp: afterTurnSnap.xp - beforeSnap.xp,
      hp: afterTurnSnap.hp - beforeSnap.hp,
      risk: afterTurnSnap.risk - beforeSnap.risk,
      reputation: afterTurnSnap.reputation - beforeSnap.reputation,
      trust: afterTurnSnap.trust - beforeSnap.trust,
      pressure: afterTurnSnap.pressure - beforeSnap.pressure,
    },
    skillOutcome: skillRes.outcome,
    skillSucceeded: skillRes.outcome !== 'backfire' && skillRes.outcome !== 'minimal',
    suddenEventTriggered: Boolean(triggeredEventId),
    suddenEventId: triggeredEventId,
    suddenEventTitleKo: triggeredEventTitleKo,
    suddenEventTitleEn: triggeredEventTitleEn,
    enemySkillId: enemySkillUsed,
    stageResolution: resolvedType,
  };

  if (!opts?.fastSim) {
    next.telemetryLogs.push(telemetryEntry);
    next.battleLogs = [...newLogs.reverse(), ...next.battleLogs].slice(0, 60);
  }

  if (gameOverId) {
    finalizeGameEnding(next, gameOverId);
  }

  return next;
}

export function proceedToNextStage(state: GameState, opts?: { fastSim?: boolean }): GameState {
  if (state.currentStage >= 6) {
    const next = opts?.fastSim ? state : deepClone(state);
    const endId = determineFinalVictoryEnding(next);
    return finalizeGameEnding(next, endId);
  }
  const nextStage = (state.currentStage + 1) as StageNumber;
  return startStageBattle(state, nextStage, opts);
}
