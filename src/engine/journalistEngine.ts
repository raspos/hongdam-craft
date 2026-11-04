import {
  ActiveJournalist,
  CompanyScaleId,
  DifficultyLevel,
  JournalistArchetypeId,
  JournalistCounterSkillId,
  JournalistMemoryRecord,
  JournalistStats,
  RelationshipTag,
  StageBattleState,
  StageNumber,
} from '../types/game';
import {
  FICTIONAL_JOURNALIST_NAMES,
  FICTIONAL_MEDIA_OUTLETS,
  JOURNALIST_ARCHETYPES,
  JOURNALIST_COUNTER_SKILLS,
} from '../data/journalists';
import { STAGES } from '../data/stages';
import { BALANCE, clamp, getExperienceModifiers } from './balanceConfig';
import { DIFFICULTY_SETTINGS } from './difficultyConfig';
import { SeededRNG } from './rng';

function pickOutletForArchetype(archetype: JournalistArchetypeId, rng: SeededRNG) {
  if (archetype === 'broadcast_pd') {
    const b = FICTIONAL_MEDIA_OUTLETS.filter((o) => o.type === 'broadcast');
    return rng.pick(b);
  }
  if (archetype === 'econ_veteran') {
    const e = FICTIONAL_MEDIA_OUTLETS.filter((o) => o.type === 'econ');
    return rng.pick(e);
  }
  if (archetype === 'data_journalist') {
    const d = FICTIONAL_MEDIA_OUTLETS.filter((o) => o.type === 'data');
    return rng.pick(d);
  }
  if (archetype === 'sns_star') {
    const n = FICTIONAL_MEDIA_OUTLETS.filter((o) => o.type === 'newmedia' || o.type === 'general');
    return rng.pick(n);
  }
  const g = FICTIONAL_MEDIA_OUTLETS.filter((o) => o.type === 'general' || o.type === 'econ');
  return rng.pick(g);
}

export function createJournalistRecord(
  archetype: JournalistArchetypeId,
  experienceYears: number,
  usedNamesKo: Set<string>,
  stage: StageNumber,
  rng: SeededRNG
): JournalistMemoryRecord {
  const def = JOURNALIST_ARCHETYPES[archetype];
  const expMod = getExperienceModifiers(experienceYears);

  const availableNames = FICTIONAL_JOURNALIST_NAMES.filter((n) => !usedNamesKo.has(n.ko));
  const pickedName = availableNames.length > 0 ? rng.pick(availableNames) : rng.pick(FICTIONAL_JOURNALIST_NAMES);
  usedNamesKo.add(pickedName.ko);

  const outlet = pickOutletForArchetype(archetype, rng);

  const stats: JournalistStats = {
    reportingPower: rng.int(def.statRanges.reportingPower.min, def.statRanges.reportingPower.max),
    persistence: rng.int(def.statRanges.persistence.min, def.statRanges.persistence.max),
    expertise: rng.int(def.statRanges.expertise.min, def.statRanges.expertise.max),
    sourceNetwork: rng.int(def.statRanges.sourceNetwork.min, def.statRanges.sourceNetwork.max),
    deadlineUrgency: rng.int(def.statRanges.deadlineUrgency.min, def.statRanges.deadlineUrgency.max),
    intimacy: clamp(
      rng.int(def.statRanges.intimacy.min, def.statRanges.intimacy.max) + expMod.initialTrustBonus,
      10,
      85
    ),
    distrust: rng.int(def.statRanges.distrust.min, def.statRanges.distrust.max),
    evidenceLevel: clamp(
      rng.int(def.statRanges.evidenceLevel.min, def.statRanges.evidenceLevel.max) + (stage - 1) * 3,
      20,
      96
    ),
  };

  let titleKo = pickedName.titleKo;
  let titleEn = pickedName.titleEn;
  if (archetype === 'broadcast_pd') {
    titleKo = '시사탐사팀 PD';
    titleEn = 'Investigative Broadcast PD';
  } else if (archetype === 'rookie_passion') {
    titleKo = '수습·평기자';
    titleEn = 'Junior Beat Reporter';
  } else if (archetype === 'legend_investigative') {
    titleKo = '탐사보도 에디터·대기자';
    titleEn = 'Investigative Editor-at-Large';
  }

  return {
    id: `jour_${archetype}_${rng.int(1000, 9999)}`,
    nameKo: pickedName.ko,
    nameEn: pickedName.en,
    outletKo: outlet.ko,
    outletEn: outlet.en,
    titleKo,
    titleEn,
    archetype,
    appearance: { ...def.appearancePreset },
    stats,
    timesMet: 1,
    accurateDataGiven: 0,
    caughtPressuring: 0,
    winedAndDined: 0,
    sincereRemedies: 0,
    legalThreatsReceived: 0,
    lastStageMet: stage,
    relationshipTag: 'neutral',
  };
}

