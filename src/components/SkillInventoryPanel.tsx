import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Flame, Lock, Sparkles, Zap } from 'lucide-react';
import { PR_SKILLS, PR_SKILLS_BY_ID, SKILL_CATEGORIES } from '../data/skills';
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

  const isStage1FirstTurn =
    state.currentStage === 1 && (state.stageBattle?.turnNumber ?? 1) === 1;
  const starterRecommendedIds = [
    'B05_reporter_profiling',
    'B06_internal_factcheck',
    'A01_phone_call',
    'A04_press_statement',
  ];

  const previews = useMemo(() => {
    const map: Record<string, SkillExecutionPreview> = {};
    PR_SKILLS.forEach((s) => {
      map[s.id] = evaluateSkillPreview(state, s.id);
    });
    return map;
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
  const leadAnalyzed = Boolean(state.stageBattle?.journalists[0]?.isAnalyzed);

  const handleSkillTrigger = (skillId: string) => {
    const prev = previews[skillId];
    setFocusedSkillId(skillId);
    if (!prev || !prev.usable) {
      sound.playWarning();
      return;
    }
    if (prev.lethalWarningType) {
      sound.playWarning();
      onRequestLethalConfirm(skillId, prev);
      return;
    }
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
  };

  const renderAffinityBadge = (
    rating: SkillExecutionPreview['affinityRating'],
    skillId: string
  ) => {
    if (!leadAnalyzed) {
      if (skillId === 'B05_reporter_profiling') {
        return (
          <span className="px-2 py-0.5 rounded border text-[10px] font-pixel bg-indigo-950 border-indigo-400 text-indigo-200">
            {isEn ? '🔍 Reveals Exact Match + 1 Turn' : '🔍 상성·정밀수치 공개 (+1턴)'}
          </span>
        );
      }
      return (
        <span className="px-2 py-0.5 rounded border text-[10px] font-pixel bg-slate-900 border-slate-700 text-slate-400">
          {isEn ? '❔ Unanalyzed (#05 reveals)' : '❔ 상성 미확인 (#05 분석 시 공개)'}
        </span>
      );
    }

    const map = {
      great: {
        ko: '🔥 최적 상성',
        en: '🔥 Best Match',
        cls: 'bg-emerald-950 border-emerald-400 text-emerald-300',
      },
      good: {
        ko: '👍 유리함',
        en: '👍 Effective',
        cls: 'bg-sky-950 border-sky-400 text-sky-300',
      },
      neutral: {
        ko: '⚖️ 보통',
        en: '⚖️ Standard',
        cls: 'bg-slate-900 border-slate-600 text-slate-300',
      },
      poor: {
        ko: '💧 효율 낮음',
        en: '💧 Weak',
        cls: 'bg-amber-950 border-amber-500 text-amber-300',
      },
      backfire: {
        ko: '💥 역효과 주의!',
        en: '💥 Backfire Risk!',
        cls: 'bg-rose-950 border-rose-500 text-rose-300',
      },
    }[rating];

    return (
      <span className={`px-2 py-0.5 rounded border text-[10px] font-pixel ${map.cls}`}>
        {isEn ? map.en : map.ko}
      </span>
    );
  };

  const renderMaskedPressureEstimate = (basePressureDelta: number, category: SkillCategory) => {
    if (basePressureDelta === 0) {
      return isEn ? 'Prep / Recovery' : '준비·회복';
    }
    const suffix = category === 'D' ? (isEn ? ' (Backfire?)' : ' (역풍주의)') : '';
    if (basePressureDelta <= -20) {
      return isEn ? `Strong Drop${suffix}` : `큰 폭 감소 기대${suffix}`;
    }
    if (basePressureDelta <= -13) {
      return isEn ? `Moderate Drop${suffix}` : `보통 감소 기대${suffix}`;
    }
    return isEn ? `Light Drop${suffix}` : `소폭 감소 기대${suffix}`;
  };

  return (
    <div className="pixel-card p-3 sm:p-4 space-y-3">
      {/* Stage 1 Turn 1 Starter Guide Banner */}
      {isStage1FirstTurn && (
        <div className="bg-indigo-950/85 border border-indigo-400/80 rounded-lg p-2.5 text-xs space-y-2">
          <div className="font-pixel text-[11px] text-amber-300 font-bold flex items-center justify-between gap-2">
            <span>
              🎯 {isEn ? 'FIRST CRISIS GUIDE — Pick 1 of 3 Opening Moves!' : '첫 단독기사 대응 가이드 — 아래 추천 첫 수 중 하나로 시작해 보세요!'}
            </span>
            <span className="text-[10px] text-sky-300 hidden sm:inline">
              {isEn ? '💾 Auto-saved · ~1 min' : '💾 자동 저장 · 약 1분 소요'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {[
              {
                id: 'B05_reporter_profiling',
                cat: 'B' as SkillCategory,
                ko: '🔍 #05 기자 성향 분석 (능력치+마감 +1턴)',
                en: '🔍 #05 Analyze Reporter (+1 Turn)',
              },
              {
                id: 'B06_internal_factcheck',
                cat: 'B' as SkillCategory,
                ko: '📋 #06 사내 팩트체크 (해명 1.45배 강화)',
                en: '📋 #06 Internal Fact-Check (1.45x)',
              },
              {
                id: 'A01_phone_call',
                cat: 'A' as SkillCategory,
                ko: '📞 #01 기자에게 전화 (저비용 초동 진화)',
                en: '📞 #01 Call Reporter (Fast Low-Cost)',
              },
            ].map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => {
                  sound.playBlip();
                  setSelectedCategory(rec.cat);
                  setFocusedSkillId(rec.id);
                }}
                className={`px-2.5 py-1.5 rounded border text-left font-pixel text-[11px] transition-all ${
                  focusedSkillId === rec.id
                    ? 'bg-amber-600/30 border-amber-300 text-white font-bold'
                    : 'bg-slate-950/90 border-slate-700 text-slate-200 hover:border-amber-400'
                }`}
              >
                {isEn ? rec.en : rec.ko}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header & Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-pixel text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-1.5 flex-wrap">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>
            {isEn ? 'PR SKILL DECK' : '홍보 대응 스킬 인벤토리'}
          </span>
          <span className="text-[10px] font-normal text-slate-400">
            ({state.unlockedSkillIds.length}/20 {isEn ? 'unlocked' : '해금'})
          </span>
          {leadAnalyzed ? (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/70 text-[10px] text-emerald-300 font-bold">
              🧠 {isEn ? 'Intel Unlocked (Exact Numbers)' : '기자 성향 파악됨 (정밀 상성 공개)'}
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-normal">
              🔒 {isEn ? 'Use #05 to reveal exact affinity' : '#05 분석 또는 재회 시 정밀 수치 공개'}
            </span>
          )}
        </div>

        <label className="flex items-center gap-1.5 text-[11px] font-pixel text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={!showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(!e.target.checked)}
            className="accent-amber-500"
          />
          <span>{isEn ? 'Show Locked Skills Too' : '후반 잠금 스킬도 미리 보기'}</span>
        </label>
      </div>

      {/* 5 Category Filter Bar */}
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

      {/* Selected Skill Inspector & Execute Bar */}
      {focusedSkill && focusedPreview && (
        <div className="bg-slate-950/95 border-2 border-slate-700 rounded-lg p-3 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-pixel text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-600">
                  #{String(focusedSkill.num).padStart(2, '0')} · {SKILL_CATEGORIES[focusedSkill.category].icon}{' '}
                  {isEn ? SKILL_CATEGORIES[focusedSkill.category].nameEn : SKILL_CATEGORIES[focusedSkill.category].nameKo}
                </span>
                <h4 className="font-pixel text-sm sm:text-base text-white font-bold">
                  {isEn ? focusedSkill.nameEn : focusedSkill.nameKo}
                </h4>
                {renderAffinityBadge(focusedPreview.affinityRating, focusedSkill.id)}
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isEn ? focusedSkill.descEn : focusedSkill.descKo}
              </p>
              {isEn && focusedSkill.culturalNoteEn && (
                <p className="text-[11px] text-sky-300/95 mt-1">
                  🌏 K-PR Note: {focusedSkill.culturalNoteEn}
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!focusedPreview.usable}
              onClick={() => handleSkillTrigger(focusedSkill.id)}
              className={`pixel-btn-mc px-4 py-2.5 text-xs sm:text-sm font-bold shrink-0 flex items-center gap-1.5 ${
                !focusedPreview.usable
                  ? 'opacity-45 cursor-not-allowed'
                  : focusedPreview.lethalWarningType
                    ? 'bg-rose-700 border-rose-400 text-white'
                    : 'pixel-btn-mc-gold'
              }`}
            >
              {focusedPreview.usable ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isEn ? 'EXECUTE SKILL' : '이 스킬 실행'}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isEn ? 'LOCKED' : '사용 불가'}</span>
                </>
              )}
            </button>
          </div>

          {/* Cost & Effect Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-pixel pt-1 border-t border-slate-800/90">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-600/60 text-amber-300">
              XP:{' '}
              {focusedSkill.mechanic === 'grant_vp_xp' || focusedSkill.mechanic === 'owner_banquet_xp'
                ? isEn
                  ? '+Recovery'
                  : '+예산회복'
                : focusedPreview.effectiveXpCost === 0
                  ? isEn
                    ? 'FREE (0)'
                    : '무료(0)'
                  : `-${focusedPreview.effectiveXpCost}`}
            </span>

            <span
              className={`px-2 py-0.5 rounded bg-slate-900 border ${
                focusedPreview.effectiveHpCost < 0
                  ? 'border-emerald-500/70 text-emerald-300'
                  : 'border-slate-700 text-slate-200'
              }`}
            >
              HP:{' '}
              {focusedPreview.effectiveHpCost < 0
                ? `+${Math.abs(focusedPreview.effectiveHpCost)} (${isEn ? 'Heal' : '회복'})`
                : focusedPreview.effectiveHpCost === 0
                  ? '0'
                  : `-${focusedPreview.effectiveHpCost}`}
            </span>

            <span
              className={`px-2 py-0.5 rounded bg-slate-900 border ${
                focusedPreview.expectedPressureDelta < 0 || focusedSkill.pressureDelta < 0
                  ? 'border-emerald-600/60 text-emerald-300'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              {isEn ? 'Pressure' : '보도압박'}:{' '}
              {leadAnalyzed
                ? focusedPreview.expectedPressureDelta > 0
                  ? `+${focusedPreview.expectedPressureDelta}`
                  : focusedPreview.expectedPressureDelta
                : renderMaskedPressureEstimate(focusedSkill.pressureDelta, focusedSkill.category)}
            </span>

            {(leadAnalyzed ? focusedPreview.expectedRiskDelta !== 0 : focusedSkill.riskDelta !== 0) && (
              <span
                className={`px-2 py-0.5 rounded bg-slate-900 border ${
                  (leadAnalyzed ? focusedPreview.expectedRiskDelta : focusedSkill.riskDelta) > 0
                    ? 'border-rose-500/70 text-rose-300'
                    : 'border-emerald-500/70 text-emerald-300'
                }`}
              >
                RISK:{' '}
                {leadAnalyzed
                  ? focusedPreview.expectedRiskDelta > 0
                    ? `+${focusedPreview.expectedRiskDelta}`
                    : focusedPreview.expectedRiskDelta
                  : focusedSkill.riskDelta > 0
                    ? `+${focusedSkill.riskDelta}~?`
                    : `${focusedSkill.riskDelta}`}
              </span>
            )}

            {focusedSkill.deadlineMin > 1 && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {isEn ? `Min ${focusedSkill.deadlineMin}t` : `마감 ${focusedSkill.deadlineMin}턴↑`}
              </span>
            )}

            <span className="text-slate-400 ml-auto text-[10px]">
              {leadAnalyzed
                ? isEn
                  ? `Reporter Match: ${focusedPreview.affinityNoteEn}`
                  : `기자 상성: ${focusedPreview.affinityNoteKo}`
                : isEn
                  ? `Condition: ${focusedSkill.successCondEn}`
                  : `성공 팁: ${focusedSkill.successCondKo}`}
            </span>
          </div>

          {!focusedPreview.usable && (focusedPreview.lockReasonKo || focusedPreview.lockReasonEn) && (
            <div className="text-[11px] font-pixel text-rose-300 bg-rose-950/60 border border-rose-700 rounded px-2.5 py-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>{isEn ? focusedPreview.lockReasonEn : focusedPreview.lockReasonKo}</span>
            </div>
          )}

          {focusedPreview.usable && focusedPreview.lethalWarningType && (
            <div className="text-[11px] font-pixel text-amber-200 bg-red-950/90 border border-red-500 rounded px-2.5 py-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{isEn ? focusedPreview.lethalWarningEn : focusedPreview.lethalWarningKo}</span>
            </div>
          )}
        </div>
      )}

      {/* Minecraft-Style 2x2 / 1x4 Skill Slot Grid (Zero scroll per category!) */}
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
            <div
              key={sk.id}
              onMouseEnter={() => setFocusedSkillId(sk.id)}
              onClick={() => {
                if (focusedSkill.id === sk.id && prev.usable) {
                  handleSkillTrigger(sk.id);
                } else {
                  sound.playBlip();
                  setFocusedSkillId(sk.id);
                }
              }}
              onDoubleClick={() => handleSkillTrigger(sk.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSkillTrigger(sk.id);
                }
              }}
              className={`pixel-slot p-2 text-left transition-all cursor-pointer select-none flex flex-col justify-between min-h-[76px] ${
                isSelected ? 'active ring-2 ring-amber-400' : ''
              } ${!prev.usable ? 'locked' : 'hover:border-slate-500'}`}
            >
              <div className="flex items-center justify-between gap-1 text-[10px] font-pixel">
                <span className="text-slate-400">
                  #{String(sk.num).padStart(2, '0')} {catMeta.icon}
                </span>
                {isStage1FirstTurn && starterRecommendedIds.includes(sk.id) && prev.usable ? (
                  <span className="px-1 py-0.2 rounded bg-amber-500/20 border border-amber-400 text-[9px] text-amber-300 font-bold">
                    {isEn ? 'REC' : '추천'}
                  </span>
                ) : cd > 0 ? (
                  <span className="text-rose-400 font-bold">CD {cd}t</span>
                ) : !prev.usable ? (
                  <Lock className="w-3 h-3 text-slate-500" />
                ) : prev.lethalWarningType ? (
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                ) : leadAnalyzed && prev.affinityRating === 'great' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
              </div>

              <div className="font-pixel text-xs text-white font-bold leading-snug my-1 line-clamp-2">
                {isEn ? sk.nameEn : sk.nameKo}
              </div>

              <div className="flex items-center justify-between text-[10px] font-pixel">
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
                      : sk.category === 'D'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                  }
                >
                  {prev.effectiveHpCost < 0
                    ? `+${Math.abs(prev.effectiveHpCost)}HP`
                    : sk.category === 'D'
                      ? `R+${leadAnalyzed ? prev.expectedRiskDelta : sk.riskDelta}`
                      : `-${prev.effectiveHpCost}HP`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-slate-500 font-pixel flex items-center justify-between">
        <span>
          {isEn
            ? 'Tip: Click a skill to inspect, click again (or press Execute) to act.'
            : '팁: 스킬 슬롯을 클릭해 상성을 확인하고 한 번 더 누르거나 [이 스킬 실행]을 누르세요.'}
        </span>
        {state.stageBattle && state.stageBattle.sameCategoryStreak >= 2 && (
          <span className="text-amber-400">
            ⚠️ {isEn ? 'Same-category streak reduces impact!' : '동일 계열 연속 사용 시 효율 감소 중!'}
          </span>
        )}
      </div>
    </div>
  );
};
