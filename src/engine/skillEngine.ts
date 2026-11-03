import {
  AssignedCompany,
  GameState,
  JournalistMemoryRecord,
  PRSkillDef,
  SkillExecutionPreview,
  SkillOutcomeGrade,
  StageBuffs,
} from '../types/game';
import { JOURNALIST_ARCHETYPES } from '../data/journalists';
import { PR_SKILLS_BY_ID } from '../data/skills';
import { BALANCE, clamp, getExperienceModifiers } from './balanceConfig';
import { deriveRelationshipTag } from './journalistEngine';
import { SeededRNG } from './rng';

export function computeEffectiveXpCost(
  skill: PRSkillDef,
  company: AssignedCompany,
  buffs?: StageBuffs
): number {
  if (skill.xpCost <= 0) return 0;
  let cost = skill.xpCost * (skill.scalesWithCompany ? company.xpCostMultiplier : 1.0);
  if (company.execTrait === 'legal_first' && skill.id === 'C20_legal_team') {
    cost *= 0.7;
  }
  if (buffs && buffs.tfTurnsLeft > 0 && (skill.category === 'C' || skill.category === 'E')) {
    cost *= 0.8;
  }
  return Math.max(2, Math.round(cost));
}

export function computeEffectiveHpCost(
  skill: PRSkillDef,
  company: AssignedCompany,
  experienceYears: number,
  buffs?: StageBuffs
): number {
  if (skill.hpCost <= 0) return skill.hpCost; // negative means healing
  const expMod = getExperienceModifiers(experienceYears);
  let cost = skill.hpCost;
  if (buffs?.hangoverNextTurn) cost += 5;
  if (company.execTrait === 'legal_first' && skill.id === 'E35_official_apology') cost += 3;
  if (skill.category === 'A') cost = Math.max(1, cost - expMod.youthStaminaSave);
  return Math.round(cost);
}