export function deriveRelationshipTag(rec: JournalistMemoryRecord): RelationshipTag {
  if (rec.caughtPressuring > 0 || rec.legalThreatsReceived > 0 || rec.stats.distrust >= 78) {
    return 'hostile_watchdog';
  }
  if (rec.accurateDataGiven >= 2 || (rec.accurateDataGiven >= 1 && rec.sincereRemedies >= 1) || rec.stats.intimacy >= 72) {
    return 'trusted_source';
  }
  if (rec.winedAndDined >= 2 && rec.stats.intimacy >= 60) {
    return 'drinking_buddy';
  }
  return 'neutral';
}

function buildActiveFromRecord(
  rec: JournalistMemoryRecord,
  stage: StageNumber,
  isReturning: boolean,
  isLead: boolean,
  rng: SeededRNG
): ActiveJournalist {
  const def = JOURNALIST_ARCHETYPES[rec.archetype];
  const stats = { ...rec.stats };

  let returningNoteKo: string | undefined;
  let returningNoteEn: string | undefined;
  let introKo = rng.pick(def.introLinesKo);
  let introEn = rng.pick(def.introLinesEn);

  if (isReturning) {
    const tag = deriveRelationshipTag(rec);
    stats.evidenceLevel = clamp(stats.evidenceLevel + stage * 3, 35, 95);

    if (tag === 'trusted_source') {
      stats.intimacy = clamp(stats.intimacy + 10, 15, 95);
      stats.distrust = clamp(stats.distrust - 12, 10, 90);
      returningNoteKo = `지난 스테이지 ${rec.lastStageMet}에서 정확한 팩트를 제공받아 신뢰가 높습니다!`;
      returningNoteEn = `Remembers your accurate data from Stage ${rec.lastStageMet}—starts with high trust!`;
      introKo = `팀장님, 또 뵙네요. 지난번에 정확한 자료를 주셨으니 이번에도 솔직한 소명 기대하겠습니다.`;
      introEn = `We meet again, Chief. Your data was rock-solid last time—hoping for straight answers today too.`;
    } else if (tag === 'hostile_watchdog') {
      stats.intimacy = clamp(stats.intimacy - 12, 5, 90);
      stats.distrust = clamp(stats.distrust + 16, 20, 98);
      stats.persistence = clamp(stats.persistence + 8, 30, 99);
      returningNoteKo = `과거 무리한 압박·불신 기억으로 인해 더욱 집요하게 취재합니다!`;
      returningNoteEn = `Remembers past spin or threats—returns with heightened scrutiny and persistence!`;
      introKo = `지난번처럼 얼버무리거나 외압 넣으실 생각 마십시오. 이번엔 증거부터 꽉 채워 왔습니다!`;
      introEn = `Don’t even think about spinning or pressuring my desk like last time. My file is airtight today!`;
    } else if (tag === 'drinking_buddy') {
      stats.intimacy = clamp(stats.intimacy + 8, 15, 92);
      returningNoteKo = `이전 회동으로 안면이 두터운 기자가 다시 배정되었습니다.`;
      returningNoteEn = `A familiar face from earlier rounds is back on your beat.`;
      introKo = `김 팀장님, 회사에 일이 끊이질 않네요. 편하게 사정부터 한번 들어봅시다.`;
      introEn = `Rough week again, Chief? Walk me through what’s going on inside.`;
    } else {
      returningNoteKo = `스테이지 ${rec.lastStageMet}에서 대면했던 기자가 재등장했습니다.`;
      returningNoteEn = `Returning reporter from Stage ${rec.lastStageMet}.`;
    }
  }

  return {
    memoryId: rec.id,
    nameKo: rec.nameKo,
    nameEn: rec.nameEn,
    outletKo: rec.outletKo,
    outletEn: rec.outletEn,
    titleKo: rec.titleKo,
    titleEn: rec.titleEn,
    archetype: rec.archetype,
    appearance: { ...rec.appearance },
    stats,
    isAnalyzed: isReturning,
    intentProbed: isReturning,
    isReturning,
    returningNoteKo,
    returningNoteEn,
    currentDialogueKo: introKo,
    currentDialogueEn: introEn,
    nextPlannedSkillId: rng.pick(def.preferredCounterSkills),
    isLead,
  };
}

