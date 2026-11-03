export type Language = 'ko' | 'en';

export type CompanyScaleId = 'startup' | 'sme' | 'midsize' | 'large' | 'chaebol';

export type IndustryId =
  | 'finance'
  | 'semiconductor'
  | 'automotive'
  | 'construction'
  | 'retail'
  | 'food'
  | 'platform'
  | 'gaming'
  | 'bio'
  | 'entertainment'
  | 'telecom'
  | 'defense';

export type ExecTraitId =
  | 'data_driven'
  | 'owner_centric'
  | 'legal_first'
  | 'transparent_pledge'
  | 'growth_obsessed'
  | 'succession_era';

export interface PRAppearance {
  skinTone: string;
  hairStyle: 'neat' | 'parted' | 'short' | 'bob';
  hairColor: string;
  suitColor: string;
  tieColor: string;
  glasses: boolean;
  expression: 'determined' | 'calm' | 'smile' | 'tired';
}

export interface PRPlayerProfile {
  name: string;
  companyName: string;
  resemblesRealCompany: boolean;
  experienceYears: number;
  rankKo: '홍보팀장';
  rankEn: 'PR Team Lead';
  appearance: PRAppearance;
}

export interface AssignedCompany {
  scale: CompanyScaleId;
  industry: IndustryId;
  execTrait: ExecTraitId;
  initialXp: number;
  xpCostMultiplier: number;
  pressureMultiplier: number;
  reputationSensitivity: number;
}

export type JournalistArchetypeId =
  | 'fact_checker'
  | 'scoop_hunter'
  | 'deadline_racer'
  | 'networker'
  | 'econ_veteran'
  | 'metro_striker'
  | 'rookie_passion'
  | 'sns_star'
  | 'followup_obsessed'
  | 'broadcast_pd'
  | 'data_journalist'
  | 'legend_investigative';

export interface JournalistStats {
  reportingPower: number;   // 취재력 (0~100)
  persistence: number;      // 집요함 (0~100)
  expertise: number;        // 전문성 (0~100)
  sourceNetwork: number;    // 정보원 네트워크 (0~100)
  deadlineUrgency: number;  // 마감 압박 (0~100)
  intimacy: number;         // 홍담과의 친밀도 / TRUST (0~100)
  distrust: number;         // 기업 불신도 (0~100)
  evidenceLevel: number;    // 증거 확보 수준 (0~100)
}

export type RelationshipTag = 'neutral' | 'trusted_source' | 'drinking_buddy' | 'hostile_watchdog';

export interface JournalistAppearance {
  skinTone: string;
  hairStyle: 'neat' | 'parted' | 'short' | 'bob';
  hairColor: string;
  jacketColor: string;
  pantsColor: string;
  pressCardColor: string;
  glasses: boolean;
  hatColor?: string;
  hasCamera?: boolean;
}

export interface JournalistMemoryRecord {
  id: string;
  nameKo: string;
  nameEn: string;
  outletKo: string;
  outletEn: string;
  titleKo: string;
  titleEn: string;
  archetype: JournalistArchetypeId;
  appearance: JournalistAppearance;
  stats: JournalistStats;
  timesMet: number;
  accurateDataGiven: number;
  caughtPressuring: number;
  winedAndDined: number;
  sincereRemedies: number;
  legalThreatsReceived: number;
  lastStageMet: number;
  relationshipTag: RelationshipTag;
}

export type Character3DAction =
  | 'idle'
  | 'phone_call'
  | 'notebook_out'
  | 'laptop_typing'
  | 'submit_doc'
  | 'table_social'
  | 'bomb_shot_stagger'
  | 'legal_squad'
  | 'press_conference'
  | 'prosecution_van'
  | 'final_boss_aura'
  | 'news_publish'
  | 'celebrate_promo'
  | 'demoted_box'
  | 'hospital_bed'
  | 'resignation_exit'
  | 'sincere_bow'
  | 'resting_drip'
  | 'shocked'
  | 'angry_point';

export interface ActiveJournalist {
  memoryId: string;
  nameKo: string;
  nameEn: string;
  outletKo: string;
  outletEn: string;
  titleKo: string;
  titleEn: string;
  archetype: JournalistArchetypeId;
  appearance: JournalistAppearance;
  stats: JournalistStats;
  isAnalyzed: boolean;
  intentProbed: boolean;
  isReturning: boolean;
  returningNoteKo?: string;
  returningNoteEn?: string;
  currentDialogueKo: string;
  currentDialogueEn: string;
  nextPlannedSkillId?: JournalistCounterSkillId;
  isLead: boolean;
}