export function evaluateSkillPreview(state: GameState, skillId: string): SkillExecutionPreview {
  const skill = PR_SKILLS_BY_ID[skillId];
  const battle = state.stageBattle;
  if (!skill || !battle) {
    return {
      skillId,
      usable: false,
      lockReasonKo: '전투 중이 아닙니다',
      lockReasonEn: 'Not in active battle',
      effectiveXpCost: 0,
      effectiveHpCost: 0,
      expectedPressureDelta: 0,
      expectedTrustDelta: 0,
      expectedRiskDelta: 0,
      expectedReputationDelta: 0,
      affinityRating: 'neutral',
      affinityNoteKo: '',
      affinityNoteEn: '',
    };
  }

  const effectiveXpCost = computeEffectiveXpCost(skill, state.company, battle.buffs);
  const effectiveHpCost = computeEffectiveHpCost(
    skill,
    state.company,
    state.player.experienceYears,
    battle.buffs
  );

  let usable = true;
  let lockReasonKo: string | undefined;
  let lockReasonEn: string | undefined;

  if (!state.unlockedSkillIds.includes(skillId) && skill.minStage > state.currentStage) {
    usable = false;
    lockReasonKo = `STAGE ${skill.minStage} 해금 스킬`;
    lockReasonEn = `Unlocks at Stage ${skill.minStage}`;
  } else if ((battle.cooldowns[skillId] || 0) > 0) {
    usable = false;
    lockReasonKo = `재사용 대기 ${battle.cooldowns[skillId]}턴`;
    lockReasonEn = `Cooldown: ${battle.cooldowns[skillId]}t`;
  } else if (battle.deadline < skill.deadlineMin) {
    usable = false;
    lockReasonKo = `마감 임박 사용 불가 (최소 ${skill.deadlineMin}턴 필요)`;
    lockReasonEn = `Too close to deadline (needs ${skill.deadlineMin}+ turns)`;
  } else if (state.resources.xp < effectiveXpCost) {
    usable = false;
    lockReasonKo = `홍보예산(XP) 부족 (${effectiveXpCost} 필요)`;
    lockReasonEn = `Insufficient XP (needs ${effectiveXpCost})`;
  }

  const lead = battle.journalists[0];
  const aff = skill.affinities[lead.archetype];
  const expMod = getExperienceModifiers(state.player.experienceYears);

  let pMult = 1.0 + expMod.skillProficiencyBonus;
  let tMult = 1.0 + expMod.skillProficiencyBonus * 0.5;
  let riskExtra = 0;
  let affinityRating: SkillExecutionPreview['affinityRating'] = 'neutral';
  let affinityNoteKo = '기본 효과 적용';
  let affinityNoteEn = 'Standard effectiveness';

  if (aff) {
    pMult *= aff.pressureMultiplier;
    tMult *= aff.trustMultiplier;
    riskExtra += aff.riskExtra;
    affinityNoteKo = aff.noteKo;
    affinityNoteEn = aff.noteEn;

    if (aff.pressureMultiplier < 0 || aff.backfireChanceBonus >= 0.45) {
      affinityRating = 'backfire';
    } else if (aff.pressureMultiplier < 0.65) {
      affinityRating = 'poor';
    } else if (aff.pressureMultiplier >= 1.45) {
      affinityRating = 'great';
    } else if (aff.pressureMultiplier >= 1.15) {
      affinityRating = 'good';
    }
  }

  // Context synergy previews
  if (battle.buffs.factChecked && (skill.id === 'A07_press_statement' || skill.id === 'E36_correct_misinfo' || skill.id === 'C23_emergency_press_conf')) {
    pMult *= 1.45;
    if (affinityRating === 'neutral') affinityRating = 'good';
  }
  if (lead.isAnalyzed) {
    pMult *= 1.12;
  }
  // Streak diminishing returns
  if (battle.lastCategory === skill.category && battle.sameCategoryStreak >= 1) {
    const idx = Math.min(battle.sameCategoryStreak, BALANCE.SAME_CATEGORY_STREAK_PENALTY.length - 1);
    pMult *= BALANCE.SAME_CATEGORY_STREAK_PENALTY[idx];
  }

  const expectedPressureDelta = Math.round(skill.pressureDelta * pMult);
  const expectedTrustDelta = Math.round(skill.trustDelta * tMult);
  const expectedRiskDelta = Math.round(skill.riskDelta + riskExtra);
  const expectedReputationDelta = Math.round(skill.reputationDelta);

  // Lethal warning detection (Section 20)
  let lethalWarningType: SkillExecutionPreview['lethalWarningType'];
  let lethalWarningKo: string | undefined;
  let lethalWarningEn: string | undefined;

  if (effectiveHpCost > 0 && state.resources.hp - effectiveHpCost <= 0) {
    lethalWarningType = 'hp';
    lethalWarningKo = `이 스킬을 사용하면 체력(HP)이 0 이하로 떨어져 즉시 [병원 입원] 게임 오버가 발생할 수 있습니다!`;
    lethalWarningEn = `Using this skill drops your HP to 0 or below, triggering immediate [Hospitalization] Game Over!`;
  } else if (state.resources.risk + Math.max(0, expectedRiskDelta) >= 100) {
    lethalWarningType = 'risk';
    lethalWarningKo = `역풍 위험(RISK)이 한계치(100)에 도달해 즉시 [홍보 공작 의혹 폭로] 게임 오버가 발생합니다!`;
    lethalWarningEn = `RISK will hit 100, triggering immediate [Dark PR Manipulation Exposed] Game Over!`;
  } else if (state.resources.reputation + expectedReputationDelta <= 0) {
    lethalWarningType = 'reputation';
    lethalWarningKo = `기업 평판이 0 이하로 붕괴하여 즉시 경질될 위험이 있습니다!`;
    lethalWarningEn = `Corporate Reputation will hit 0, risking immediate dismissal!`;
  } else if (effectiveXpCost > 0 && state.resources.xp - effectiveXpCost <= 0) {
    lethalWarningType = 'xp';
    lethalWarningKo = `남은 홍보예산(XP)을 전부 소진합니다! 스테이지를 못 끝내면 예산 고갈 위험이 큽니다.`;
    lethalWarningEn = `This spends your entire remaining XP budget! Running dry may cause transfer Game Over.`;
  }

  return {
    skillId,
    usable,
    lockReasonKo,
    lockReasonEn,
    effectiveXpCost,
    effectiveHpCost,
    expectedPressureDelta,
    expectedTrustDelta,
    expectedRiskDelta,
    expectedReputationDelta,
    affinityRating,
    affinityNoteKo,
    affinityNoteEn,
    lethalWarningType,
    lethalWarningKo,
    lethalWarningEn,
  };
}