/**
 * Selects 1 or 2 journalists for a stage, blending new archetypes and returning reporters
 * from `journalistPool` so the Journalist Memory System actively shapes mid-to-late stages.
 */
export function spawnStageJournalists(
  stage: StageNumber,
  experienceYears: number,
  pool: JournalistMemoryRecord[],
  rng: SeededRNG
): { active: ActiveJournalist[]; updatedPool: JournalistMemoryRecord[] } {
  const stageDef = STAGES[stage];
  const updatedPool = pool.map((p) => ({ ...p, stats: { ...p.stats } }));
  const usedNames = new Set(updatedPool.map((p) => p.nameKo));

  // Lead journalist selection
  let leadRecord: JournalistMemoryRecord | undefined;
  let leadReturning = false;

  // On Stage 3 or 5, 45% chance a previous matching/relevant reporter reappears as lead!
  if ((stage === 3 || stage === 5) && updatedPool.length > 0 && rng.chance(0.45)) {
    const candidates = updatedPool.filter((p) => p.archetype !== 'legend_investigative');
    if (candidates.length > 0) {
      leadRecord = rng.pick(candidates);
      leadReturning = true;
    }
  }

  if (!leadRecord) {
    const leadArch = rng.pick(stageDef.candidateArchetypes);
    leadRecord = createJournalistRecord(leadArch, experienceYears, usedNames, stage, rng);
    updatedPool.push(leadRecord);
  } else {
    leadRecord.timesMet += 1;
  }

  const leadActive = buildActiveFromRecord(leadRecord, stage, leadReturning, true, rng);
  leadRecord.lastStageMet = stage;
  leadRecord.stats = { ...leadActive.stats };

  const activeList: ActiveJournalist[] = [leadActive];

  // Co-reporting (Stages 4, 5, 6): preferentially bring back a returning journalist from pool!
  if (stageDef.isCoReporting) {
    let coRecord: JournalistMemoryRecord | undefined;
    let coReturning = false;

    const returningCandidates = updatedPool.filter((p) => p.id !== leadRecord!.id);
    if (returningCandidates.length > 0 && rng.chance(0.75)) {
      coRecord = rng.pick(returningCandidates);
      coReturning = true;
      coRecord.timesMet += 1;
    } else {
      const coArchList = stageDef.coReporterArchetypes || ['scoop_hunter', 'fact_checker'];
      const filteredArch = coArchList.filter((a) => a !== leadRecord!.archetype);
      const coArch = rng.pick(filteredArch.length > 0 ? filteredArch : coArchList);
      coRecord = createJournalistRecord(coArch, experienceYears, usedNames, stage, rng);
      updatedPool.push(coRecord);
    }

    const coActive = buildActiveFromRecord(coRecord, stage, coReturning, false, rng);
    coRecord.lastStageMet = stage;
    coRecord.stats = { ...coActive.stats };
    activeList.push(coActive);
  }

  return { active: activeList, updatedPool };
}

/**
 * Executes the Journalist NPC turn (counter-skill) based on stats, stage, memory, and buffs.
 */
