import React, { Suspense, useEffect, useRef, useState } from 'react';
import { COMPANY_SCALES, INDUSTRIES } from './data/companies';
import { ENDINGS } from './data/endings';
import { MAX_COMPANY_REROLLS } from './engine/balanceConfig';
import {
  initializeNewRun,
  playBattleTurn,
  proceedToNextStage,
  retryCurrentStage,
  startStageBattle,
  triggerVoluntaryResignation,
} from './engine/gameEngine';
import { STAGE_RESOLUTION_META } from './engine/progressionEngine';
import { DIFFICULTY_SETTINGS } from './engine/difficultyConfig';
import { useLanguage } from './i18n/LanguageContext';
import { LanguageProvider } from './i18n/LanguageProvider';
import {
  clearSavedGameState,
  getFinishedRunCount,
  loadGameState,
  recordFinishedRunCount,
  saveGameState,
} from './storage/storage';
import { GameState, PRPlayerProfile, SkillExecutionPreview, StageNumber } from './types/game';
import {
  clearChallengeParamsFromUrl,
  IncomingChallengeParams,
  parseChallengeFromUrl,
} from './utils/challengeShare';
import { trackFunnelStep } from './utils/funnelTracker';
import { BambooGroveModal } from './components/BambooGroveModal';
import { BattleHUD } from './components/BattleHUD';
import { BeginnerTutorialGuide } from './components/BeginnerTutorialGuide';
import { ReporterReactionPanel } from './components/ReporterReactionPanel';
import { CharacterCreationScreen } from './components/CharacterCreationScreen';
import { CraftUniverseNavbar } from './components/CraftUniverseNavbar';
import { DangerConfirmModal } from './components/DangerConfirmModal';
import { EndingResultScreen } from './components/EndingResultScreen';
import { HongdamDataLabView } from './components/HongdamDataLabView';
import { ModelMethodologyModal } from './components/ModelMethodologyModal';
import { ShareCardModal } from './components/ShareCardModal';
import { SkillInventoryPanel } from './components/SkillInventoryPanel';
import { StageReportModal } from './components/StageReportModal';
import { SurvivalSimulatorModal } from './components/SurvivalSimulatorModal';
import { VisitorCounter } from './components/VisitorCounter';
import { WhatIfModal } from './components/WhatIfModal';

const BattleArenaCanvas = React.lazy(() => import('./components/3d/BattleArenaCanvas'));

