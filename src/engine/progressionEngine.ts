import {
  AssignedCompany,
  ResourcesState,
  StageBattleState,
  StageHistoryEntry,
  StageNumber,
  StageResolutionType,
} from '../types/game';
import { COMPANY_SCALES } from '../data/companies';
import { PR_SKILLS } from '../data/skills';
import { BALANCE, clamp } from './balanceConfig';

export const STAGE_RESOLUTION_META: Record<
  StageResolutionType,
  {
    nameKo: string;
    nameEn: string;
    descKo: string;
    descEn: string;
    isSuccess: boolean;
    reputationBonus: number;
    xpBonusMultiplier: number;
  }
> = {
  scoop_withdrawn: {
    nameKo: '보도 철회 · 단독 무산',
    nameEn: 'Scoop Dropped · Story Withdrawn',
    descKo: '완벽한 초동 대처와 근거 제시로 보도 압박을 완전히 해소해 기사화 자체가 철회되었습니다!',
    descEn: 'Flawless early response dissolved press pressure completely—the desk dropped the story!',
    isSuccess: true,
    reputationBonus: 8,
    xpBonusMultiplier: 1.25,
  },
  trust_restored: {
    nameKo: '신뢰 회복 · 전화위복 보도',
    nameEn: 'Trust Restored · Positive Turnaround',
    descKo: '진정성 있는 사과·보상·제도 개선이 호평받으며 ‘책임 경영 모범 사례’로 논조가 반전되었습니다!',
    descEn: 'Sincere remedies flipped the narrative into a spotlight on accountable leadership!',
    isSuccess: true,
    reputationBonus: 11,
    xpBonusMultiplier: 1.2,
  },
  fact_corrected: {
    nameKo: '기사 정정 · 팩트 바로잡기 성공',
    nameEn: 'Factual Correction Reflected',
    descKo: '철저한 사내 팩트체크와 공시 증빙 덕분에 잘못된 의혹이 정정되고 정확한 사실만 보도되었습니다.',
    descEn: 'Verified disclosures corrected false claims before they could damage corporate standing.',
    isSuccess: true,
    reputationBonus: 7,
    xpBonusMultiplier: 1.15,
  },
  publication_delayed: {
    nameKo: '보도 연기 · 후속 검증 전환',
    nameEn: 'Publication Delayed · On Hold',
    descKo: '마감 조율과 두터운 신뢰를 바탕으로 성급한 속보를 막고 충분한 소명 시간을 확보했습니다.',
    descEn: 'Press trust and deadline management convinced the desk to hold publication for fair review.',
    isSuccess: true,
    reputationBonus: 4,
    xpBonusMultiplier: 1.05,
  },
  rebuttal_reflected: {
    nameKo: '반론 충실 반영 · 균형 보도',
    nameEn: 'Balanced Coverage · Full Rebuttal',
    descKo: '기사는 출고되었으나 회사 측 입장과 배경 설명이 제목과 본문에 비중 있게 실려 파장을 최소화했습니다.',
    descEn: 'The article ran, but your rebuttal received prominent weight in both subhead and copy.',
    isSuccess: true,
    reputationBonus: 3,
    xpBonusMultiplier: 1.0,
  },
  crisis_calmed: {
    nameKo: '위기 진정 · 연착륙 방어',
    nameEn: 'Crisis Contained · Soft Landing',
    descKo: '일부 비판 기사가 나갔으나 치명적인 확산 없이 여론이 조기에 진정 국면으로 접어들었습니다.',
    descEn: 'Critical coverage appeared, yet swift containment prevented a wider firestorm.',
    isSuccess: true,
    reputationBonus: -2,
    xpBonusMultiplier: 0.9,
  },
  damaging_report: {
    nameKo: '강행 보도 타격 · 방어 실패',
    nameEn: 'Damaging Headline Drop · Uncontained',
    descKo: '보도 압박을 낮추지 못한 채 마감이 도래해 1면 비판 기사가 강행 출고되었습니다! 평판에 큰 타격을 입습니다.',
    descEn: 'Deadline hit with high press pressure—a scathing headline slammed corporate reputation!',
    isSuccess: false,
    reputationBonus: -14,
    xpBonusMultiplier: 0.65,
  },
};

