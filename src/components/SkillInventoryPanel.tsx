import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, Flame, Lock, Sparkles, Zap } from 'lucide-react';
import { PR_SKILLS, PR_SKILLS_BY_ID, SKILL_CATEGORIES } from '../data/skills';
import { getTop3RecommendedSkills } from '../engine/recommendationEngine';
import { evaluateSkillPreview } from '../engine/skillEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState, SkillCategory, SkillExecutionPreview } from '../types/game';
import { sound } from '../utils/sound';

interface SkillInventoryPanelProps {
  state: GameState;
  onExecuteSkill: (skillId: string) => void;
  onRequestLethalConfirm: (skillId: string, preview: SkillExecutionPreview) => void;
}

export const SkillInventoryPanel: React.FC<SkillInventoryPanelProps> = ({
  state,
  onExecuteSkill,
  onRequestLethalConfirm,
}) => {
  const { isEn } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'ALL'>('A');
  const [focusedSkillId, setFocusedSkillId] = useState<string>('A01_phone_call');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  const previews = useMemo(() => {
    const map: Record<string, SkillExecutionPreview> = {};
    PR_SKILLS.forEach((s) => {
      map[s.id] = evaluateSkillPreview(state, s.id);
    });
    return map;
  }, [state]);

  const top3Recommendations = useMemo(() => {
    return getTop3RecommendedSkills(state);
  }, [state]);

  const filteredSkills = useMemo(() => {
    return PR_SKILLS.filter((s) => {
      if (selectedCategory !== 'ALL' && s.category !== selectedCategory) return false;
      if (showUnlockedOnly && !state.unlockedSkillIds.includes(s.id) && s.minStage > state.currentStage) {
        return false;
      }
      return true;
    });
  }, [selectedCategory, showUnlockedOnly, state.unlockedSkillIds, state.currentStage]);

  const focusedSkill = PR_SKILLS_BY_ID[focusedSkillId] || filteredSkills[0] || PR_SKILLS[0];
  const focusedPreview = previews[focusedSkill.id];

  const handleSkillTrigger = (skillId: string) => {
    if (isExecuting) return;
    const prev = previews[skillId];
    if (!prev || !prev.usable) {
      sound.playWarning();
      return;
    }
    if (prev.lethalWarningType) {
      sound.playWarning();
      onRequestLethalConfirm(skillId, prev);
      return;
    }
    setIsExecuting(true);
    if (
      skillId === 'A01_phone_call' ||
      skillId === 'C09_emergency_budget' ||
      skillId === 'C12_ceo_chairman_call'
    ) {
      sound.playPhoneRing();
    } else if (skillId === 'C11_emergency_press_conf' || skillId === 'E19_exec_reform') {
      sound.playCameraFlash();
    } else {
      sound.playClick();
    }
    onExecuteSkill(skillId);
    window.setTimeout(() => setIsExecuting(false), 500);
  };

  return (
    <div className="pixel-card p-3 sm:p-4 space-y-3">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-pixel text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>{isEn ? 'PR ACTION DECK' : '홍보 대응 스킬'}</span>
          <span className="text-[10px] font-normal text-slate-400 ml-1">
            ({state.unlockedSkillIds.length}/20)
          </span>
        </div>

        <label className="flex items-center gap-1.5 text-[11px] font-pixel text-slate-400 hover:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={!showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(!e.target.checked)}
            className="accent-amber-500"
          />
          <span>{isEn ? 'Locked preview' : '잠금 스킬 포함'}</span>
        </label>
      </div>

      {/* TOP 3 Recommended Responses ("홍담의 추천 대응") */}
      {top3Recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/60 rounded-lg p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-pixel">
            <span className="text-amber-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'HONGDAM’S RECOMMENDED PR ACTIONS (TOP 3)' : '홍담의 추천 대응 TOP 3'}</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {isEn ? 'Algorithmic Utility Ranking' : '상황 분석 최적 추천'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {top3Recommendations.map((rec) => {
              const sk = PR_SKILLS_BY_ID[rec.skillId];
              const isFocused = focusedSkill.id === rec.skillId;
              return (
                <button
                  key={rec.skillId}
                  type="button"
                  onClick={() => {
                    sound.playBlip();
                    setFocusedSkillId(rec.skillId);
                  }}
                  className={`p-2 rounded text-left border transition-all flex flex-col justify-between ${
                    isFocused
                      ? 'bg-amber-950/90 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[10px] font-pixel">
                      <span className="text-amber-400 font-bold">
                        {rec.rank === 1 ? '🥇 1위' : rec.rank === 2 ? '🥈 2위' : '🥉 3위'}
                      </span>
                      <span className="text-slate-400">#{String(sk.num).padStart(2, '0')}</span>
                    </div>
                    <div className="font-pixel text-xs text-white font-bold truncate mt-0.5">
                      {isEn ? sk.nameEn : sk.nameKo}
                    </div>
                  </div>
                  <div className="text-[10px] text-amber-200/90 line-clamp-2 mt-1 leading-tight">
                    {isEn ? rec.reasonEn : rec.reasonKo}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5 Category Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {(['A', 'B', 'C', 'D', 'E', 'ALL'] as const).map((cat) => {
          if (cat === 'ALL') {
            const active = selectedCategory === 'ALL';
            return (
              <button
                key="ALL"
                onClick={() => {
                  sound.playBlip();
                  setSelectedCategory('ALL');
                }}
                className={`px-2.5 py-1.5 rounded text-[11px] font-pixel whitespace-nowrap border transition-all ${
                  active
                    ? 'bg-slate-200 text-slate-950 border-white font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isEn ? 'All (20)' : '전체(20)'}
              </button>
            );
          }
          const meta = SKILL_CATEGORIES[cat];
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                sound.playBlip();
                setSelectedCategory(cat);
                const firstInCat = PR_SKILLS.find(
                  (s) =>
                    s.category === cat &&
                    (!showUnlockedOnly || state.unlockedSkillIds.includes(s.id) || s.minStage <= state.currentStage)
                ) || PR_SKILLS.find((s) => s.category === cat);
                if (firstInCat) setFocusedSkillId(firstInCat.id);
              }}
              className={`px-2.5 py-1.5 rounded text-[11px] font-pixel whitespace-nowrap border transition-all flex items-center gap-1 ${
                active
                  ? `${meta.colorClass} font-bold shadow-sm scale-[1.02]`
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{isEn ? meta.shortEn : meta.shortKo}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Skill Inspector — Execution is ONLY triggered here */}
      {focusedSkill && focusedPreview && (
        <div className="bg-slate-950/95 border-2 border-slate-700 rounded-lg p-3 sm:p-3.5 space-y-2.5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-pixel text-[11px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-600">
                #{String(focusedSkill.num).padStart(2, '0')} · {SKILL_CATEGORIES[focusedSkill.category].icon}{' '}
                {isEn ? SKILL_CATEGORIES[focusedSkill.category].nameEn : SKILL_CATEGORIES[focusedSkill.category].nameKo}
              </span>
              <h4 className="font-pixel text-base text-white font-bold">
                {isEn ? focusedSkill.nameEn : focusedSkill.nameKo}
              </h4>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={!focusedPreview.usable || isExecuting}
                onClick={() => handleSkillTrigger(focusedSkill.id)}
                className={`pixel-btn-mc w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
                  !focusedPreview.usable || isExecuting
                    ? 'opacity-40 cursor-not-allowed'
                    : focusedPreview.lethalWarningType
                      ? 'bg-rose-700 border-rose-400 text-white animate-pulse'
                      : 'pixel-btn-mc-gold'
                }`}
              >
                {focusedPreview.usable ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{isEn ? 'EXECUTE ACTION ↵' : '이 대응 실행하기 ↵'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isEn ? 'CANNOT USE' : '사용 불가'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prominent PR Crisis Action Wording */}
          <div className="bg-slate-900/90 border-l-4 border-amber-400 px-3 py-2 rounded-r shadow-inner">
            <div className="font-pixel text-xs sm:text-sm text-amber-100 font-bold leading-relaxed break-keep">
              💬 {isEn ? focusedSkill.catchphraseEn : focusedSkill.catchphraseKo}
            </div>
          </div>

          {/* Concise Action Summary */}
          <p className="text-xs text-slate-300 leading-relaxed break-keep">
            {isEn ? focusedSkill.descEn : focusedSkill.descKo}
          </p>

          {/* Estimated Skill Effects & Matchup Strip */}
          <div className="bg-slate-900/80 border border-slate-800 rounded p-2.5 text-xs font-pixel space-y-1.5">
            <div className="text-[10px] text-sky-400 font-bold flex items-center justify-between">
              <span>📊 {isEn ? 'ESTIMATED ACTION EFFECT' : '예상 대응 효과 & 기자 상성'}</span>
              <span className="text-slate-500 font-normal">
                {isEn ? '※ Actual results vary by reporter counter' : '※ 실제 결과는 기자 성향·반격에 따라 상이'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  {isEn ? 'Expected Pressure' : '예상 보도압박'}
                </span>
                <span className="text-emerald-400 font-bold">
                  약 {focusedPreview.expectedPressureDelta}P
                </span>
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  {isEn ? 'Expected Trust' : '예상 신뢰도'}
                </span>
                <span className="text-sky-300 font-bold">
                  {focusedPreview.expectedTrustDelta >= 0
                    ? `+${focusedPreview.expectedTrustDelta}`
                    : focusedPreview.expectedTrustDelta}P
                </span>
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  {isEn ? 'Reporter Matchup' : '기자 상성'}
                </span>
                <span
                  className={`font-bold ${
                    focusedPreview.affinityRating === 'great'
                      ? 'text-amber-300'
                      : focusedPreview.affinityRating === 'good'
                        ? 'text-emerald-300'
                        : focusedPreview.affinityRating === 'poor'
                          ? 'text-orange-400'
                          : focusedPreview.affinityRating === 'backfire'
                            ? 'text-rose-400'
                            : 'text-slate-300'
                  }`}
                >
                  {focusedPreview.affinityRating === 'great'
                    ? isEn ? 'Optimal' : '최적 상성'
                    : focusedPreview.affinityRating === 'good'
                      ? isEn ? 'Good' : '좋음'
                      : focusedPreview.affinityRating === 'poor'
                        ? isEn ? 'Unfavorable' : '불리'
                        : focusedPreview.affinityRating === 'backfire'
                          ? isEn ? 'Backfire Risk' : '역풍 위험'
                          : isEn ? 'Neutral' : '보통'}
                </span>
              </div>
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">
                  {isEn ? 'Backlash Delta' : '역풍위험 변동'}
                </span>
                <span
                  className={
                    focusedPreview.expectedRiskDelta > 0
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-300'
                  }
                >
                  {focusedPreview.expectedRiskDelta > 0
                    ? `+${focusedPreview.expectedRiskDelta}`
                    : focusedPreview.expectedRiskDelta}
                </span>
              </div>
            </div>
          </div>

          {/* Clean Resource Cost Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-pixel pt-1 border-t border-slate-800/80">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-600/70 text-amber-300">
              {isEn ? 'Budget' : '예산'}:{' '}
              {focusedSkill.mechanic === 'grant_vp_xp' || focusedSkill.mechanic === 'owner_banquet_xp'
                ? isEn ? '+Budget Grant' : '+예산 긴급확충'
                : focusedPreview.effectiveXpCost === 0
                  ? isEn ? 'FREE' : '무료'
                  : `${focusedPreview.effectiveXpCost} XP`}
            </span>

            <span
              className={`px-2 py-0.5 rounded bg-slate-900 border ${
                focusedPreview.effectiveHpCost < 0
                  ? 'border-emerald-500/80 text-emerald-300'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              {isEn ? 'Stamina' : '체력'}:{' '}
              {focusedPreview.effectiveHpCost < 0
                ? isEn ? `+${Math.abs(focusedPreview.effectiveHpCost)} HP (Recover)` : `+${Math.abs(focusedPreview.effectiveHpCost)} HP 회복`
                : focusedPreview.effectiveHpCost === 0
                  ? '0'
                  : `${focusedPreview.effectiveHpCost} HP`}
            </span>

            {focusedSkill.deadlineMin > 1 && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {isEn ? `Requires ≥${focusedSkill.deadlineMin} turns` : `마감 ${focusedSkill.deadlineMin}턴 이상 필요`}
              </span>
            )}

            {focusedPreview.usable && focusedPreview.lethalWarningType && (
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{isEn ? focusedPreview.lethalWarningEn : focusedPreview.lethalWarningKo}</span>
              </span>
            )}

            {!focusedPreview.usable && (focusedPreview.lockReasonKo || focusedPreview.lockReasonEn) && (
              <span className="px-2 py-0.5 rounded bg-rose-950/70 border border-rose-600 text-rose-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>{isEn ? focusedPreview.lockReasonEn : focusedPreview.lockReasonKo}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Minecraft-Style 4-Column Skill Slot Grid: CLICK ONLY INSPECTS (NO HOVER EXECUTE, NO DOUBLE CLICK) */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${
          selectedCategory === 'ALL' ? 'max-h-[290px] overflow-y-auto pr-1' : ''
        }`}
      >
        {filteredSkills.map((sk) => {
          const prev = previews[sk.id];
          const isSelected = focusedSkill.id === sk.id;
          const catMeta = SKILL_CATEGORIES[sk.category];
          const cd = state.stageBattle?.cooldowns[sk.id] || 0;

          return (
            <button
              key={sk.id}
              type="button"
              onClick={() => {
                sound.playBlip();
                setFocusedSkillId(sk.id);
              }}
              className={`pixel-slot p-2 text-left transition-all cursor-pointer select-none flex flex-col justify-between min-h-[76px] ${
                isSelected ? 'active ring-2 ring-amber-400' : ''
              } ${!prev.usable ? 'locked' : 'hover:border-slate-500'}`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-pixel">
                <span className="text-slate-400">
                  #{String(sk.num).padStart(2, '0')} {catMeta.icon}
                </span>
                {cd > 0 ? (
                  <span className="text-rose-400 font-bold">CD {cd}t</span>
                ) : !prev.usable ? (
                  <Lock className="w-3 h-3 text-slate-500" />
                ) : prev.lethalWarningType ? (
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                ) : null}
              </div>

              <div className="font-pixel text-xs text-white font-bold leading-snug my-1 line-clamp-2">
                {isEn ? sk.nameEn : sk.nameKo}
              </div>

              <div className="flex items-center justify-between text-[10px] font-pixel border-t border-slate-800/80 pt-1">
                <span className="text-amber-300">
                  {sk.mechanic === 'grant_vp_xp' || sk.mechanic === 'owner_banquet_xp'
                    ? '+XP'
                    : prev.effectiveXpCost === 0
                      ? '0 XP'
                      : `${prev.effectiveXpCost} XP`}
                </span>
                <span
                  className={
                    prev.effectiveHpCost < 0
                      ? 'text-emerald-400'
                      : prev.effectiveHpCost === 0
                        ? 'text-slate-500'
                        : 'text-slate-400'
                  }
                >
                  {prev.effectiveHpCost < 0
                    ? `+${Math.abs(prev.effectiveHpCost)}HP`
                    : prev.effectiveHpCost === 0
                      ? '0 HP'
                      : `-${prev.effectiveHpCost}HP`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {state.stageBattle && state.stageBattle.sameCategoryStreak >= 2 && (
        <div className="text-[11px] text-amber-400 font-pixel bg-amber-950/40 border border-amber-600/50 rounded px-2.5 py-1 text-center">
          ⚠️ {isEn ? 'Same-category streak reduces impact!' : '동일 계열 연속 사용 시 언론 피로도로 효율이 점차 감소합니다.'}
        </div>
      )}
    </div>
  );
};
