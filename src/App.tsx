import React, { Suspense, useEffect, useRef, useState } from 'react';
import { ENDINGS } from './data/endings';
import {
  initializeNewRun,
  playBattleTurn,
  proceedToNextStage,
  startStageBattle,
  triggerVoluntaryResignation,
} from './engine/gameEngine';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import {
  clearSavedGameState,
  getFinishedRunCount,
  loadGameState,
  recordFinishedRunCount,
  saveGameState,
} from './storage/storage';
import { GameState, PRPlayerProfile, SkillExecutionPreview, StageNumber } from './types/game';
import { BambooGroveModal } from './components/BambooGroveModal';
import { BattleHUD } from './components/BattleHUD';
import { BattleLogPanel } from './components/BattleLogPanel';
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
  const recordedEndingPlayIdRef = useRef<string | null>(
    gameState.phase === 'ending' ? gameState.playId : null
  );

  // Persist every gameState change automatically to localStorage
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Increment completed run counter purely once per unique playId upon reaching ending
  useEffect(() => {
    if (gameState.phase === 'ending' && recordedEndingPlayIdRef.current !== gameState.playId) {
      recordedEndingPlayIdRef.current = gameState.playId;
      setFinishedCount(recordFinishedRunCount());
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
    setGameState((prev) => initializeNewRun(prev.player));
  };

  const handleRerollCompany = () => {
    setGameState((prev) => initializeNewRun(prev.player));
  };

  const handleStartStage1 = () => {
    setGameState((prev) => startStageBattle(prev, 1));
  };

  const executeSkillConfirmed = (skillId: string) => {
    setGameState((prev) => {
      const next = playBattleTurn(prev, skillId);
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

  const handleRestartGame = () => {
    const fresh = clearSavedGameState();
    setGameState((prev) => ({
      ...fresh,
      player: prev.player,
    }));
    handleSwitchView('game');
  };

  const currentHeadline = gameState.stageBattle
    ? isEn
      ? gameState.stageBattle.headlineEn
      : gameState.stageBattle.headlineKo
    : isEn
      ? '“[Exclusive] Breaking Scoop Incoming…”'
      : '“[단독] 취재 질문지가 곧 도착합니다…”';

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Unified CRAFT UNIVERSE Navigation */}
      <CraftUniverseNavbar
        activeView={activeView}
        onChangeView={handleSwitchView}
        onOpenBamboo={() => setShowBamboo(true)}
        onOpenMethodology={() => setShowMethodology(true)}
        onResetGame={handleRestartGame}
        onBeforeNavigateExternal={() => saveGameState(gameState)}
      />

      {/* Main Content Area */}
      {activeView === 'datalab' ? (
        <main className="flex-1">
          <HongdamDataLabView
            onBackToGame={() => handleSwitchView('game')}
            onOpenMethodology={() => setShowMethodology(true)}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4">
          {/* SETUP PHASES: Character Create & Company Assigned */}
          {(gameState.phase === 'character_create' || gameState.phase === 'company_assigned') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Top on mobile, Left on desktop: 3D Live Character & Arena Preview */}
              <div className="lg:col-span-6 space-y-3">
                <div className="h-[290px] sm:h-[430px] lg:h-[510px] w-full">
                  <Suspense
                    fallback={
                      <div className="w-full h-full pixel-card flex items-center justify-center font-pixel text-xs text-amber-300">
                        {isEn ? 'Loading 3D Voxel Arena...' : '3D 복셀 아레나 준비 중...'}
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

              {/* Right: Setup Form */}
              <div className="lg:col-span-6">
                <CharacterCreationScreen
                  phase={gameState.phase}
                  profile={gameState.player}
                  company={gameState.company}
                  onChangeProfile={handleUpdateSetupProfile}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left / Top: 3D Battle Arena + HUD */}
              <div className="lg:col-span-6 space-y-3">
                <div className="h-[275px] sm:h-[360px] lg:h-[395px] w-full">
                  <Suspense
                    fallback={
                      <div className="w-full h-full pixel-card flex items-center justify-center font-pixel text-xs text-amber-300">
                        {isEn ? 'Loading 3D PR Battle...' : '3D 복셀 배틀 장면 로딩 중...'}
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
                <BattleLogPanel logs={gameState.battleLogs} />
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
                onOpenShareCard={() => setShowShareCard(true)}
                onOpenBambooWithEnding={() => setShowBamboo(true)}
                onOpenWhatIf={(stg) => setWhatIfStage(stg)}
                onOpenDataLab={() => handleSwitchView('datalab')}
                onOpenMethodology={() => setShowMethodology(true)}
                onRestart={handleRestartGame}
              />
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/90 bg-slate-950/90 py-3 px-4 mt-8 text-[11px] text-slate-400 font-pixel">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-amber-300 font-bold">CRAFT UNIVERSE</span> ·{' '}
            {isEn
              ? 'HONGDAM CRAFT (A Data Journalism-Inspired Interactive Simulation) · Fictional Characters & Virtual Rules Only.'
              : '홍담 크래프트 (데이터저널리즘형 가상 시뮬레이션 인터랙티브 프로젝트) · 등장 기업·기자는 모두 가상 설정이며 실제 현실 예측이 아닙니다.'}
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            {finishedCount > 0 && (
              <span>
                {isEn ? `Local Completed Runs: ${finishedCount}` : `내 브라우저 완주 기록: ${finishedCount}회`}
              </span>
            )}
            <a
              href="https://raspos.github.io/personnel-craft/"
              className="text-sky-400 hover:underline"
            >
              {isEn ? '→ Play Personnel Craft' : '→ 자매작 〈인사 크래프트〉 바로가기'}
            </a>
          </div>
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
