import React from 'react';
import { Activity, AlertTriangle, BarChart2, Flag, MessageSquareText, ShieldCheck, Target, Wallet } from 'lucide-react';
import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { DIFFICULTY_SETTINGS } from '../engine/difficultyConfig';
import { STAGES } from '../data/stages';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState } from '../types/game';
import { sound } from '../utils/sound';

interface BattleHUDProps {
  state: GameState;
  onOpenSurvivalSim: () => void;
  onOpenMethodology: () => void;
  onResign: () => void;
  onOpenBamboo?: () => void;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  state,
  onOpenSurvivalSim,
  onResign,
  onOpenBamboo,
}) => {
  const { isEn } = useLanguage();

  const battle = state.stageBattle;
  const scaleDef = COMPANY_SCALES[state.company.scale];
  const indDef = INDUSTRIES[state.company.industry];
  const stageDef = STAGES[state.currentStage];
  const xpRatio = Math.min(100, Math.round((state.resources.xp / Math.max(1, state.resources.initialXp)) * 100));
  const diffSetting = DIFFICULTY_SETTINGS[state.difficulty || 'normal'] || DIFFICULTY_SETTINGS.normal;

  const missionStatus = React.useMemo(() => {
    if (!battle) {
      return {
        labelKo: '안전',
        labelEn: 'Safe',
        descKo: '대기 중',
        descEn: 'Standby',
        colorClass: 'text-emerald-300 bg-emerald-950 border-emerald-500',
      };
    }

    const isNearGameOver =
      battle.pressure + 12 >= 100 ||
      state.resources.hp <= 18 ||
      state.resources.risk >= 85 ||
      (battle.deadline <= 1 && battle.pressure > 68);

    if (isNearGameOver) {
      return {
        labelKo: '위기',
        labelEn: 'Crisis',
        descKo: '다음 행동에서 게임 오버 가능! 즉각적인 방어 필수',
        descEn: 'Game over possible on next move! Immediate defense needed',
        colorClass: 'text-rose-300 bg-rose-950 border-rose-500 animate-pulse',
      };
    }

    if (battle.pressure > 68 || battle.deadline <= 2 || state.resources.hp <= 35 || state.resources.risk >= 65) {
      return {
        labelKo: '위험',
        labelEn: 'Danger',
        descKo: '마감까지 추가 대응 필요. 보도 압박을 68 이하로 낮추세요.',
        descEn: 'Further actions required before deadline. Lower pressure below 68%.',
        colorClass: 'text-orange-300 bg-orange-950 border-orange-500',
      };
    }

    if (battle.pressure > 52 || battle.journalists[0]?.stats.distrust >= 60) {
      return {
        labelKo: '주의',
        labelEn: 'Caution',
        descKo: '기자 반격에 따라 실패할 수 있음. 신뢰 확보 및 팩트체크 권장',
        descEn: 'Reporter counter-attack may flip outcome. Verify facts.',
        colorClass: 'text-amber-300 bg-amber-950 border-amber-500',
      };
    }

    return {
      labelKo: '안전',
      labelEn: 'Safe',
      descKo: '현재 조건에서 기본 방어 성공 가능. 예산과 체력을 비축하세요.',
      descEn: 'Basic defense secure under current condition. Conserve resources.',
      colorClass: 'text-emerald-300 bg-emerald-950 border-emerald-500',
    };
  }, [battle, state.resources.hp, state.resources.risk]);

  return (
    <div className="space-y-2.5">
      {/* Top Compact Status Strip */}
      <div className="pixel-card p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 font-pixel text-xs text-red-200 font-bold">
              STAGE {state.currentStage}/6 {stageDef.stars}
            </span>
            <span className="font-pixel text-xs sm:text-sm text-white font-bold break-keep">
              {state.player.companyName}
            </span>
            <span className="text-[11px] font-pixel text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 break-keep">
              {indDef.icon} {isEn ? `${scaleDef.nameEn} · ${indDef.nameEn}` : `${scaleDef.nameKo} · ${indDef.nameKo}`}
            </span>
            <span className="text-[11px] font-pixel text-sky-300 break-keep">
              {state.player.name} · {isEn ? diffSetting.badgeEn : diffSetting.badgeKo}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playBlip();
                onOpenSurvivalSim();
              }}
              className="px-2 py-1 rounded bg-indigo-950/90 border border-indigo-500/80 hover:border-indigo-300 text-[11px] font-pixel text-indigo-200 flex items-center gap-1"
              title={isEn ? 'Monte Carlo Survival Odds' : '6단계 생존 확률 시뮬레이터'}
            >
              <BarChart2 className="w-3 h-3 text-indigo-400" />
              <span>{isEn ? 'Survival Odds' : '생존 확률'}</span>
            </button>

            {onOpenBamboo && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenBamboo();
              }}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-500 text-[11px] font-pixel text-emerald-300 flex items-center gap-1 transition-all"
              title={isEn ? 'PR Anonymous Bamboo Grove' : '홍담 익명 대나무숲 열기'}
            >
              <MessageSquareText className="w-3 h-3 text-emerald-400" />
              <span>{isEn ? 'Lounge' : '대나무숲'}</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onResign();
              }}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-rose-500 text-[11px] font-pixel text-slate-300 hover:text-rose-300 flex items-center gap-1"
              title={isEn ? 'Submit Resignation' : '사표 제출'}
            >
              <Flag className="w-3 h-3" />
              <span>{isEn ? 'Resign' : '사표'}</span>
            </button>
          </div>
        </div>

        {/* Primary Crisis Mission & Defense Objective Bar (Section 3) */}
        {battle && (
          <div className="bg-slate-900/95 border-2 border-amber-500/80 rounded-lg p-2.5 sm:p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                <span className="font-pixel text-xs sm:text-sm text-white font-bold">
                  {isEn ? `[CRISIS: ${stageDef.titleEn}]` : `[현재 위기: ${stageDef.titleKo}]`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-pixel text-slate-400">
                  {isEn ? 'Status:' : '현재 상태:'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-pixel text-[11px] font-bold border ${missionStatus.colorClass}`}
                >
                  {isEn ? missionStatus.labelEn : missionStatus.labelKo}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-pixel">
              <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">
                  {isEn ? 'Press Pressure' : '현재 보도 압박'}
                </span>
                <span
                  className={`text-base font-bold ${
                    battle.pressure > 68 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {battle.pressure}%
                </span>
              </div>

              <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">
                  {isEn ? 'Defense Target' : '방어 목표'}
                </span>
                <span className="text-base font-bold text-amber-300">
                  {isEn ? '≤ 68% or below' : '68% 이하'}
                </span>
              </div>

              <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">
                  {isEn ? 'Deadline' : '마감까지'}
                </span>
                <span
                  className={`text-base font-bold ${
                    battle.deadline <= 1 ? 'text-rose-400 animate-pulse' : 'text-sky-300'
                  }`}
                >
                  D-{battle.deadline}턴
                </span>
              </div>

              <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex flex-col justify-center">
                <span className="text-slate-400 text-[10px] block">
                  {isEn ? 'Assessment' : '상황 진단'}
                </span>
                <span className="text-[11px] font-medium text-slate-200 line-clamp-1 break-keep">
                  {isEn ? missionStatus.descEn : missionStatus.descKo}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4 Core Gauges: XP, HP, RISK, REPUTATION (Compact & Readable) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-pixel">
          {/* XP */}
          <div className="pixel-slot p-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-300 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> {isEn ? 'XP Budget' : '홍보예산'}
              </span>
              <span className="font-bold text-white">{state.resources.xp}</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-1 border border-slate-800">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${xpRatio}%` }}
              />
            </div>
          </div>

          {/* HP */}
          <div
            className={`pixel-slot p-2 ${
              state.resources.hp <= 25 ? 'danger-pulse border-red-500' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 flex items-center gap-1">
                <Activity className="w-3 h-3" /> {isEn ? 'HP Stamina' : '체력'}
              </span>
              <span className="font-bold text-white">{state.resources.hp}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-1 border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  state.resources.hp <= 25 ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${state.resources.hp}%` }}
              />
            </div>
          </div>

          {/* RISK */}
          <div
            className={`pixel-slot p-2 ${
              state.resources.risk >= 75 ? 'danger-pulse border-rose-500' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {isEn ? 'RISK Backlash' : '역풍위험'}
              </span>
              <span className="font-bold text-white">{state.resources.risk}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-1 border border-slate-800">
              <div
                className="h-full bg-rose-500 transition-all duration-300"
                style={{ width: `${state.resources.risk}%` }}
              />
            </div>
          </div>

          {/* REPUTATION */}
          <div className="pixel-slot p-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-sky-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {isEn ? 'Reputation' : '기업평판'}
              </span>
              <span className="font-bold text-white">{state.resources.reputation}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-1 border border-slate-800">
              <div
                className="h-full bg-sky-400 transition-all duration-300"
                style={{ width: `${state.resources.reputation}%` }}
              />
            </div>
          </div>
        </div>

        {/* Press Pressure Bar (Direct & Punchy) */}
        {battle && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-pixel">
              <span className="text-rose-300 font-bold">
                🔥 {isEn ? 'Press Pressure (Target ≤ 68% at Deadline)' : '기사 보도 압박 (마감 시 68% 이하 유지)'}
              </span>
              <span className="font-bold text-white text-sm">{battle.pressure}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded overflow-hidden border border-slate-700 relative">
              <div
                className={`h-full transition-all duration-300 ${
                  battle.pressure > 68
                    ? 'bg-gradient-to-r from-orange-500 to-red-600'
                    : battle.pressure <= 25
                      ? 'bg-emerald-500'
                      : 'bg-amber-400'
                }`}
                style={{ width: `${battle.pressure}%` }}
              />
              <div className="absolute top-0 bottom-0 left-[68%] w-0.5 bg-white/80" title="68% Defend Target" />
            </div>

            {/* Active Tactical Buffs (Chips) */}
            <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px] font-pixel">
              {battle.buffs.factChecked && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300">
                  ✓ {isEn ? 'Fact-Verified' : '사내 팩트체크 완료'}
                </span>
              )}
              {battle.buffs.disclosureAudited && (
                <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500 text-sky-300">
                  ✓ {isEn ? 'Disclosure Audited' : '공시 대조 완료'}
                </span>
              )}
              {battle.buffs.whistleblowerVerified && (
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500 text-indigo-300">
                  ✓ {isEn ? 'Tip-Off Verified' : '제보 진위 검증됨'}
                </span>
              )}
              {battle.buffs.tfTurnsLeft > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300">
                  🛡️ {isEn ? `Crisis TF (${battle.buffs.tfTurnsLeft}t)` : `위기대응 TF (${battle.buffs.tfTurnsLeft}턴)`}
                </span>
              )}
              {battle.buffs.legalShieldActive && (
                <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-500 text-purple-300">
                  ⚖️ {isEn ? 'Legal Shield' : '법무 방어막'}
                </span>
              )}
              {battle.buffs.hangoverNextTurn && (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300">
                  🤢 {isEn ? 'Hangover (+5 HP cost)' : '숙취 디버프'}
                </span>
              )}
              {battle.buffs.dataMismatchDebuff && (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300">
                  📉 {isEn ? 'Data Error' : '숫자 오류 디버프'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
