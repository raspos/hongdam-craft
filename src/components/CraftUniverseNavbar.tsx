import React, { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Globe,
  MessageSquareText,
  RotateCcw,
  ShieldAlert,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CRAFT_UNIVERSE_BRAND, CRAFT_UNIVERSE_LINKS, SHOW_CRAFT_UNIVERSE } from '../config/craftUniverse';
import { useLanguage } from '../i18n/LanguageContext';
import { sound } from '../utils/sound';

interface CraftUniverseNavbarProps {
  activeView: 'game' | 'datalab';
  currentPhase?: string;
  currentStage?: number;
  onChangeView: (view: 'game' | 'datalab') => void;
  onOpenBamboo: () => void;
  onOpenMethodology: () => void;
  onResetGame: () => void;
  onBeforeNavigateExternal?: () => void;
}

const STAGE_SHORT_KO = ['1.단독', '2.제보', '3.공시', '4.탐사', '5.검찰', '6.오너'];
const STAGE_SHORT_EN = ['1.Scoop', '2.Tip', '3.Filing', '4.Probe', '5.Raid', '6.Owner'];

export const CraftUniverseNavbar: React.FC<CraftUniverseNavbarProps> = ({
  activeView,
  currentPhase = 'character_create',
  currentStage = 1,
  onChangeView,
  onOpenBamboo,
  onOpenMethodology,
  onResetGame,
  onBeforeNavigateExternal,
}) => {
  const { language, isEn, toggleLanguage } = useLanguage();
  const [muted, setMuted] = useState(!sound.enabled);

  const handleToggleSound = () => {
    sound.enabled = !sound.enabled;
    setMuted(!sound.enabled);
    if (sound.enabled) sound.playClick();
  };

  const inProgress =
    currentPhase === 'battle' || currentPhase === 'stage_result' || currentPhase === 'ending';

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md relative lg:sticky lg:top-0 z-40 px-4 py-2.5 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Left: Brand Identity (Personnel Craft twin layout in Crimson PR accent) */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-600 border border-red-400 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {SHOW_CRAFT_UNIVERSE && (
                  <span className="font-pixel text-[11px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 text-amber-300 font-bold tracking-wider">
                    {CRAFT_UNIVERSE_BRAND.title}
                  </span>
                )}
                <h1 className="font-pixel text-base sm:text-lg text-white font-extrabold tracking-tight">
                  {isEn ? 'HONGDAM CRAFT' : '홍담 크래프트'}
                </h1>
                <span className="text-[10px] font-pixel text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800">
                  {isEn ? 'PR Crisis Sim' : '기사 막기 전쟁'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {SHOW_CRAFT_UNIVERSE ? (
                  <>
                    {isEn ? CRAFT_UNIVERSE_BRAND.subtitleEn : CRAFT_UNIVERSE_BRAND.subtitleKo} ·{' '}
                  </>
                ) : null}
                <span>
                  {isEn
                    ? 'Data Journalism Virtual PR Crisis Simulation'
                    : '데이터저널리즘 가상 시뮬레이션 인터랙티브 프로젝트'}
                </span>
              </p>
            </div>
          </div>

          {/* Mobile quick action buttons */}
          <div className="flex lg:hidden items-center gap-1 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                onOpenBamboo();
              }}
              className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-600/70 text-[11px] font-pixel text-emerald-300 flex items-center gap-1"
              title={isEn ? 'PR Anonymous Bamboo Grove' : '홍담 익명 대나무숲'}
            >
              <MessageSquareText className="w-3 h-3 text-emerald-400" />
              <span>{isEn ? 'Lounge' : '대나무숲'}</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenMethodology();
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sky-300"
              title={isEn ? 'Virtual Simulation Model' : '데이터저널리즘 가상 모형 설명'}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                toggleLanguage();
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-pixel text-amber-300 flex items-center gap-1"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>{language === 'ko' ? 'EN' : '한국어'}</span>
            </button>
            <button
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
              title={isEn ? 'Toggle Sound' : '사운드 켜기/끄기'}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-red-400" />}
            </button>
            <button
              onClick={onResetGame}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
              title={isEn ? 'Reset Run' : '새 게임 초기화'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Mode Switcher + 6-Stage Progress Strip (harmonized with Personnel Craft stage bar) */}
        <nav
          aria-label="Main Navigation"
          className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full"
        >
          {CRAFT_UNIVERSE_LINKS.filter((item) => SHOW_CRAFT_UNIVERSE || item.id !== 'personnel-craft').map((item) => {
            if (item.id === 'personnel-craft') {
              const targetUrl = `${item.url}?lang=${language}`;
              return (
                <a
                  key={item.id}
                  href={targetUrl}
                  onClick={() => {
                    sound.playBlip();
                    onBeforeNavigateExternal?.();
                  }}
                  className="px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                >
                  <span>📰</span>
                  <span>{isEn ? item.nameEn : item.nameKo}</span>
                </a>
              );
            }

            if (item.id === 'hongdam-craft') {
              const isSelected = activeView === 'game';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playBlip();
                    onChangeView('game');
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>⚔️</span>
                  <span>{isEn ? 'PR Crisis Arena' : '위기 대응 본편'}</span>
                </button>
              );
            }

            const isLabSelected = activeView === 'datalab';
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playBlip();
                  onChangeView('datalab');
                }}
                className={`px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isLabSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-950/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{isEn ? item.nameEn : item.nameKo}</span>
              </button>
            );
          })}

          {/* 6-Stage Mini Progress Indicator (Desktop, mirrors Personnel Craft's 1~5 stage strip) */}
          {activeView === 'game' && (
            <div className="hidden xl:flex items-center gap-0.5 pl-1.5 ml-1 border-l border-slate-800">
              {(isEn ? STAGE_SHORT_EN : STAGE_SHORT_KO).map((lbl, idx) => {
                const stgNum = idx + 1;
                const isActive = inProgress && currentStage === stgNum && currentPhase !== 'ending';
                const isDone =
                  (inProgress && currentStage > stgNum) || currentPhase === 'ending';
                return (
                  <span
                    key={lbl}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-pixel select-none ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold'
                        : isDone
                          ? 'text-slate-300'
                          : 'text-slate-600'
                    }`}
                  >
                    {lbl}
                  </span>
                );
              })}
            </div>
          )}
        </nav>

        {/* Right: Utility Buttons (Exact match with Personnel Craft Navbar: Lounge -> Model -> Lang -> Sound -> Reset) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenBamboo();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/70 hover:border-emerald-400 text-xs font-pixel text-emerald-300 flex items-center gap-1.5 transition-all shadow-sm"
            title={isEn ? 'PR Anonymous Bamboo Grove' : '홍담 익명 대나무숲 게시판'}
          >
            <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold">{isEn ? 'Lounge' : '대나무숲'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMethodology();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-400 text-xs font-pixel text-sky-300 flex items-center gap-1 transition-all shadow-sm"
            title={isEn ? 'Virtual Simulation Model & Methodology' : '데이터저널리즘 가상 모형 설명'}
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{isEn ? 'Model Info' : '가상 모형'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              toggleLanguage();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs font-pixel text-amber-300 flex items-center gap-1.5 transition-all shadow-sm"
            title="Switch Language (한국어 / English)"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{language === 'ko' ? 'EN' : '한국어'}</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isEn ? 'Toggle Sound' : '사운드 켜기/끄기'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-red-400" />}
          </button>

          <button
            onClick={onResetGame}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            title={isEn ? 'Reset Run' : '새 게임 초기화'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