export type JournalistCounterSkillId =
  | 'additional_reporting'
  | 'whistleblower_contact'
  | 'disclosure_analysis'
  | 'archive_search'
  | 'desk_report'
  | 'exclusive_draft'
  | 'joint_reporting'
  | 'broadcast_slot_lock'
  | 'followup_teaser'
  | 'owner_ambush'
  | 'official_inquiry'
  | 'breaking_flash';

export interface JournalistCounterSkillDef {
  id: JournalistCounterSkillId;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  pressureGain: number;
  evidenceGain: number;
  reputationDrop: number;
  deadlineShift: number;
  action3D: Character3DAction;
}

export type SkillCategory = 'A' | 'B' | 'C' | 'D' | 'E';

export type SkillSpecialMechanic =
  | 'none'
  | 'reveal_stats'
  | 'probe_intent'
  | 'stabilize_deadline'
  | 'verify_facts'
  | 'audit_disclosure'
  | 'verify_whistleblower'
  | 'convene_tf'
  | 'sentiment_shield'
  | 'grant_vp_xp'
  | 'legal_shield'
  | 'agency_support'
  | 'hire_consultant'
  | 'press_conference_swing'
  | 'ceo_address'
  | 'owner_banquet_xp'
  | 'chairman_gamble'
  | 'dark_pressure'
  | 'legal_threat'
  | 'all_out_budget'
  | 'sincere_apology'
  | 'factual_correction'
  | 'victim_compensation'
  | 'exec_replacement'
  | 'substantive_reform'
  | 'emergency_rest';

export interface SkillAffinityRule {
  trustMultiplier: number;
  pressureMultiplier: number;
  riskExtra: number;
  backfireChanceBonus: number;
  noteKo: string;
  noteEn: string;
}

export interface PRSkillDef {
  id: string;
  num: number;
  category: SkillCategory;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  culturalNoteEn?: string;
  xpCost: number;          // Base XP cost (can be negative or 0 if skill recovers/doesn't spend XP)
  scalesWithCompany: boolean;
  hpCost: number;          // Positive = consumes HP, Negative = heals HP
  riskDelta: number;
  reputationDelta: number;
  trustDelta: number;
  pressureDelta: number;   // Negative = reduces press pressure
  minStage: StageNumber;
  cooldown: number;
  deadlineMin: number;     // Minimum remaining turns required to execute (e.g. 2 means unusable when deadline === 1)
  mechanic: SkillSpecialMechanic;
  successCondKo: string;
  successCondEn: string;
  action3D: Character3DAction;
  affinities: Partial<Record<JournalistArchetypeId, SkillAffinityRule>>;
}

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type OwnerRiskVariantId =
  | 'embezzlement'
  | 'management_failure'
  | 'unfair_trading'
  | 'succession_scandal'
  | 'safety_coverup'
  | 'outrageous_conduct';

export type InternalCredibility = 'solid_company' | 'mixed_fault' | 'whistleblower_truth';

export interface StageBuffs {
  factChecked: boolean;
  disclosureAudited: boolean;
  whistleblowerVerified: boolean;
  tfTurnsLeft: number;
  sentimentShieldTurns: number;
  legalShieldActive: boolean;
  consultantActive: boolean;
  agencyActiveTurns: number;
  deadlineChecked: boolean;
  hangoverNextTurn: boolean;
  dataMismatchDebuff: boolean;
  legalPrConflict: boolean;
  apologyIssued: boolean;
  reformIssued: boolean;
  compensationIssued: boolean;
}

export type StageResolutionType =
  | 'scoop_withdrawn'
  | 'fact_corrected'
  | 'rebuttal_reflected'
  | 'publication_delayed'
  | 'trust_restored'
  | 'crisis_calmed'
  | 'damaging_report';

export interface StageHistoryEntry {
  stage: StageNumber;
  headlineKo: string;
  headlineEn: string;
  resolution: StageResolutionType;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  finalPressure: number;
  xpReward: number;
  hpReward: number;
  reputationShift: number;
  leadJournalistNameKo: string;
  leadJournalistNameEn: string;
}