export interface SkillExecutionResult {
  xpDelta: number;
  hpDelta: number;
  riskDelta: number;
  reputationDelta: number;
  pressureDelta: number;
  trustDelta: number;
  deadlineDelta: number;
  outcome: SkillOutcomeGrade;
  logTitleKo: string;
  logTitleEn: string;
  logBodyKo: string;
  logBodyEn: string;
  journalistReplyKo: string;
  journalistReplyEn: string;
  updatedBuffs: StageBuffs;
  updatedPool: JournalistMemoryRecord[];
}

export function executePlayerSkill(
  state: GameState,
  skillId: string,
  rng: SeededRNG
): SkillExecutionResult {
  const skill = PR_SKILLS_BY_ID[skillId];
  const battle = state.stageBattle!;
  const lead = battle.journalists[0];
  const archDef = JOURNALIST_ARCHETYPES[lead.archetype];
  const expMod = getExperienceModifiers(state.player.experienceYears);
  const buffs: StageBuffs = { ...battle.buffs };

  const xpCost = computeEffectiveXpCost(skill, state.company, buffs);
  const hpCost = computeEffectiveHpCost(skill, state.company, state.player.experienceYears, buffs);

  // Clear hangover once paid
  if (buffs.hangoverNextTurn && hpCost > 0) {
    buffs.hangoverNextTurn = false;
  }

  let xpDelta = -xpCost;
  const hpDelta = -hpCost; // if hpCost is -38, hpDelta is +38
  let riskDelta = skill.riskDelta;
  let reputationDelta = skill.reputationDelta;
  let pressureDelta = skill.pressureDelta;
  let trustDelta = skill.trustDelta;
  let deadlineDelta = 0;

  // Apply company executive traits
  if (
    state.company.execTrait === 'data_driven' &&
    (skill.mechanic === 'verify_facts' || skill.mechanic === 'audit_disclosure' || skill.mechanic === 'factual_correction')
  ) {
    pressureDelta = Math.round(pressureDelta * 1.18);
  }
  if (state.company.execTrait === 'transparent_pledge') {
    if (skill.category === 'E') reputationDelta += 3;
    if (skill.category === 'D') riskDelta = Math.round(riskDelta * 1.3);
  }
  if (
    state.company.execTrait === 'succession_era' &&
    (skill.mechanic === 'convene_tf' || skill.mechanic === 'hire_consultant')
  ) {
    pressureDelta = Math.round(pressureDelta * 1.2);
  }

  // Returning journalist memory bonus/penalty
  const memIndex = state.journalistPool.findIndex((m) => m.id === lead.memoryId);
  const updatedPool = state.journalistPool.map((m) => ({ ...m, stats: { ...m.stats } }));
  const memRec = memIndex >= 0 ? updatedPool[memIndex] : undefined;

  if (memRec?.relationshipTag === 'trusted_source' && (skill.category === 'A' || skill.category === 'B' || skill.category === 'E')) {
    pressureDelta = Math.round(pressureDelta * 1.2);
    trustDelta += 3;
  } else if (memRec?.relationshipTag === 'hostile_watchdog' && skill.category === 'D') {
    riskDelta += 10;
  }

  // Affinity & Backfire check
  const aff = skill.affinities[lead.archetype];
  let backfired = false;

  if (aff) {
    if (aff.backfireChanceBonus > 0 && rng.chance(aff.backfireChanceBonus)) {
      backfired = true;
    }
    pressureDelta = Math.round(pressureDelta * aff.pressureMultiplier);
    trustDelta = Math.round(trustDelta * aff.trustMultiplier);
    riskDelta += aff.riskExtra;
  }

  // Special Mechanic Resolution (unique behavior per skill!)
  let extraNoteKo = '';
  let extraNoteEn = '';

  switch (skill.mechanic) {
    case 'reveal_stats': {
      battle.journalists.forEach((j) => {
        j.isAnalyzed = true;
      });
      extraNoteKo = '기자 능력치와 상성이 완전히 분석되었습니다!';
      extraNoteEn = 'All journalist stats & affinities unlocked!';
      break;
    }
    case 'probe_intent': {
      battle.journalists.forEach((j) => {
        j.intentProbed = true;
        j.stats.evidenceLevel = clamp(j.stats.evidenceLevel - 10, 10, 99);
      });
      extraNoteKo = '기자의 다음 반격 의도를 파악하고 증거 예봉을 꺾었습니다!';
      extraNoteEn = 'Revealed reporter’s next move and blunted evidence (-10)!';
      break;
    }
    case 'stabilize_deadline': {
      if (!buffs.deadlineChecked) {
        buffs.deadlineChecked = true;
        deadlineDelta = 1;
        extraNoteKo = '마감 판갈이 시간을 확인해 행동 기회(+1턴)를 추가 확보했습니다!';
        extraNoteEn = 'Verified edition lock—gained +1 extra DEADLINE turn!';
      } else {
        extraNoteKo = '마감 일정을 재점검해 압박을 소폭 낮췄습니다.';
        extraNoteEn = 'Re-checked edition schedule.';
      }
      break;
    }
    case 'verify_facts': {
      buffs.factChecked = true;
      buffs.dataMismatchDebuff = false;
      if (memRec) memRec.accurateDataGiven += 1;
      extraNoteKo = '[사내 팩트 검증됨] 달성! 이후 해명·정정·기자회견 효율이 급증합니다.';
      extraNoteEn = '[Fact-Verified] active! Statements, corrections & pressers gain huge power.';
      break;
    }
    case 'audit_disclosure': {
      buffs.disclosureAudited = true;
      buffs.factChecked = true;
      buffs.dataMismatchDebuff = false;
      if (memRec) memRec.accurateDataGiven += 1;
      if (battle.stage === 3 || battle.stage === 6) {
        pressureDelta -= 8;
      }
      extraNoteKo = '전자공시 주석과 내부 문건의 회계 차이를 정밀 소명했습니다!';
      extraNoteEn = 'Reconciled official filings against leaked documents!';
      break;
    }
    case 'verify_whistleblower': {
      buffs.whistleblowerVerified = true;
      battle.journalists.forEach((j) => {
        j.stats.evidenceLevel = clamp(j.stats.evidenceLevel - 14, 10, 99);
      });
      if (battle.internalCredibility === 'solid_company') {
        pressureDelta -= 10;
        extraNoteKo = '조사 결과 제보 상당 부분이 오해임이 밝혀져 압박이 크게 감소했습니다!';
        extraNoteEn = 'Inquiry showed much of the tip-off was exaggerated—pressure drops sharply!';
      } else {
        extraNoteKo = '내부 문제점을 정확히 파악했습니다! 이제 사과·보상·개선 스킬 효율이 증폭됩니다.';
        extraNoteEn = 'Pinpointed internal faults! Apology, compensation & reform skills are now boosted.';
      }
      break;
    }
    case 'convene_tf': {
      buffs.tfTurnsLeft = 3;
      extraNoteKo = '위기대응 TF 가동! 3턴간 기자 반격 압박이 30% 경감됩니다.';
      extraNoteEn = 'Crisis TF active! Incoming pressure cut by 30% for 3 turns.';
      break;
    }
    case 'sentiment_shield': {
      buffs.sentimentShieldTurns = 2;
      extraNoteKo = '실시간 여론 방어막(2턴) 구축 및 RISK 감소!';
      extraNoteEn = '2-turn Reputation shield active & RISK lowered!';
      break;
    }
    case 'grant_vp_xp': {
      const grant = BALANCE.VP_SUPPORT_XP[state.company.scale];
      xpDelta += grant;
      extraNoteKo = `홍보실장 긴급 예비비 +${grant} XP 확보!`;
      extraNoteEn = `Secured +${grant} emergency XP from PR Director!`;
      break;
    }
    case 'legal_shield': {
      buffs.legalShieldActive = true;
      extraNoteKo = '법무팀 법률 검토 방어막이 가동되었습니다.';
      extraNoteEn = 'Corporate Legal Team compliance shield deployed.';
      break;
    }
    case 'agency_support': {
      buffs.agencyActiveTurns = 2;
      extraNoteKo = '외부 PR 대행사 실무 분담으로 체력을 회복했습니다!';
      extraNoteEn = 'External PR agency shared the workload, restoring stamina!';
      break;
    }
    case 'hire_consultant': {
      buffs.consultantActive = true;
      extraNoteKo = '위기관리 컨설턴트가 핵심 메시지 전략을 재설계했습니다!';
      extraNoteEn = 'Crisis Consultant aligned executive messaging!';
      break;
    }
    case 'press_conference_swing': {
      if (buffs.factChecked || buffs.reformIssued || buffs.apologyIssued) {
        pressureDelta = Math.round(pressureDelta * 1.45);
        reputationDelta += 5;
        extraNoteKo = '철저한 사전 검증 덕분에 기자회견 질의응답을 완벽히 주도했습니다!';
        extraNoteEn = 'Backed by verified facts, your press conference commanded the room!';
      } else if (rng.chance(0.45)) {
        backfired = true;
        pressureDelta = 12;
        reputationDelta = -7;
        riskDelta += 10;
        extraNoteKo = '팩트 준비 없이 연 기자회견에서 송곳 질문에 말문이 막혔습니다!';
        extraNoteEn = 'Unprepared at the podium—reporters tore through gaps in your answers!';
      }
      break;
    }
    case 'ceo_address': {
      if (battle.stage >= 4) pressureDelta -= 6;
      extraNoteKo = '최고경영자 공식 책임 입장이 발표되어 대외 신뢰가 상승합니다.';
      extraNoteEn = 'CEO’s signed address bolstered institutional trust.';
      break;
    }
    case 'owner_banquet_xp': {
      const grant =
        BALANCE.OWNER_BANQUET_XP[state.company.scale] +
        (state.company.execTrait === 'owner_centric' ? 25 : 0);
      xpDelta += grant;
      extraNoteKo = `오너 일가 특별 지원 예산 +${grant} XP 확보!`;
      extraNoteEn = `Unlocked +${grant} XP special budget from Chairman’s office!`;
      break;
    }
    case 'chairman_gamble': {
      if (buffs.factChecked || buffs.tfTurnsLeft > 0) {
        pressureDelta -= 14;
        reputationDelta += 5;
        extraNoteKo = '회장님이 전폭적 수습 권한을 위임해 위기 돌파구가 열렸습니다!';
        extraNoteEn = 'The Chairman authorized sweeping corrective measures!';
      } else if (rng.chance(0.42)) {
        backfired = true;
        pressureDelta = 14;
        riskDelta += 14;
        reputationDelta -= 6;
        extraNoteKo = '회장님의 즉흥적인 호통 발언이 새어나가 오히려 기름을 부었습니다!';
        extraNoteEn = 'The Chairman’s off-the-cuff tirade leaked and inflamed the press!';
      }
      break;
    }
    case 'dark_pressure': {
      if (skill.id === 'D31_hold_request') {
        if (lead.stats.intimacy >= 60 && !backfired) {
          pressureDelta = -22;
          extraNoteKo = '그동안 쌓은 두터운 친분 덕분에 이번 한 번만 보도를 보류받았습니다.';
          extraNoteEn = 'High personal trust convinced the reporter to hold off for now.';
        } else {
          backfired = true;
          pressureDelta = 10;
          trustDelta = -12;
          extraNoteKo = '신뢰도 없이 무작정 기사를 막아달라 했다가 특종 확신만 심어줬습니다!';
          extraNoteEn = 'Begging to hold without trust convinced them the scoop is huge!';
        }
      } else if (backfired) {
        pressureDelta = Math.abs(Math.round(skill.pressureDelta * 0.55));
        reputationDelta -= 6;
        if (memRec) memRec.caughtPressuring += 1;
        extraNoteKo = '부당한 회유·외압 시도가 역풍을 맞아 기자의 취재 의지가 폭발했습니다!';
        extraNoteEn = 'Backroom spin backfired—provoking fierce counter-investigation!';
      } else {
        if (memRec && rng.chance(0.4)) memRec.caughtPressuring += 1;
        extraNoteKo = '단기 보도 압박은 눌렀으나 역풍 위험(RISK)이 크게 쌓였습니다.';
        extraNoteEn = 'Short-term pressure suppressed, but serious RISK accumulated.';
      }
      break;
    }
    case 'legal_threat': {
      if (memRec) memRec.legalThreatsReceived += 1;
      if (lead.stats.evidenceLevel < 52 && !backfired) {
        pressureDelta = -24;
        extraNoteKo = '증거가 부족했던 기자가 소송 리스크를 의식해 기사 수위를 낮췄습니다.';
        extraNoteEn = 'With thin evidence, the legal warning forced a cautious rewrite.';
      } else {
        backfired = true;
        pressureDelta = 15;
        trustDelta = -22;
        reputationDelta -= 6;
        extraNoteKo = '확실한 증거를 쥔 기자에게 소송 협박을 했다가 전면전이 벌어졌습니다!';
        extraNoteEn = 'Threatening a reporter holding hard proof ignited all-out press war!';
      }
      break;
    }
    case 'all_out_budget': {
      if (backfired) {
        pressureDelta = 8;
        reputationDelta -= 8;
        if (memRec) memRec.caughtPressuring += 1;
        extraNoteKo = '물량 공세 배후가 탐사팀에 포착되어 역풍을 맞았습니다!';
        extraNoteEn = 'Your PR blitz trail got exposed by investigative reporters!';
      } else {
        extraNoteKo = '막대한 그룹 예산을 쏟아부어 여론 급한 불을 껐습니다 (RISK 급증 주의!).';
        extraNoteEn = 'Massive group budget blitz dampened headlines, spiking RISK!';
      }
      break;
    }
    case 'sincere_apology': {
      buffs.apologyIssued = true;
      if (memRec) memRec.sincereRemedies += 1;
      if (buffs.whistleblowerVerified) pressureDelta -= 6;
      extraNoteKo = '진정성 있는 공식 사과로 여론 악화를 진정시켰습니다.';
      extraNoteEn = 'Sincere public apology cooled down public anger.';
      break;
    }
    case 'factual_correction': {
      if (buffs.factChecked || buffs.disclosureAudited) {
        pressureDelta -= 10;
        reputationDelta += 4;
        if (memRec) memRec.accurateDataGiven += 1;
        extraNoteKo = '사전 팩트 검증 데이터와 결합해 완벽한 정정 근거를 제시했습니다!';
        extraNoteEn = 'Paired with verified data, your correction proof was undeniable!';
      } else {
        extraNoteKo = '사실과 다른 대목에 대해 정정 자료를 제출했습니다.';
        extraNoteEn = 'Submitted factual correction materials.';
      }
      break;
    }
    case 'victim_compensation': {
      buffs.compensationIssued = true;
      if (memRec) memRec.sincereRemedies += 1;
      if (battle.stage === 1 || battle.stage === 2 || battle.ownerVariant === 'safety_coverup') {
        pressureDelta -= 8;
        reputationDelta += 4;
      }
      extraNoteKo = '선제적인 피해자 구제·보상안 발표로 여론이 우호적으로 돌아섰습니다!';
      extraNoteEn = 'Proactive victim compensation turned public sentiment around!';
      break;
    }
    case 'exec_replacement': {
      buffs.reformIssued = true;
      if (memRec) memRec.sincereRemedies += 1;
      extraNoteKo = '책임 임원 전격 문책으로 단호한 쇄신 의지를 증명했습니다!';
      extraNoteEn = 'Executive dismissal demonstrated decisive accountability!';
      break;
    }
    case 'substantive_reform': {
      buffs.reformIssued = true;
      if (memRec) memRec.sincereRemedies += 1;
      if (buffs.whistleblowerVerified || buffs.factChecked) {
        pressureDelta -= 7;
      }
      extraNoteKo = '구체적인 재발 방지 제도 개혁안을 발표해 신뢰 회복 발판을 마련했습니다!';
      extraNoteEn = 'Concrete structural reforms laid the groundwork for trust restoration!';
      break;
    }
    case 'emergency_rest': {
      buffs.hangoverNextTurn = false;
      extraNoteKo = '수액 한 팩과 꿀잠으로 체력(HP)을 대폭 회복했습니다!';
      extraNoteEn = 'IV drip and power nap restored precious stamina!';
      break;
    }
    default: {
      // Standard skills (A01~A10)
      if (skill.id === 'A05_dinner_drinks' || skill.id === 'A06_bomb_shot') {
        if (!backfired && memRec) memRec.winedAndDined += 1;
      }
      if ((skill.id === 'A07_press_statement' || skill.id === 'A10_extra_materials') && buffs.factChecked) {
        pressureDelta = Math.round(pressureDelta * 1.45);
        reputationDelta += 3;
        if (memRec) memRec.accurateDataGiven += 1;
        extraNoteKo = '[팩트 검증 시너지] 탄탄한 근거 덕분에 해명 효과가 1.45배 증폭되었습니다!';
        extraNoteEn = '[Fact-Verified Synergy] 1.45x stronger statement impact!';
      } else if (skill.id === 'A10_extra_materials' && memRec) {
        memRec.accurateDataGiven += 1;
      }
      break;
    }
  }

  // Experience proficiency & analysis bonus on beneficial pressure reduction
  if (!backfired && pressureDelta < 0) {
    let bonusMult = 1.0 + expMod.skillProficiencyBonus;
    if (lead.isAnalyzed) bonusMult *= 1.12;
    if (buffs.dataMismatchDebuff && skill.category === 'A') bonusMult *= 0.72;
    if (battle.lastCategory === skill.category && battle.sameCategoryStreak >= 1) {
      const idx = Math.min(battle.sameCategoryStreak, BALANCE.SAME_CATEGORY_STREAK_PENALTY.length - 1);
      bonusMult *= BALANCE.SAME_CATEGORY_STREAK_PENALTY[idx];
    }
    pressureDelta = Math.round(pressureDelta * bonusMult);
  }

  if (backfired && pressureDelta < 0) {
    pressureDelta = Math.abs(Math.round(pressureDelta * 0.55));
  }

  // Update active journalists' trust/distrust & memory pool
  battle.journalists.forEach((j, idx) => {
    const scale = idx === 0 ? 1.0 : 0.7;
    j.stats.intimacy = clamp(j.stats.intimacy + trustDelta * scale, 0, 100);
    if (backfired) {
      j.stats.distrust = clamp(j.stats.distrust + 14, 0, 100);
    } else if (trustDelta > 6) {
      j.stats.distrust = clamp(j.stats.distrust - 6, 0, 100);
    }
    const poolMatch = updatedPool.find((p) => p.id === j.memoryId);
    if (poolMatch) {
      poolMatch.stats = { ...j.stats };
      poolMatch.relationshipTag = deriveRelationshipTag(poolMatch);
    }
  });

  // Determine outcome grade & dialogue
  let outcome: SkillOutcomeGrade = 'success';
  if (backfired) {
    outcome = 'backfire';
  } else if (pressureDelta <= -22 || xpDelta >= 40 || hpDelta >= 30) {
    outcome = 'great';
  } else if (Math.abs(pressureDelta) <= 4 && xpDelta <= 0 && hpDelta <= 0 && skill.category !== 'B') {
    outcome = 'minimal';
  }

  const replyKo = backfired
    ? rng.pick(archDef.badResponseLinesKo)
    : outcome === 'minimal'
      ? '“팀장님, 지금 그 얘기 할 때가 아닙니다. 핵심 팩트부터 주세요.”'
      : rng.pick(archDef.goodResponseLinesKo);

  const replyEn = backfired
    ? rng.pick(archDef.badResponseLinesEn)
    : outcome === 'minimal'
      ? '“Not now, Chief—stick to the core facts before my deadline.”'
      : rng.pick(archDef.goodResponseLinesEn);

  lead.currentDialogueKo = replyKo;
  lead.currentDialogueEn = replyEn;

  const pSign = pressureDelta > 0 ? `+${pressureDelta}` : `${pressureDelta}`;
  const tSign = trustDelta > 0 ? `+${trustDelta}` : `${trustDelta}`;

  return {
    xpDelta,
    hpDelta,
    riskDelta,
    reputationDelta,
    pressureDelta,
    trustDelta,
    deadlineDelta,
    outcome,
    logTitleKo: `${backfired ? '💥 [역효과]' : outcome === 'great' ? '🎯 [대성공]' : '📣 [홍담 대응]'} ${skill.nameKo}`,
    logTitleEn: `${backfired ? '💥 [Backfire]' : outcome === 'great' ? '🎯 [Critical Hit]' : '📣 [PR Action]'} ${skill.nameEn}`,
    logBodyKo: `${extraNoteKo || skill.descKo} (압박 ${pSign}, 신뢰 ${tSign}, XP ${xpDelta >= 0 ? `+${xpDelta}` : xpDelta}, HP ${hpDelta >= 0 ? `+${hpDelta}` : hpDelta}${riskDelta !== 0 ? `, RISK ${riskDelta > 0 ? `+${riskDelta}` : riskDelta}` : ''})`,
    logBodyEn: `${extraNoteEn || skill.descEn} (Pressure ${pSign}, Trust ${tSign}, XP ${xpDelta >= 0 ? `+${xpDelta}` : xpDelta}, HP ${hpDelta >= 0 ? `+${hpDelta}` : hpDelta}${riskDelta !== 0 ? `, RISK ${riskDelta > 0 ? `+${riskDelta}` : riskDelta}` : ''})`,
    journalistReplyKo: replyKo,
    journalistReplyEn: replyEn,
    updatedBuffs: buffs,
    updatedPool,
  };
}