export function determineStageResolution(
  battle: StageBattleState,
  resources: ResourcesState
): { resolution: StageResolutionType; grade: StageHistoryEntry['grade'] } {
  const p = battle.pressure;
  const leadTrust = battle.journalists[0]?.stats.intimacy ?? 40;

  if (p <= BALANCE.EARLY_CLEAR_PRESSURE) {
    return { resolution: 'scoop_withdrawn', grade: 'S' };
  }

  if (p <= BALANCE.TRUST_RESTORE_THRESHOLD && (battle.buffs.reformIssued || battle.buffs.compensationIssued) && resources.reputation >= 55) {
    return { resolution: 'trust_restored', grade: p <= 35 ? 'S' : 'A' };
  }

  if (p <= BALANCE.FACT_CORRECT_THRESHOLD && (battle.buffs.factChecked || battle.buffs.disclosureAudited)) {
    return { resolution: 'fact_corrected', grade: p <= 32 ? 'S' : 'A' };
  }

  if (p <= BALANCE.DELAY_THRESHOLD && (battle.buffs.deadlineChecked || leadTrust >= 65)) {
    return { resolution: 'publication_delayed', grade: 'A' };
  }

  if (p <= BALANCE.REBUTTAL_THRESHOLD && leadTrust >= 45) {
    return { resolution: 'rebuttal_reflected', grade: 'B' };
  }

  if (p <= BALANCE.CLEAR_PRESSURE_THRESHOLD) {
    return { resolution: 'crisis_calmed', grade: 'C' };
  }

  return { resolution: 'damaging_report', grade: 'F' };
}

export function calculateStageRewards(
  stage: StageNumber,
  resolution: StageResolutionType,
  grade: StageHistoryEntry['grade'],
  company: AssignedCompany,
  currentResources: ResourcesState
): {
  xpReward: number;
  hpReward: number;
  reputationShift: number;
  careerScoreGain: number;
  newlyUnlockedSkillIds: string[];
  updatedResources: ResourcesState;
} {
  const scaleDef = COMPANY_SCALES[company.scale];
  const resMeta = STAGE_RESOLUTION_META[resolution];

  const growthBonus = company.execTrait === 'growth_obsessed' && resMeta.isSuccess ? 1.15 : 1.0;
  const stageScale = 1 + (stage - 1) * 0.12;

  const xpReward = stage < 6
    ? Math.round(scaleDef.stageRewardXp * resMeta.xpBonusMultiplier * growthBonus * stageScale)
    : 0;

  const hpReward = stage < 6 ? (resMeta.isSuccess ? 26 : 20) : 0;
  const reputationShift = Math.round(
    resMeta.reputationBonus * (resMeta.reputationBonus < 0 ? company.reputationSensitivity : 1.0)
  );

  const gradeScoreMap = { S: 220, A: 175, B: 135, C: 95, F: 30 };
  const careerScoreGain = Math.round(
    (gradeScoreMap[grade] + stage * 25) * (scaleDef.scoreMultiplier || 1.0)
  );

  const nextStage = Math.min(6, stage + 1) as StageNumber;
  const newlyUnlockedSkillIds = PR_SKILLS.filter((s) => s.minStage === nextStage).map((s) => s.id);

  const updatedResources: ResourcesState = {
    ...currentResources,
    xp: Math.max(0, currentResources.xp + xpReward),
    hp: clamp(currentResources.hp + hpReward, 0, currentResources.maxHp),
    reputation: clamp(currentResources.reputation + reputationShift, 0, BALANCE.MAX_REPUTATION),
    risk: resMeta.isSuccess ? clamp(currentResources.risk - 7, 0, BALANCE.MAX_RISK) : clamp(currentResources.risk + 6, 0, BALANCE.MAX_RISK),
    careerScore: currentResources.careerScore + careerScoreGain,
  };

  return {
    xpReward,
    hpReward,
    reputationShift,
    careerScoreGain,
    newlyUnlockedSkillIds,
    updatedResources,
  };
}