export function executeJournalistCounterTurn(
  battle: StageBattleState,
  companyScale: CompanyScaleId,
  pressureMultiplier: number,
  accumulatedRisk: number,
  rng: SeededRNG,
  difficulty?: DifficultyLevel
): {
  skillId: JournalistCounterSkillId;
  actorNameKo: string;
  actorNameEn: string;
  pressureDelta: number;
  evidenceDelta: number;
  reputationDelta: number;
  hpStressDelta: number;
  logTitleKo: string;
  logTitleEn: string;
  logBodyKo: string;
  logBodyEn: string;
  nextPlannedSkillId: JournalistCounterSkillId;
} {
  const lead = battle.journalists[0];
  const co = battle.journalists[1];
  const actor = co && rng.chance(0.38) ? co : lead;
  const archDef = JOURNALIST_ARCHETYPES[actor.archetype];

  const skillId: JournalistCounterSkillId =
    actor.nextPlannedSkillId || rng.pick(archDef.preferredCounterSkills);
  const counterDef = JOURNALIST_COUNTER_SKILLS[skillId];

  const stageScale = BALANCE.STAGE_ENEMY_SCALE[battle.stage];
  const diffSetting = DIFFICULTY_SETTINGS[difficulty || 'normal'] || DIFFICULTY_SETTINGS.normal;
  const statFactor =
    0.72 +
    (actor.stats.reportingPower * 0.0022) +
    (actor.stats.distrust * 0.0018) -
    (actor.stats.intimacy * 0.0022);

  // Co-reporting & pack raid bonuses
  const coBonus = co ? 1.12 : 1.0;
  const packBonus = STAGES[battle.stage].isPackRaid ? 1.1 : 1.0;
  // Final boss punishes high RISK
  const bossRiskFactor =
    battle.stage === 6 && accumulatedRisk >= 50 ? 1.18 : 1.0;

  let rawPressure =
    counterDef.pressureGain *
    stageScale *
    diffSetting.enemyPressureMultiplier *
    Math.max(0.45, statFactor) *
    pressureMultiplier *
    coBonus *
    packBonus *
    bossRiskFactor;

  // Player defensive buffs
  if (battle.buffs.tfTurnsLeft > 0) {
    rawPressure *= 0.7;
  }
  if (battle.buffs.legalShieldActive) {
    rawPressure *= 0.85;
  }
  if (battle.buffs.agencyActiveTurns > 0) {
    rawPressure -= 3;
  }
  if (battle.buffs.consultantActive) {
    rawPressure *= 0.88;
  }

  const pressureDelta = clamp(rawPressure, 3, 22);
  const evidenceDelta = clamp(counterDef.evidenceGain * (battle.buffs.whistleblowerVerified ? 0.6 : 1.0), 2, 12);

  let repDrop = counterDef.reputationDrop;
  if (companyScale === 'chaebol' || companyScale === 'large') repDrop += 1;
  if (battle.buffs.sentimentShieldTurns > 0) repDrop = Math.max(0, repDrop - 3);

  const hpStressDelta = battle.stage >= 5 ? -3 : battle.stage >= 3 ? -2 : -1;
  const nextPlannedSkillId = rng.pick(archDef.preferredCounterSkills);

  return {
    skillId,
    actorNameKo: `${actor.outletKo} ${actor.nameKo}`,
    actorNameEn: `${actor.nameEn} (${actor.outletEn})`,
    pressureDelta,
    evidenceDelta,
    reputationDelta: -repDrop,
    hpStressDelta,
    logTitleKo: `📰 [${actor.outletKo} ${actor.nameKo}] ${counterDef.nameKo}`,
    logTitleEn: `📰 [${actor.nameEn} · ${actor.outletEn}] ${counterDef.nameEn}`,
    logBodyKo: `${counterDef.descKo} (보도 압박 +${pressureDelta}, 증거 +${evidenceDelta}${repDrop > 0 ? `, 평판 -${repDrop}` : ''})`,
    logBodyEn: `${counterDef.descEn} (Pressure +${pressureDelta}, Evidence +${evidenceDelta}${repDrop > 0 ? `, Rep -${repDrop}` : ''})`,
    nextPlannedSkillId,
  };
}