const HongdamAppInner: React.FC = () => {
  const { isEn } = useLanguage();

  const [gameState, setGameState] = useState<GameState>(() => loadGameState());
  const [activeView, setActiveView] = useState<'game' | 'datalab'>(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return p.get('view') === 'datalab' ? 'datalab' : 'game';
    } catch {
      return 'game';
    }
  });

  // Modals
  const [showBamboo, setShowBamboo] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showSurvivalSim, setShowSurvivalSim] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [whatIfStage, setWhatIfStage] = useState<StageNumber | null>(null);
  const [dangerModal, setDangerModal] = useState<{
    mode: 'lethal_skill' | 'resignation';
    skillId?: string;
    preview?: SkillExecutionPreview;
  } | null>(null);

  const [finishedCount, setFinishedCount] = useState<number>(() => getFinishedRunCount());
  const [rerollsLeft, setRerollsLeft] = useState<number>(MAX_COMPANY_REROLLS);
  const [showSetup3D, setShowSetup3D] = useState<boolean>(false);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallengeParams | null>(() =>
    parseChallengeFromUrl()
  );
  const recordedEndingPlayIdRef = useRef<string | null>(
    gameState.phase === 'ending' ? gameState.playId : null
  );

  // Track initial page visit in conversion funnel once per session
  useEffect(() => {
    trackFunnelStep('visit');
  }, []);

  // Persist every gameState change automatically to localStorage
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Increment completed run counter purely once per unique playId upon reaching ending
  useEffect(() => {
    if (gameState.phase === 'ending' && recordedEndingPlayIdRef.current !== gameState.playId) {
      recordedEndingPlayIdRef.current = gameState.playId;
      setFinishedCount(recordFinishedRunCount());
      trackFunnelStep('ending', gameState.playId);
    }
  }, [gameState.phase, gameState.playId]);

  // Sync URL query param when switching between Game & Data Lab
  const handleSwitchView = (v: 'game' | 'datalab') => {
    setActiveView(v);
    try {
      const url = new URL(window.location.href);
      if (v === 'datalab') {
        url.searchParams.set('view', 'datalab');
      } else {
        url.searchParams.delete('view');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const handleUpdateSetupProfile = (profile: PRPlayerProfile) => {
    setGameState((prev) => ({
      ...prev,
      player: profile,
    }));
  };

  const handleAssignCompany = () => {
    setRerollsLeft(MAX_COMPANY_REROLLS);
    setGameState((prev) => initializeNewRun(prev.player));
  };

  const handleRerollCompany = () => {
    if (rerollsLeft <= 0) return;
    setRerollsLeft((r) => Math.max(0, r - 1));
    setGameState((prev) => initializeNewRun(prev.player));
  };

  const handleStartStage1 = () => {
    setGameState((prev) => {
      const next = startStageBattle(prev, 1);
      trackFunnelStep('start', next.playId);
      return next;
    });
  };

  // 1-Click Quick Start: immediately assigns random scenario and enters Stage 1 battle
  const handleQuickStart = () => {
    setGameState((prev) => {
      const assigned = initializeNewRun(prev.player);
      const battleState = startStageBattle(assigned, 1);
      trackFunnelStep('start', battleState.playId);
      return battleState;
    });
    handleSwitchView('game');
  };

  // Accept incoming Same-Seed Friend Challenge URL
  const handleAcceptChallenge = () => {
    if (!incomingChallenge) return;
    const ch = incomingChallenge;
    setGameState((prev) => {
      const challengeProfile: PRPlayerProfile = {
        ...prev.player,
        experienceYears: ch.expYears ?? prev.player.experienceYears,
      };
      const assigned = initializeNewRun(challengeProfile, {
        seed: ch.seed,
        forcedScale: ch.scale,
        forcedIndustry: ch.industry,
      });
      const battleState = startStageBattle(assigned, 1);
      trackFunnelStep('start', battleState.playId);
      return battleState;
    });
    clearChallengeParamsFromUrl();
    setIncomingChallenge(null);
    handleSwitchView('game');
  };

  const handleDismissChallenge = () => {
    clearChallengeParamsFromUrl();
    setIncomingChallenge(null);
  };

  const executeSkillConfirmed = (skillId: string) => {
    setGameState((prev) => {
      const next = playBattleTurn(prev, skillId);
      if (
        prev.phase === 'battle' &&
        next.phase === 'stage_result' &&
        next.lastStageSummary?.stage === 1 &&
        STAGE_RESOLUTION_META[next.lastStageSummary.resolution]?.isSuccess
      ) {
        trackFunnelStep('stage1_clear', next.playId);
      }
      if (prev.phase !== 'ending' && next.phase === 'ending' && next.endingSummary) {
        const endDef = ENDINGS[next.endingSummary.endingId];
        next.visualCue = {
          ...next.visualCue,
          playerAction: endDef.sceneAction,
          propType: endDef.sceneAction,
          timestamp: Date.now(),
        };
      }
      return next;
    });
  };

  const handleProceedNextStage = () => {
    setGameState((prev) => {
      const next = proceedToNextStage(prev);
      if (prev.phase !== 'ending' && next.phase === 'ending' && next.endingSummary) {
        const endDef = ENDINGS[next.endingSummary.endingId];
        next.visualCue = {
          ...next.visualCue,
          playerAction: endDef.sceneAction,
          propType: endDef.sceneAction,
          timestamp: Date.now(),
        };
      }
      return next;
    });
  };

  const handleRetryStage = () => {
    setGameState((prev) => retryCurrentStage(prev));
  };

  const handleRestartGame = () => {
    const fresh = clearSavedGameState();
    setRerollsLeft(MAX_COMPANY_REROLLS);
    setGameState(fresh);
    handleSwitchView('game');
  };

  const currentHeadline = gameState.stageBattle
    ? isEn
      ? gameState.stageBattle.headlineEn
      : gameState.stageBattle.headlineKo
    : isEn
      ? '“[Exclusive] Breaking Scoop Incoming…”'
      : '“[단독] 취재 질문지가 곧 도착합니다…”';

  const scaleMeta = COMPANY_SCALES[gameState.company.scale];
  const indMeta = INDUSTRIES[gameState.company.industry];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-red-600 selection:text-white">
      {/* Unified Header Navigation (Personnel Craft Design Consistency) */}
      <CraftUniverseNavbar
        activeView={activeView}
        currentPhase={gameState.phase}
        currentStage={gameState.currentStage}
        onChangeView={handleSwitchView}
        onOpenBamboo={() => setShowBamboo(true)}
        onOpenMethodology={() => setShowMethodology(true)}
        onResetGame={handleRestartGame}
        onBeforeNavigateExternal={() => saveGameState(gameState)}
      />

      {/* Main Content Area */}
      {incomingChallenge &&
        gameState.phase !== 'character_create' &&
        gameState.phase !== 'company_assigned' && (
          <div className="bg-rose-950/90 border-b border-rose-500/80 px-4 py-2.5">
            <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-pixel">
              <span className="text-rose-100">
                🔥{' '}
                {isEn
                  ? `Same-Seed Crisis Challenge arrived (Seed #${incomingChallenge.seed})! Start this exact scenario?`
                  : `${incomingChallenge.challengerName ? `${incomingChallenge.challengerName}님의 ` : ''}동일 조건 위기대응 도전장(시드 #${incomingChallenge.seed})이 도착했습니다!`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAcceptChallenge}
                  className="pixel-btn-mc pixel-btn-mc-gold px-3 py-1 text-xs font-bold"
                >
                  {isEn ? 'Accept Challenge Now' : '이 도전장으로 즉시 새 게임 시작'}
                </button>
                <button
                  onClick={handleDismissChallenge}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-[11px]"
                >
                  {isEn ? 'Keep Current Save' : '현재 진행 유지'}
                </button>
              </div>
            </div>
          </div>
        )}

      {activeView === 'datalab' ? (
        <main className="flex-1">
          <HongdamDataLabView
            onBackToGame={() => handleSwitchView('game')}
            onOpenMethodology={() => setShowMethodology(true)}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-5 lg:p-6">
          {/* SETUP PHASES: Character Create & Company Assigned */}
          {(gameState.phase === 'character_create' || gameState.phase === 'company_assigned') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              {/* Mobile Bottom / Desktop Left Sticky: Instant 2D Pixel War-Room Viewer or Live 3D Voxel Canvas */}
              <div className="order-2 lg:order-1 lg:col-span-6 lg:sticky lg:top-24 space-y-3">
                <div className="h-[295px] sm:h-[420px] lg:h-[500px] w-full">
                  {showSetup3D ? (
                    <Suspense
                      fallback={
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl border-4 border-slate-800 text-slate-300 font-pixel gap-3 shadow-[4px_4px_0_#000]">
                          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm font-bold text-amber-300">
                            {isEn ? 'Loading 3D Voxel Arena...' : '3D 복셀 홍보실 로딩 중...'}
                          </span>
                        </div>
                      }
                    >
                      <BattleArenaCanvas
                        phase={gameState.phase}
                        stage={1}
                        playerName={gameState.player.name}
                        playerAppearance={gameState.player.appearance}
                        journalists={[]}
                        headline={currentHeadline}
                        deadline={5}
                        pressure={52}
                        visualCue={gameState.visualCue}
                      />
                    </Suspense>
                  ) : (
                    <div className="w-full h-full rounded-2xl border-4 border-slate-800 bg-gradient-to-b from-slate-900 via-[#101829] to-slate-950 shadow-[4px_4px_0_#000] p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden">
                      {/* Breaking Ticker Top Bar */}
                      <div className="newspaper-banner px-3 py-1.5 rounded flex items-center justify-between gap-2 text-xs font-pixel">
                        <span className="bg-red-600 text-white px-2 py-0.5 font-extrabold shrink-0">
                          {isEn ? 'BREAKING' : '단독예고'}
                        </span>
                        <span className="truncate font-bold">{currentHeadline}</span>
                        <span className="text-[11px] text-red-700 font-bold shrink-0">D-5</span>
                      </div>

                      {/* Center Pixel Voxel Avatar & Confrontation Stage Preview */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-auto py-2">
                        {/* Stylized Voxel PR Chief Character Preview */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-24 h-28 rounded-xl bg-slate-950/90 border-2 border-amber-400/70 shadow-[3px_3px_0_#000] flex flex-col items-center justify-center p-2 relative">
                            {/* Hair */}
                            <div
                              className="w-11 h-3.5 rounded-t-sm bg-slate-900 border border-slate-700"
                              style={{
                                borderBottomWidth: gameState.player.appearance.hairStyle === 'bob' ? '6px' : '2px',
                              }}
                            />
                            {/* Head */}
                            <div
                              className="w-10 h-9 border border-black/40 flex items-center justify-center relative"
                              style={{ backgroundColor: gameState.player.appearance.skinTone }}
                            >
                              {gameState.player.appearance.glasses ? (
                                <div className="flex items-center gap-1">
                                  <span className="w-2.5 h-2 border border-slate-900 bg-sky-200/50 inline-block" />
                                  <span className="w-2.5 h-2 border border-slate-900 bg-sky-200/50 inline-block" />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2.5">
                                  <span className="w-1.5 h-1.5 bg-slate-900 inline-block" />
                                  <span className="w-1.5 h-1.5 bg-slate-900 inline-block" />
                                </div>
                              )}
                            </div>
                            {/* Suit & Tie */}
                            <div
                              className="w-12 h-9 rounded-b-sm border border-black/50 flex justify-center pt-1"
                              style={{ backgroundColor: gameState.player.appearance.suitColor }}
                            >
                              <div
                                className="w-2 h-6"
                                style={{ backgroundColor: gameState.player.appearance.tieColor }}
                              />
                            </div>
                          </div>
                          <span className="font-pixel text-xs text-amber-300 font-bold">
                            {gameState.player.name} ({gameState.player.experienceYears}
                            {isEn ? 'y' : '년차'})
                          </span>
                        </div>

                        <div className="font-pixel text-xl sm:text-2xl text-rose-400 font-black">VS</div>

                        {/* Reporter Silhouette Card */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-24 h-28 rounded-xl bg-slate-950/90 border-2 border-rose-500/70 shadow-[3px_3px_0_#000] flex flex-col items-center justify-center p-2 text-center">
                            <span className="text-3xl">🎙️</span>
                            <span className="font-pixel text-[11px] text-rose-300 font-bold mt-1.5">
                              {isEn ? '12 Beat Reporters' : '출입기자 12유형'}
                            </span>
                            <span className="font-pixel text-[10px] text-slate-400">
                              {isEn ? 'Memory & Affinity' : '기억·상성 AI'}
                            </span>
                          </div>
                          <span className="font-pixel text-xs text-rose-300 font-bold">
                            {isEn ? '6 Crisis Stages' : '6단계 위기 취재'}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Toggle to Load Full 3D Voxel Canvas on Demand */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/90">
                        <span className="text-[11px] font-pixel text-slate-400">
                          {isEn
                            ? '⚡ Fast 2D Briefing Mode (3D auto-loads in battle)'
                            : '⚡ 초고속 브리핑 프리뷰 (본 게임 출격 시 3D 자동 가동)'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowSetup3D(true)}
                          className="pixel-btn-mc px-3 py-1.5 text-[11px] text-sky-200 border-sky-500 font-bold"
                        >
                          🧊 {isEn ? 'Enable Live 3D Voxel Preview' : '3D 복셀 캐릭터 미리보기 켜기'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Personnel Craft Signature Bottom Status Briefing Chip */}
                <div className="bg-slate-900/95 p-3 rounded-xl border-2 border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0_#000] font-pixel">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-100 font-bold">
                      {gameState.player.name} ({isEn ? `Year ${gameState.player.experienceYears} PR Lead` : `${gameState.player.experienceYears}년차 홍보팀장`})
                    </span>
                  </div>
                  <div className="text-amber-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {gameState.phase === 'company_assigned'
                      ? isEn
                        ? `${gameState.player.companyName} · ${scaleMeta.nameEn}`
                        : `${gameState.player.companyName} · ${scaleMeta.nameKo} (${indMeta.nameKo})`
                      : isEn
                        ? `Target: ${gameState.player.companyName}`
                        : `소속 예정: ${gameState.player.companyName}`}
                  </div>
                </div>

                {/* Quick Game Concept Highlight Strip */}
                <div className="pixel-card p-3 grid grid-cols-3 gap-2 text-center font-pixel text-xs">
                  <div className="bg-slate-950/90 p-2 rounded border border-slate-800">
                    <div className="text-amber-300 font-bold">6 STAGES</div>
                    <div className="text-[10px] text-slate-400">
                      {isEn ? 'Product → Owner Risk' : '단독기사~오너리스크'}
                    </div>
                  </div>
                  <div className="bg-slate-950/90 p-2 rounded border border-slate-800">
                    <div className="text-rose-300 font-bold">12 REPORTERS</div>
                    <div className="text-[10px] text-slate-400">
                      {isEn ? 'Persistent Memory AI' : '기억 시스템·상성'}
                    </div>
                  </div>
                  <div className="bg-slate-950/90 p-2 rounded border border-slate-800">
                    <div className="text-sky-300 font-bold">20 CORE SKILLS</div>
                    <div className="text-[10px] text-slate-400">
                      {isEn ? 'WHAT-IF + Data Lab' : '반사실 분석·데이터랩'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Top (Zero Scroll!) / Desktop Right: Setup Form */}
              <div className="order-1 lg:order-2 lg:col-span-6">
                <CharacterCreationScreen
                  phase={gameState.phase}
                  profile={gameState.player}
                  company={gameState.company}
                  rerollsLeft={rerollsLeft}
                  incomingChallenge={incomingChallenge}
                  onChangeProfile={handleUpdateSetupProfile}
                  onQuickStart={handleQuickStart}
                  onAcceptChallenge={handleAcceptChallenge}
                  onDismissChallenge={handleDismissChallenge}
                  onAssignCompany={handleAssignCompany}
                  onRerollCompany={handleRerollCompany}
                  onStartStage1={handleStartStage1}
                  onOpenDataLab={() => handleSwitchView('datalab')}
                  onOpenSimulator={() => setShowSurvivalSim(true)}
                />
              </div>
            </div>
          )}

          {/* ACTIVE BATTLE PHASE (Mobile: 3D Top -> Inventory Bottom; Desktop: 2-Column) */}
          {gameState.phase === 'battle' && gameState.stageBattle && (
            <div className="space-y-3">
              <BeginnerTutorialGuide state={gameState} />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left / Top: 3D Battle Arena + Status Chip + HUD */}
              <div className="lg:col-span-6 space-y-3">
                <div className="h-[275px] sm:h-[360px] lg:h-[395px] w-full">
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl border-4 border-slate-800 text-slate-300 font-pixel gap-3 shadow-[4px_4px_0_#000]">
                        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-bold text-amber-300">
                          {isEn ? 'Loading 3D PR Battle...' : '3D 복셀 배틀 장면 로딩 중...'}
                        </span>
                      </div>
                    }
                  >
                    <BattleArenaCanvas
                      phase={gameState.phase}
                      stage={gameState.currentStage}
                      playerName={gameState.player.name}
                      playerAppearance={gameState.player.appearance}
                      journalists={gameState.stageBattle.journalists}
                      headline={currentHeadline}
                      deadline={gameState.stageBattle.deadline}
                      pressure={gameState.stageBattle.pressure}
                      visualCue={gameState.visualCue}
                    />
                  </Suspense>
                </div>

                {/* Personnel Craft Signature Status Briefing Chip */}
                <div className="bg-slate-900/95 p-2.5 rounded-xl border-2 border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0_#000] font-pixel">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-100 font-bold">
                      {gameState.player.companyName} · {gameState.player.name} · {DIFFICULTY_SETTINGS[gameState.difficulty || 'normal']?.[isEn ? 'badgeEn' : 'badgeKo'] || '💼 전략 팀장'}
                    </span>
                  </div>
                  <div className="text-amber-300 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                    {isEn
                      ? `${scaleMeta.nameEn} · ${indMeta.nameEn}`
                      : `${scaleMeta.nameKo} · ${indMeta.nameKo}`}
                  </div>
                </div>

                <BattleHUD
                  state={gameState}
                  onOpenSurvivalSim={() => setShowSurvivalSim(true)}
                  onOpenMethodology={() => setShowMethodology(true)}
                  onResign={() => setDangerModal({ mode: 'resignation' })}
                />
              </div>

              {/* Right / Bottom: 40-Skill Inventory + Live Battle Log */}
              <div className="lg:col-span-6 space-y-3">
                <SkillInventoryPanel
                  state={gameState}
                  onExecuteSkill={executeSkillConfirmed}
                  onRequestLethalConfirm={(skillId, preview) =>
                    setDangerModal({ mode: 'lethal_skill', skillId, preview })
                  }
                />
                <ReporterReactionPanel state={gameState} />
              </div>
            </div>
          </div>
          )}

          {/* STAGE RESULT & ANALYTICS REPORT PHASE */}
          {gameState.phase === 'stage_result' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="h-[230px] sm:h-[290px] w-full">
                <Suspense fallback={<div className="w-full h-full pixel-card" />}>
                  <BattleArenaCanvas
                    phase={gameState.phase}
                    stage={gameState.currentStage}
                    playerName={gameState.player.name}
                    playerAppearance={gameState.player.appearance}
                    journalists={gameState.stageBattle?.journalists || []}
                    headline={currentHeadline}
                    deadline={0}
                    pressure={gameState.lastStageSummary?.finalPressure ?? 0}
                    visualCue={gameState.visualCue}
                  />
                </Suspense>
              </div>

              <StageReportModal
                state={gameState}
                onProceedNextStage={handleProceedNextStage}
                onOpenWhatIf={(stg) => setWhatIfStage(stg)}
                onOpenSurvivalSim={() => setShowSurvivalSim(true)}
                onOpenMethodology={() => setShowMethodology(true)}
              />
            </div>
          )}

          {/* FINAL ENDING & 13-POINT DATA JOURNALISM REPORT */}
          {gameState.phase === 'ending' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="h-[250px] sm:h-[320px] w-full">
                <Suspense fallback={<div className="w-full h-full pixel-card" />}>
                  <BattleArenaCanvas
                    phase={gameState.phase}
                    stage={gameState.currentStage}
                    playerName={gameState.player.name}
                    playerAppearance={gameState.player.appearance}
                    journalists={gameState.stageBattle?.journalists || []}
                    headline={currentHeadline}
                    deadline={0}
                    pressure={gameState.stageBattle?.pressure ?? 0}
                    visualCue={gameState.visualCue}
                  />
                </Suspense>
              </div>

              <EndingResultScreen
                state={gameState}
                finishedCount={finishedCount}
                onOpenShareCard={() => setShowShareCard(true)}
                onOpenBambooWithEnding={() => setShowBamboo(true)}
                onOpenWhatIf={(stg) => setWhatIfStage(stg)}
                onOpenDataLab={() => handleSwitchView('datalab')}
                onOpenMethodology={() => setShowMethodology(true)}
                onRestart={handleRestartGame}
                onRetryStage={handleRetryStage}
              />
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 mt-8 text-center text-xs text-slate-400 font-pixel space-y-3">
        {/* Global Public Visitor Counter */}
        <div className="flex justify-center pb-1">
          <VisitorCounter />
        </div>

        <div>
          <p className="font-bold text-slate-300">
            {isEn
              ? 'HONGDAM CRAFT — The PR Survival Game'
              : '홍담 크래프트 (HONGDAM CRAFT) — 기사 막기 전쟁'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isEn
              ? 'A Data Journalism-Inspired Interactive Simulation · Fictional Characters & Virtual Rules Only.'
              : '데이터저널리즘형 가상 시뮬레이션 인터랙티브 프로젝트 · 등장 기업·기자는 모두 가상 설정이며 실제 현실 예측이 아닙니다.'}
          </p>
        </div>

        <div className="pt-0.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>
            © <span className="text-amber-300 font-bold">프로딴짓러</span>. All rights reserved.
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500 italic">
            {isEn
              ? '“The headlines keep coming. The budget keeps shrinking. And the PR chief only has one life.”'
              : '“기사는 쏟아지고, 예산은 바닥나고, 팀장 목숨은 하나다.”'}
          </span>
          {finishedCount > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <span className="text-slate-400">
                {isEn ? `Local Completed Runs: ${finishedCount}` : `내 브라우저 완주 기록: ${finishedCount}회`}
              </span>
            </>
          )}
        </div>
      </footer>

      {/* Modals */}
      {dangerModal && (
        <DangerConfirmModal
          mode={dangerModal.mode}
          skillId={dangerModal.skillId}
          preview={dangerModal.preview}
          onCancel={() => setDangerModal(null)}
          onConfirm={() => {
            const modalCopy = dangerModal;
            setDangerModal(null);
            if (modalCopy.mode === 'lethal_skill' && modalCopy.skillId) {
              executeSkillConfirmed(modalCopy.skillId);
            } else if (modalCopy.mode === 'resignation') {
              setGameState((prev) => triggerVoluntaryResignation(prev));
            }
          }}
        />
      )}

      {whatIfStage !== null && (
        <WhatIfModal
          state={gameState}
          initialStage={whatIfStage}
          onClose={() => setWhatIfStage(null)}
        />
      )}

      {showSurvivalSim && (
        <SurvivalSimulatorModal
          state={gameState}
          onClose={() => setShowSurvivalSim(false)}
          onOpenMethodology={() => setShowMethodology(true)}
        />
      )}

      {showShareCard && (
        <ShareCardModal state={gameState} onClose={() => setShowShareCard(false)} />
      )}

      {showBamboo && (
        <BambooGroveModal state={gameState} onClose={() => setShowBamboo(false)} />
      )}

      {showMethodology && (
        <ModelMethodologyModal onClose={() => setShowMethodology(false)} />
      )}
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <HongdamAppInner />
    </LanguageProvider>
  );
}

export default App;