export interface BattleLogEntry {
  id: string;
  turn: number;
  actor: 'player' | 'journalist' | 'event' | 'system';
  titleKo: string;
  titleEn: string;
  bodyKo: string;
  bodyEn: string;
  badgeKo?: string;
  badgeEn?: string;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

export interface StageBattleState {
  stage: StageNumber;
  headlineKo: string;
  headlineEn: string;
  subheadKo: string;
  subheadEn: string;
  pressure: number;           // 0 ~ 100
  deadline: number;           // Remaining turns
  maxDeadline: number;
  turnNumber: number;
  internalCredibility: InternalCredibility;
  ownerVariant?: OwnerRiskVariantId;
  journalists: ActiveJournalist[];
  cooldowns: Record<string, number>;
  buffs: StageBuffs;
  lastCategory?: SkillCategory;
  sameCategoryStreak: number;
  lastUsedSkillId?: string;
  triggeredEventIds: string[];
}

export type EndingId =
  | 'ending_exec_promotion'
  | 'ending_crisis_legend'
  | 'ending_eternal_lead'
  | 'ending_budget_exhausted'
  | 'ending_overwork_hospital'
  | 'ending_lobby_exposed'
  | 'ending_owner_scapegoat'
  | 'ending_resignation_escape'
  | 'hidden_whistleblower_hero'
  | 'hidden_boutique_founder';

export type PRArchetypeId =
  | 'type_bomb_shot'
  | 'type_hotline'
  | 'type_money_solver'
  | 'type_legal_shield'
  | 'type_fact_checker'
  | 'type_chairman_loyalist'
  | 'type_press_warrior'
  | 'type_crisis_master';

export interface EndingSummary {
  endingId: EndingId;
  isVictory: boolean;
  isHidden: boolean;
  archetypeId: PRArchetypeId;
  finalStage: StageNumber;
  topSkills: { skillId: string; count: number }[];
  trustedCount: number;
  hostileCount: number;
  completedAt: number;
}

export type GamePhase =
  | 'character_create'
  | 'company_assigned'
  | 'stage_intro'
  | 'battle'
  | 'stage_result'
  | 'ending';

export interface ResourcesState {
  xp: number;
  initialXp: number;
  hp: number;
  maxHp: number;
  risk: number;
  reputation: number;
  careerScore: number;
}

export interface SceneVisualCue {
  playerAction: Character3DAction;
  journalistAction: Character3DAction;
  propType: Character3DAction;
  playerSpeechKo?: string;
  playerSpeechEn?: string;
  journalistSpeechKo?: string;
  journalistSpeechEn?: string;
  timestamp: number;
}

export interface GameState {
  version: number;
  playId: string;
  seed: number;
  rngState: number;
  phase: GamePhase;
  player: PRPlayerProfile;
  company: AssignedCompany;
  resources: ResourcesState;
  currentStage: StageNumber;
  stageBattle: StageBattleState | null;
  lastStageSummary: StageHistoryEntry | null;
  stageHistory: StageHistoryEntry[];
  journalistPool: JournalistMemoryRecord[];
  unlockedSkillIds: string[];
  skillUsageCounts: Record<string, number>;
  battleLogs: BattleLogEntry[];
  telemetryLogs: ActionTelemetryRecord[];
  stageSnapshots: Partial<Record<StageNumber, StageReplaySnapshot>>;
  visualCue: SceneVisualCue;
  endingSummary: EndingSummary | null;
}

export interface SkillExecutionPreview {
  skillId: string;
  usable: boolean;
  lockReasonKo?: string;
  lockReasonEn?: string;
  effectiveXpCost: number;
  effectiveHpCost: number;
  expectedPressureDelta: number;
  expectedTrustDelta: number;
  expectedRiskDelta: number;
  expectedReputationDelta: number;
  affinityRating: 'great' | 'good' | 'neutral' | 'poor' | 'backfire';
  affinityNoteKo: string;
  affinityNoteEn: string;
  lethalWarningType?: 'xp' | 'hp' | 'risk' | 'reputation';
  lethalWarningKo?: string;
  lethalWarningEn?: string;
}

// Community (홍담 대나무숲)
export type BambooCategory =
  | 'all'
  | 'defense_win'
  | 'survival_log'
  | 'hangover'
  | 'chairman_risk'
  | 'resign_escape';

export type BambooReactionType =
  | 'soju'
  | 'summon_reporter'
  | 'call_chairman'
  | 'comfort'
  | 'congrats';

export interface BambooPost {
  id: string;
  authorNickname: string;
  companyLabel?: string;
  endingBadgeKo?: string;
  endingBadgeEn?: string;
  archetypeBadgeKo?: string;
  archetypeBadgeEn?: string;
  category: Exclude<BambooCategory, 'all'>;
  content: string;
  contentEn?: string;
  createdAt: number;
  isPresetSample?: boolean;
  isLocalDemoOnly?: boolean;
  reportCount?: number;
  reactions: Record<BambooReactionType, number>;
}

// ==================== DATA JOURNALISM & TELEMETRY TYPES ====================

export interface ResourcePointSnapshot {
  xp: number;
  hp: number;
  risk: number;
  reputation: number;
  trust: number;
  pressure: number;
  deadline: number;
}

export type SkillOutcomeGrade = 'great' | 'success' | 'minimal' | 'backfire';

export interface ActionTelemetryRecord {
  id: string;
  playId: string;
  timestamp: number;
  stage: StageNumber;
  stageTurn: number;
  globalTurn: number;
  companyScale: CompanyScaleId;
  industry: IndustryId;
  journalistArchetype: JournalistArchetypeId;
  journalistNameKo: string;
  journalistNameEn: string;
  journalistStats: JournalistStats;
  articleTypeKo: string;
  articleTypeEn: string;
  headlineKo: string;
  headlineEn: string;
  severity: number; // 1 ~ 6
  skillId: string;
  skillCategory: SkillCategory;
  before: ResourcePointSnapshot;
  afterPlayerAction: ResourcePointSnapshot;
  afterTurnComplete: ResourcePointSnapshot;
  playerSkillDeltas: {
    xp: number;
    hp: number;
    risk: number;
    reputation: number;
    trust: number;
    pressure: number;
  };
  netTurnDeltas: {
    xp: number;
    hp: number;
    risk: number;
    reputation: number;
    trust: number;
    pressure: number;
  };
  skillOutcome: SkillOutcomeGrade;
  skillSucceeded: boolean;
  suddenEventTriggered: boolean;
  suddenEventId?: string;
  suddenEventTitleKo?: string;
  suddenEventTitleEn?: string;
  enemySkillId?: JournalistCounterSkillId;
  stageResolution: StageResolutionType | 'in_progress';
  finalEndingId?: EndingId;
}

export interface StageReplaySnapshot {
  stage: StageNumber;
  rngStateAtStart: number;
  resourcesAtStart: ResourcesState;
  stageBattleAtStart: StageBattleState;
  journalistPoolAtStart: JournalistMemoryRecord[];
  unlockedSkillIdsAtStart: string[];
  skillUsageCountsAtStart: Record<string, number>;
  chosenSkillSequence: string[];
}

export type StrategyPolicyId =
  | 'relationship'
  | 'big_budget'
  | 'legal_defense'
  | 'fact_check'
  | 'transparent_remedy'
  | 'random_baseline'
  | 'player_habit';

export interface CounterfactualComparisonSide {
  labelKo: string;
  labelEn: string;
  skillSequence: string[];
  finalResources: ResourcesState;
  carryOverResources: ResourcesState; // Resources entering next stage after stage reward
  finalPressure: number;
  finalTrust: number;
  resolution: StageResolutionType | 'game_over';
  gameOverEndingId?: EndingId;
  grade: 'S' | 'A' | 'B' | 'C' | 'F';
  turnTrajectory: {
    turn: number;
    skillId?: string;
    pressure: number;
    xp: number;
    hp: number;
    risk: number;
    reputation: number;
    trust: number;
  }[];
}

export interface WhatIfResult {
  stage: StageNumber;
  seedUsed: number;
  mode: 'single_turn' | 'full_strategy';
  turnIndexReplaced?: number;
  questionKo: string;
  questionEn: string;
  actual: CounterfactualComparisonSide;
  counterfactual: CounterfactualComparisonSide;
}

export interface MonteCarloResult {
  iterations: number;
  seedUsed: number;
  startStage: StageNumber;
  companyScale: CompanyScaleId;
  strategyPolicy: StrategyPolicyId;
  reachStage6Rate: number;        // 0 ~ 100
  execPromotionRate: number;      // 0 ~ 100 (includes crisis_legend & hidden victory)
  anySurvivalVictoryRate: number; // 0 ~ 100 (includes eternal_lead)
  xpExhaustedRate: number;        // 0 ~ 100
  hpExhaustedRate: number;        // 0 ~ 100
  riskExplodedRate: number;       // 0 ~ 100
  reputationCollapsedRate: number;// 0 ~ 100
  avgFinalXp: number;
  avgFinalHp: number;
  avgFinalRisk: number;
  avgFinalReputation: number;
  reputationDistribution: { bucketLabel: string; min: number; max: number; count: number; rate: number }[];
  stageSurvivalRates: { stage: StageNumber; survivedRate: number; avgXp: number; avgHp: number; avgRisk: number; avgRep: number }[];
}
