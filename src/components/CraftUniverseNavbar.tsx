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
import { CRAFT_UNIVERSE_BRAND, CRAFT_UNIVERSE_LINKS } from '../config/craftUniverse';
import { useLanguage } from '../i18n/LanguageContext';
import { sound } from '../utils/sound';

interface CraftUniverseNavbarProps {
  activeView: 'game' | 'datalab';
  onChangeView: (view: 'game' | 'datalab') => void;
  onOpenBamboo: () => void;
  onOpenMethodology: () => void;
  onResetGame: () => void;
  onBeforeNavigateExternal?: () => void;
}

export const CraftUniverseNavbar: React.FC<CraftUniverseNavbarProps> = ({
  activeView,
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

  return (
    <header className="w-full bg-slate-950/95 border-b-2 border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-5 py-2">
      <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Left: CRAFT UNIVERSE Brand + Active Game Identity */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 border-2 border-amber-300 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-[11px] px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 text-amber-300 font-bold tracking-wider">
                  {CRAFT_UNIVERSE_BRAND.title}
                </span>
                <h1 className="font-pixel text-sm sm:text-base text-white font-extrabold">
                  {isEn ? 'HONGDAM CRAFT' : '홍담 크래프트'}
                </h1>
                <span className="text-[10px] font-pixel text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-700 hidden sm:inline">
                  {isEn ? 'The PR Survival Game' : '기사 막기 전쟁'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                {isEn ? CRAFT_UNIVERSE_BRAND.subtitleEn : CRAFT_UNIVERSE_BRAND.subtitleKo} ·{' '}
                <span className="text-sky-400">
                  {isEn ? CRAFT_UNIVERSE_BRAND.genreBadgeEn : CRAFT_UNIVERSE_BRAND.genreBadgeKo}
                </span>
              </p>
            </div>
          </div>

          {/* Mobile quick language button */}
          <div className="flex lg:hidden items-center gap-1.5">
            <button
              onClick={() => {
                sound.playClick();
                toggleLanguage();
              }}
              className="px-2 py-1 rounded bg-slate-900 border border-amber-500/70 text-[11px] font-pixel text-amber-300 flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              <span>{language === 'ko' ? 'EN' : 'KO'}</span>
            </button>
          </div>
        </div>

        {/* Center: Unified CRAFT UNIVERSE Series Menu */}
        <nav
          aria-label="CRAFT UNIVERSE Navigation"
          className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full"
        >
          {CRAFT_UNIVERSE_LINKS.map((item) => {
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
                  className="px-2.5 py-1.5 rounded text-xs font-pixel whitespace-nowrap text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center gap-1.5"
                  title={isEn ? 'Switch to Personnel Craft (Progress auto-saved)' : '인사 크래프트로 이동 (현재 홍담 진행상황 자동 저장)'}
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
                  className={`px-2.5 py-1.5 rounded text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-red-600 text-white font-bold shadow-md border border-red-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>⚔️</span>
                  <span>{isEn ? item.nameEn : item.nameKo}</span>
                </button>
              );
            }

            // hongdam-datalab
            const isLabSelected = activeView === 'datalab';
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playBlip();
                  onChangeView('datalab');
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isLabSelected
                    ? 'bg-indigo-600 text-white font-bold shadow-md border border-indigo-400'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-950/70'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>{isEn ? item.nameEn : item.nameKo}</span>
              </button>
            );
          })}

          {/* 대나무숲 */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenBamboo();
            }}
            className="px-2.5 py-1.5 rounded text-xs font-pixel whitespace-nowrap text-emerald-300 hover:text-white hover:bg-emerald-950/80 transition-all flex items-center gap-1.5"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEn ? 'Bamboo Grove' : '대나무숲'}</span>
          </button>
        </nav>

        {/* Right: Methodology, Language, Sound, Reset */}
        <div className="hidden lg:flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMethodology();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-400 text-xs font-pixel text-sky-300 flex items-center gap-1 transition-colors"
            title={isEn ? 'Virtual Simulation Model & Methodology' : '데이터저널리즘 가상 모형 설명'}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isEn ? 'Model Info' : '가상 모형 설명'}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              toggleLanguage();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs font-pixel text-amber-300 flex items-center gap-1.5 transition-colors"
            title="Switch Language (KO / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{language === 'ko' ? 'KO / EN' : 'EN / KO'}</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isEn ? 'Toggle Sound' : '사운드 켜기/끄기'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>

          <button
            onClick={onResetGame}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title={isEn ? 'Reset Run' : '새 게임 초기화'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
