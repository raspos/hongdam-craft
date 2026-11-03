import { COMPANY_SCALE_LIST } from '../src/data/companies';
import { ENDINGS, PR_ARCHETYPES } from '../src/data/endings';
import { SUDDEN_EVENTS } from '../src/data/events';
import { JOURNALIST_ARCHETYPE_LIST, JOURNALIST_COUNTER_SKILLS } from '../src/data/journalists';
import { PR_SKILLS, PR_SKILLS_BY_ID } from '../src/data/skills';
import { OWNER_RISK_VARIANT_LIST, STAGES } from '../src/data/stages';
import {
  computeJournalistLabMetrics,
  computeSkillEfficiencyBubbles,
  computeStageCrisisProfiles,
  runMonteCarloSurvival,
  runWhatIfFullStrategy,
  runWhatIfSingleTurn,
  selectSkillByPolicy,
  summarizeStageTelemetry,
} from '../src/engine/analyticsEngine';
import {
  DEFAULT_PLAYER_PROFILE,
  initializeNewRun,
  playBattleTurn,
  proceedToNextStage,
  startStageBattle,
  triggerVoluntaryResignation,
} from '../src/engine/gameEngine';
import { SeededRNG } from '../src/engine/rng';
import { evaluateSkillPreview } from '../src/engine/skillEngine';
import { GameState, StageNumber } from '../src/types/game';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed += 1;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Verification failed: ${message}`);
  }
  passed += 1;
}

function assertFiniteResources(state: GameState, context: string) {
  const r = state.resources;
  assert(
    Number.isFinite(r.xp) &&
      Number.isFinite(r.hp) &&
      Number.isFinite(r.risk) &&
      Number.isFinite(r.reputation) &&
      Number.isFinite(r.careerScore),
    `[${context}] Resources contain NaN/Infinity`
  );
  assert(r.xp >= 0, `[${context}] XP went negative: ${r.xp}`);
  assert(r.hp >= 0 && r.hp <= r.maxHp, `[${context}] HP out of bounds: ${r.hp}`);
  assert(r.risk >= 0 && r.risk <= 100, `[${context}] RISK out of bounds: ${r.risk}`);
  assert(r.reputation >= 0 && r.reputation <= 100, `[${context}] Reputation out of bounds: ${r.reputation}`);

  if (state.stageBattle) {
    const b = state.stageBattle;
    assert(Number.isFinite(b.pressure) && b.pressure >= 0 && b.pressure <= 100, `[${context}] Pressure invalid: ${b.pressure}`);
    assert(Number.isFinite(b.deadline) && b.deadline >= 0, `[${context}] Deadline invalid: ${b.deadline}`);
    b.journalists.forEach((j) => {
      assert(Number.isFinite(j.stats.intimacy) && j.stats.intimacy >= 0 && j.stats.intimacy <= 100, `[${context}] Journalist trust invalid`);
    });
  }
}

export async function runAllVerifications() {
  console.log('==============================================================');
  console.log('🧪 HONGDAM CRAFT — Automated Full-Scope Verification Suite');
  console.log('==============================================================\n');

  // 1. Content Counts & Bilingual KO/EN Completeness
  console.log('1️⃣ Checking Content Scope (6 Stages, 12 Reporters, 40 Skills, 32 Events, 10 Endings) & KO/EN...');
  const hangulRegex = /[가-힣]/;

  assert(Object.keys(STAGES).length === 6, 'Must have exactly 6 stages');
  assert(OWNER_RISK_VARIANT_LIST.length === 6, 'Must have 6 Stage-6 owner scandal variants');
  assert(JOURNALIST_ARCHETYPE_LIST.length === 12, 'Must have 12 journalist archetypes');
  assert(Object.keys(JOURNALIST_COUNTER_SKILLS).length === 12, 'Must have 12 journalist counter-skills');
  assert(PR_SKILLS.length === 40, `Must have 40 PR skills, found ${PR_SKILLS.length}`);
  assert(SUDDEN_EVENTS.length >= 30, `Must have >= 30 sudden events, found ${SUDDEN_EVENTS.length}`);
  assert(Object.keys(ENDINGS).length >= 8, 'Must have >= 8 endings');
  assert(Object.keys(PR_ARCHETYPES).length === 8, 'Must have 8 PR chief archetypes');

  PR_SKILLS.forEach((sk, idx) => {
    assert(sk.num === idx + 1, `Skill numbering sequential at ${idx + 1}`);
    assert(sk.nameKo.length > 0 && sk.nameEn.length > 0, `Skill ${sk.id} missing name`);
    assert(sk.descKo.length > 0 && sk.descEn.length > 0, `Skill ${sk.id} missing description`);
    assert(!hangulRegex.test(sk.nameEn) && !hangulRegex.test(sk.descEn), `Skill ${sk.id} English text contains Hangul!`);
  });

  JOURNALIST_ARCHETYPE_LIST.forEach((arch) => {
    assert(!hangulRegex.test(arch.nameEn) && !hangulRegex.test(arch.personalityEn), `Archetype ${arch.id} EN text contains Hangul!`);
  });

  Object.values(ENDINGS).forEach((ed) => {
    assert(ed.titleKo.length > 0 && ed.titleEn.length > 0, `Ending ${ed.id} missing title`);
    assert(!hangulRegex.test(ed.titleEn) && !hangulRegex.test(ed.storyEn), `Ending ${ed.id} EN text contains Hangul!`);
  });
  console.log('  ✅ Scope & KO/EN translation checks passed.');

  // 2. All 40 PR Skills Execution & Telemetry Verification
  console.log('2️⃣ Stress-testing all 40 PR skills in live battle & verifying telemetry records...');
  const baseRun = initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 424242, forcedScale: 'chaebol' });
  let stage6State = startStageBattle(baseRun, 6);
  stage6State.resources.xp = 5000;
  stage6State.resources.hp = 100;
  stage6State.stageBattle!.deadline = 10;

  for (const sk of PR_SKILLS) {
    const testClone: GameState = JSON.parse(JSON.stringify(stage6State));
    testClone.unlockedSkillIds = PR_SKILLS.map((s) => s.id);
    testClone.cooldowns = {} as never;
    testClone.stageBattle!.cooldowns = {};
    testClone.stageBattle!.deadline = 8;
    testClone.stageBattle!.pressure = 70;
    testClone.resources.xp = 2000;
    testClone.resources.hp = 90;
    testClone.resources.risk = 20;
    testClone.resources.reputation = 60;

    const preview = evaluateSkillPreview(testClone, sk.id);
    assert(preview.usable, `Skill ${sk.id} should be usable in unlocked test harness`);

    const after = playBattleTurn(testClone, sk.id);
    assertFiniteResources(after, `Skill_${sk.id}`);
    assert(after.telemetryLogs.length === 1, `Skill ${sk.id} must record 1 ActionTelemetryRecord`);
    const tel = after.telemetryLogs[0];
    assert(tel.skillId === sk.id, `Telemetry recorded wrong skillId for ${sk.id}`);
    assert(
      tel.netTurnDeltas.xp === tel.afterTurnComplete.xp - tel.before.xp,
      `Telemetry XP delta mismatch on ${sk.id}`
    );
  }
  console.log('  ✅ All 40 skills executed with zero NaN, valid bounds, and exact telemetry.');

  // 3. Startup (100 XP) & Chaebol (1000 XP) 6-Stage Clearability
  console.log('3️⃣ Verifying Startup (100 XP) & Chaebol (1000 XP) 6-Stage Clearability...');
  const startupMc = runMonteCarloSurvival({
    companyScale: 'startup',
    experienceYears: 9,
    startStage: 1,
    strategyPolicy: 'transparent_remedy',
    iterations: 200,
    seed: 1001,
  });
  const chaebolMc = runMonteCarloSurvival({
    companyScale: 'chaebol',
    experienceYears: 9,
    startStage: 1,
    strategyPolicy: 'transparent_remedy',
    iterations: 200,
    seed: 1001,
  });
  const chaebolRecklessMc = runMonteCarloSurvival({
    companyScale: 'chaebol',
    experienceYears: 3,
    startStage: 1,
    strategyPolicy: 'big_budget',
    iterations: 200,
    seed: 1001,
  });

  assert(startupMc.anySurvivalVictoryRate >= 25, `Startup should be clearable with smart play (got ${startupMc.anySurvivalVictoryRate}%)`);
  assert(chaebolMc.anySurvivalVictoryRate >= 30, `Chaebol should be clearable with smart play (got ${chaebolMc.anySurvivalVictoryRate}%)`);
  assert(chaebolRecklessMc.riskExplodedRate > 0 || chaebolRecklessMc.anySurvivalVictoryRate < 98, 'Chaebol must still face real risk when reckless');
  console.log(
    `  ✅ Startup survival: ${startupMc.anySurvivalVictoryRate}% (VP/Boutique: ${startupMc.execPromotionRate}%) | Chaebol survival: ${chaebolMc.anySurvivalVictoryRate}%`
  );

  // 4. All Required Endings & Lethal Warning Checks
  console.log('4️⃣ Verifying Game Over Endings (XP=0, HP=0, RISK=100, Resignation) & Lethal Warnings...');

  // 4a. HP = 0 Hospitalization + Lethal Warning
  let hpState = startStageBattle(initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 77, forcedScale: 'midsize' }), 2);
  hpState.resources.hp = 10;
  const bombShotPreview = evaluateSkillPreview(hpState, 'A06_bomb_shot'); // costs >= 18 HP
  assert(bombShotPreview.lethalWarningType === 'hp', 'Skill dropping HP <= 0 must trigger lethalWarningType === "hp"');
  hpState = playBattleTurn(hpState, 'A06_bomb_shot');
  assert(
    hpState.phase === 'ending' && hpState.endingSummary?.endingId === 'ending_overwork_hospital',
    `Expected ending_overwork_hospital, got ${hpState.endingSummary?.endingId}`
  );

  // 4b. RISK = 100 Lobby Exposed + Lethal Warning
  let riskState = startStageBattle(initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 88, forcedScale: 'chaebol' }), 5);
  riskState.resources.risk = 82;
  const blitzPreview = evaluateSkillPreview(riskState, 'D34_all_out_budget');
  assert(blitzPreview.lethalWarningType === 'risk', 'Skill pushing RISK >= 100 must trigger lethalWarningType === "risk"');
  riskState = playBattleTurn(riskState, 'D34_all_out_budget');
  assert(
    riskState.phase === 'ending' && riskState.endingSummary?.endingId === 'ending_lobby_exposed',
    `Expected ending_lobby_exposed, got ${riskState.endingSummary?.endingId}`
  );

  // 4c. XP Exhaustion Transfer Ending
  let xpState = startStageBattle(initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 99, forcedScale: 'startup' }), 1);
  xpState.resources.xp = 4; // Exact cost for A02_text_message
  // Put all 0-XP skills on cooldown (with >= 3 turns so they remain on cooldown after this turn)
  xpState.unlockedSkillIds.forEach((skId) => {
    const sk = PR_SKILLS_BY_ID[skId];
    if (sk && sk.xpCost <= 0) {
      xpState.stageBattle!.cooldowns[skId] = 3;
    }
  });
  xpState.stageBattle!.pressure = 85;
  xpState = playBattleTurn(xpState, 'A02_text_message'); // Spends last 4 XP -> 0 usable skills left!
  assert(
    xpState.phase === 'ending' && xpState.endingSummary?.endingId === 'ending_budget_exhausted',
    `Expected ending_budget_exhausted when XP & free moves depleted, got ${xpState.endingSummary?.endingId}`
  );

  // 4d. Voluntary Resignation Ending
  const resignState = triggerVoluntaryResignation(
    startStageBattle(initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 55 }), 2)
  );
  assert(
    resignState.phase === 'ending' && resignState.endingSummary?.endingId === 'ending_resignation_escape',
    'Voluntary resignation must trigger ending_resignation_escape'
  );
  console.log('  ✅ All Game Over triggers and pre-execution lethal warnings verified.');

  // 5. Principled Fact-Checker Backfire & Deadline Sprinter Lockout
  console.log('5️⃣ Verifying Fact-Checker Backfire & Deadline=1 Slow-Skill Lockout...');
  const fcState = startStageBattle(initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 123, forcedScale: 'large' }), 3);
  fcState.stageBattle!.journalists[0].archetype = 'fact_checker';
  const sponsorPrev = evaluateSkillPreview(fcState, 'D28_sponsorship_offer');
  assert(
    sponsorPrev.affinityRating === 'backfire',
    `Fact-checker must flag sponsorship offer as backfire (got ${sponsorPrev.affinityRating})`
  );

  fcState.stageBattle!.deadline = 1;
  const lunchPrevAtD1 = evaluateSkillPreview(fcState, 'A04_lunch_meeting');
  const pressConfPrevAtD1 = evaluateSkillPreview(fcState, 'C23_emergency_press_conf');
  const callPrevAtD1 = evaluateSkillPreview(fcState, 'A01_phone_call');
  assert(!lunchPrevAtD1.usable, 'Lunch meeting (deadlineMin 2) must lock at deadline=1');
  assert(!pressConfPrevAtD1.usable, 'Press conference (deadlineMin 2) must lock at deadline=1');
  assert(callPrevAtD1.usable, 'Phone call (deadlineMin 1) must remain usable at deadline=1');
  console.log('  ✅ Archetype affinity backfire & deadline lockouts verified.');

  // 6. Journalist Memory System Across Stages & Full 6-Stage Victory Playthrough
  console.log('6️⃣ Running full 6-stage strategic playthrough & checking Journalist Memory + Save/Reload...');
  let fullRun = initializeNewRun(DEFAULT_PLAYER_PROFILE, { seed: 202607, forcedScale: 'midsize' });
  fullRun = startStageBattle(fullRun, 1);
  const rng = new SeededRNG(999);
  let sawReturningJournalist = false;

  let guard = 0;
  while (fullRun.phase !== 'ending' && guard < 90) {
    guard += 1;
    if (fullRun.phase === 'battle') {
      if (fullRun.stageBattle?.journalists.some((j) => j.isReturning)) {
        sawReturningJournalist = true;
      }
      // Mid-run save/reload check at Stage 4 (co-reporting with 2 journalists!)
      if (fullRun.currentStage === 4 && fullRun.stageBattle?.turnNumber === 1) {
        assert(fullRun.stageBattle.journalists.length === 2, 'Stage 4 must feature 2 co-reporting journalists');
        const serialized = JSON.stringify(fullRun);
        const restored = JSON.parse(serialized) as GameState;
        assert(restored.stageBattle?.journalists.length === 2, 'Restored Stage 4 state must retain 2 journalists');
        fullRun = restored;
      }

      const sk = selectSkillByPolicy(fullRun, 'transparent_remedy', rng);
      assert(Boolean(sk), 'Strategic policy must find a usable skill');
      fullRun = playBattleTurn(fullRun, sk!);
      assertFiniteResources(fullRun, `FullRun_Stg${fullRun.currentStage}`);
    } else if (fullRun.phase === 'stage_result') {
      const stgTel = summarizeStageTelemetry(fullRun.telemetryLogs, fullRun.currentStage);
      assert(Boolean(stgTel && stgTel.logs.length > 0), `Stage ${fullRun.currentStage} report must have real telemetry`);
      fullRun = proceedToNextStage(fullRun);
    }
  }

  assert(fullRun.phase === 'ending' && Boolean(fullRun.endingSummary), '6-stage run must reach ending');
  assert(sawReturningJournalist, 'At least one journalist must return in later stages via Memory Pool');
  assert(
    fullRun.telemetryLogs.every((t) => t.finalEndingId === fullRun.endingSummary!.endingId),
    'All telemetry records must be stamped with finalEndingId upon completion'
  );
  console.log(
    `  ✅ Full 6-stage run completed -> Ending: [${fullRun.endingSummary!.endingId}], Archetype: [${fullRun.endingSummary!.archetypeId}], Returning Reporter Memory confirmed!`
  );

  // 7. Data Journalism Reproducibility (WHAT-IF & Monte Carlo & Data Lab)
  console.log('7️⃣ Verifying Seeded WHAT-IF Reproducibility, Monte Carlo Sum=100%, and Data Lab Analytics...');
  const wi1 = runWhatIfSingleTurn(fullRun, 1, 0, 'A05_dinner_drinks');
  const wi2 = runWhatIfSingleTurn(fullRun, 1, 0, 'A05_dinner_drinks');
  assert(Boolean(wi1 && wi2), 'WHAT-IF single turn must produce comparison result');
  assert(
    JSON.stringify(wi1!.counterfactual.turnTrajectory) === JSON.stringify(wi2!.counterfactual.turnTrajectory),
    'Seeded WHAT-IF single-turn must be 100% deterministic across repeated runs'
  );

  const wf1 = runWhatIfFullStrategy(fullRun, 2 as StageNumber, 'big_budget');
  const wf2 = runWhatIfFullStrategy(fullRun, 2 as StageNumber, 'big_budget');
  assert(Boolean(wf1 && wf2), 'WHAT-IF full strategy must produce comparison result');
  assert(
    wf1!.counterfactual.carryOverResources.xp === wf2!.counterfactual.carryOverResources.xp,
    'Seeded WHAT-IF full-strategy must be 100% deterministic'
  );

  const mcA = runMonteCarloSurvival({
    companyScale: 'midsize',
    strategyPolicy: 'fact_check',
    iterations: 1000,
    seed: 20261103,
  });
  const mcB = runMonteCarloSurvival({
    companyScale: 'midsize',
    strategyPolicy: 'fact_check',
    iterations: 1000,
    seed: 20261103,
  });
  assert(mcA.iterations === 1000, 'Monte Carlo must report exact 1,000 iterations');
  assert(mcA.execPromotionRate === mcB.execPromotionRate, 'Seeded Monte Carlo must be 100% reproducible');

  const outcomeSum =
    mcA.anySurvivalVictoryRate +
    mcA.xpExhaustedRate +
    mcA.hpExhaustedRate +
    mcA.riskExplodedRate +
    mcA.reputationCollapsedRate;
  assert(
    Math.abs(outcomeSum - 100) <= 0.6,
    `Monte Carlo mutually exclusive outcome rates must sum to ~100% (got ${outcomeSum}%)`
  );

  const labJ = computeJournalistLabMetrics();
  assert(labJ.length === 12 && labJ.every((m) => Number.isFinite(m.overallDifficulty)), 'Data Lab Journalist metrics valid');

  COMPANY_SCALE_LIST.forEach((sc) => {
    const bubbles = computeSkillEfficiencyBubbles('all', 3, sc.id);
    assert(bubbles.length === 40 && bubbles.every((b) => Number.isFinite(b.expectedEffectiveness)), 'Data Lab Skill Bubbles valid');
    const prof = computeStageCrisisProfiles(sc.id);
    assert(prof.length === 6 && prof.every((p) => Number.isFinite(p.estXpNeeded)), 'Data Lab Stage Profiles valid');
  });

  console.log('  ✅ Counterfactual WHAT-IF, Monte Carlo N=1,000, and Data Lab calculators verified.');
  console.log(`\n🎉 ALL ${passed} ASSERTIONS PASSED (${failed} FAILED)!`);
}
