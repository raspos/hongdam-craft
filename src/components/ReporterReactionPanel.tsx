import React from 'react';
import { CheckCircle, Flame, MessageSquare, Newspaper, Send } from 'lucide-react';
import { JOURNALIST_ARCHETYPES, JOURNALIST_COUNTER_SKILLS } from '../data/journalists';
import { PR_SKILLS_BY_ID } from '../data/skills';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState } from '../types/game';

interface ReporterReactionPanelProps {
  state: GameState;
}

export const ReporterReactionPanel: React.FC<ReporterReactionPanelProps> = ({ state }) => {
  const { isEn } = useLanguage();
  const battle = state.stageBattle;
  const leadJournalist = battle?.journalists[0];

  if (!battle || !leadJournalist) return null;

  const arch = JOURNALIST_ARCHETYPES[leadJournalist.archetype];
  const lastTelemetry =
    state.telemetryLogs.length > 0 ? state.telemetryLogs[state.telemetryLogs.length - 1] : null;

  const hasActionInCurrentStage = lastTelemetry && lastTelemetry.stage === state.currentStage;
  const lastSkill = hasActionInCurrentStage ? PR_SKILLS_BY_ID[lastTelemetry.skillId] : null;
  const outcome = hasActionInCurrentStage ? lastTelemetry.skillOutcome : null;
  const counterSkill =
    hasActionInCurrentStage && lastTelemetry.enemySkillId
      ? JOURNALIST_COUNTER_SKILLS[lastTelemetry.enemySkillId]
      : null;

  // Outcome styling
  const outcomeBadge = () => {
    if (!outcome) return null;
    switch (outcome) {
      case 'backfire':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-xs flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5" />
            <span>{isEn ? '💥 Backfire Erupted!' : '💥 취재 외압 역풍 발생!'}</span>
          </span>
        );
      case 'great':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isEn ? '🎯 Critical Persuasion!' : '🎯 결정적 설득 성공!'}</span>
          </span>
        );
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-400 text-sky-200 font-bold text-xs flex items-center gap-1">
            <span>✓</span>
            <span>{isEn ? 'Clarification Acknowledged' : '소명 내용 반영됨'}</span>
          </span>
        );
      case 'minimal':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 font-bold text-xs flex items-center gap-1">
            <span>💬</span>
            <span>{isEn ? 'Skeptical / Cold Reaction' : '불신 유지 · 냉담한 반응'}</span>
          </span>
        );
    }
  };

  return (
    <div className="pixel-card p-3.5 sm:p-4 space-y-3 border-sky-500/50 bg-slate-950/90 shadow-lg">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="font-pixel text-xs sm:text-sm text-sky-300 font-bold flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span>{isEn ? 'REPORTER’S LIVE REACTION' : '취재 기자의 실시간 반응'}</span>
        </div>
        {outcomeBadge()}
      </div>

      {/* When player just executed a skill: Show Exchange (Action -> Journalist Reaction) */}
      {hasActionInCurrentStage && lastSkill ? (
        <div className="space-y-2.5">
          {/* 1. What PR Team Lead just did */}
          <div className="bg-slate-900/90 rounded p-2.5 border border-slate-800 text-xs font-pixel space-y-1">
            <div className="text-[10px] text-amber-400 flex items-center gap-1 font-bold">
              <Send className="w-3 h-3 text-amber-400" />
              <span>{isEn ? 'MY CRISIS RESPONSE ACTION' : '내가 취한 홍보 대응'}</span>
              <span className="text-slate-400">({isEn ? lastSkill.nameEn : lastSkill.nameKo})</span>
            </div>
            <div className="text-slate-200 italic pl-1">
              💬 {isEn ? lastSkill.catchphraseEn : lastSkill.catchphraseKo}
            </div>
          </div>

          {/* 2. Reporter's Immediate Spoken Reaction */}
          <div
            className={`p-3 rounded-lg border-2 font-pixel space-y-1.5 ${
              outcome === 'backfire'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-100'
                : outcome === 'great'
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100'
                  : 'bg-slate-900/95 border-sky-600/70 text-sky-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{arch.badgeIcon}</span>
                <span className="text-amber-300">
                  {isEn
                    ? `${leadJournalist.outletEn} ${leadJournalist.nameEn}`
                    : `${leadJournalist.outletKo} ${leadJournalist.nameKo} ${leadJournalist.titleKo}`}
                </span>
                <span className="text-[10px] text-slate-400">({isEn ? arch.nameEn : arch.nameKo})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-normal">
                {isEn ? `Turn ${battle.turnNumber - 1}` : `${battle.turnNumber - 1}턴 직후`}
              </span>
            </div>

            <div className="text-sm font-bold leading-relaxed pl-1 pt-0.5">
              “{isEn ? leadJournalist.currentDialogueEn : leadJournalist.currentDialogueKo}”
            </div>
          </div>

          {/* 3. Reporter's Counter Action / Next Movement */}
          {counterSkill && (
            <div className="bg-slate-900/60 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] font-pixel text-slate-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-slate-400">{isEn ? 'Reporter Action:' : '기자의 후속 취재:'}</span>
                <span className="text-white font-bold">{isEn ? counterSkill.nameEn : counterSkill.nameKo}</span>
              </div>
              <span className="text-rose-300 font-bold shrink-0">
                {isEn ? `Deadline: D-${battle.deadline}t` : `마감 D-${battle.deadline}턴`}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Turn 1 Initial State (Before player uses a skill in this stage) */
        <div className="p-3 rounded-lg border-2 border-amber-500/70 bg-slate-900/90 font-pixel space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{arch.badgeIcon}</span>
              <span className="text-amber-300">
                {isEn
                  ? `${leadJournalist.outletEn} ${leadJournalist.nameEn}`
                  : `${leadJournalist.outletKo} ${leadJournalist.nameKo} ${leadJournalist.titleKo}`}
              </span>
              <span className="text-[10px] text-slate-400">({isEn ? arch.nameEn : arch.nameKo})</span>
            </div>
            <span className="text-[10px] text-rose-300 px-1.5 py-0.5 rounded bg-red-950 border border-red-700">
              {isEn ? `Deadline: D-${battle.deadline}t` : `마감 D-${battle.deadline}턴`}
            </span>
          </div>

          <div className="text-xs text-amber-200 bg-amber-950/40 p-2 rounded border border-amber-600/40">
            <span className="text-amber-400 font-bold block mb-0.5">
              📰 {isEn ? 'Breaking Inquiry Received:' : '단독 취재 질문지 수신:'}
            </span>
            <span className="text-slate-100">
              “{isEn ? battle.headlineEn : battle.headlineKo}”
            </span>
          </div>

          <div className="text-sm text-slate-100 font-bold leading-relaxed pt-1">
            “{isEn ? leadJournalist.currentDialogueEn : leadJournalist.currentDialogueKo}”
          </div>

          <div className="text-[11px] text-sky-300/90 border-t border-slate-800 pt-1.5 flex items-center justify-between">
            <span>
              {isEn
                ? '👉 Choose a PR skill below to reply before deadline.'
                : '👉 아래 홍보 대응 스킬 중 하나를 선택해 기자를 상대하세요.'}
            </span>
            <span className="text-amber-400 font-bold">
              {isEn ? `Stage ${battle.stage}/6` : `${battle.stage}단계`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
