import React, { useMemo, useState } from 'react';
import { GitBranch, HelpCircle, Layers, Shuffle, X } from 'lucide-react';
import { ENDINGS } from '../data/endings';
import { PR_SKILLS, PR_SKILLS_BY_ID } from '../data/skills';
import {
  buildContextualWhatIfPresets,
  getWhatIfSkillOptionsAtTurn,
  runWhatIfFullStrategy,
  runWhatIfSingleTurn,
  STRATEGY_POLICY_META,
} from '../engine/analyticsEngine';
import { STAGE_RESOLUTION_META } from '../engine/progressionEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState, StageNumber, StrategyPolicyId } from '../types/game';
import { sound } from '../utils/sound';

interface WhatIfModalProps {
  state: GameState;
  initialStage?: StageNumber;
  onClose: () => void;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({ state, initialStage, onClose }) => {
  const { isEn } = useLanguage();

  const availableStages = useMemo(() => {
    return ([1, 2, 3, 4, 5, 6] as StageNumber[]).filter(
      (s) => (state.stageSnapshots[s]?.chosenSkillSequence.length || 0) > 0
    );
  }, [state.stageSnapshots]);

  const [selectedStage, setSelectedStage] = useState<StageNumber>(
    initialStage && availableStages.includes(initialStage)
      ? initialStage
      : availableStages[availableStages.length - 1] || 1
  );

  const snap = state.stageSnapshots[selectedStage];
  const [mode, setMode] = useState<'single_turn' | 'full_strategy'>('single_turn');
  const [turnIndex, setTurnIndex] = useState<number>(0);

  const safeTurnIndex = snap
    ? Math.max(0, Math.min(turnIndex, Math.max(0, snap.chosenSkillSequence.length - 1)))
    : 0;

  const turnSkillOptions = useMemo(
    () => getWhatIfSkillOptionsAtTurn(state, selectedStage, safeTurnIndex),
    [state, selectedStage, safeTurnIndex]
  );

  const unlockedForStage = useMemo(() => {
    if (!snap) return PR_SKILLS.slice(0, 10);
    return PR_SKILLS.filter((s) => snap.unlockedSkillIdsAtStart.includes(s.id));
  }, [snap]);

  const [altSkillId, setAltSkillId] = useState<string>(() => {
    const seq0 = snap?.chosenSkillSequence[0];
    const fallback = unlockedForStage.find((s) => s.id !== seq0)?.id || 'B06_internal_factcheck';
    return fallback;
  });

  const effectiveAltSkillId = useMemo(() => {
    const actualAtTurn = snap?.chosenSkillSequence[safeTurnIndex];
    const matched = turnSkillOptions.find((o) => o.skillId === altSkillId && o.usable);
    if (matched) return matched.skillId;
    const altUsable =
      turnSkillOptions.find((o) => o.usable && o.skillId !== actualAtTurn) ||
      turnSkillOptions.find((o) => o.usable);
    return altUsable?.skillId || altSkillId;
  }, [turnSkillOptions, altSkillId, snap, safeTurnIndex]);

  const [altPolicy, setAltPolicy] = useState<StrategyPolicyId>('transparent_remedy');

  const presets = useMemo(
    () => buildContextualWhatIfPresets(state, selectedStage),
    [state, selectedStage]
  );

  const result = useMemo(() => {
    if (!snap || snap.chosenSkillSequence.length === 0) return null;
    if (mode === 'single_turn') {
      return runWhatIfSingleTurn(state, selectedStage, safeTurnIndex, effectiveAltSkillId);
    }
    return runWhatIfFullStrategy(state, selectedStage, altPolicy);
  }, [state, selectedStage, mode, safeTurnIndex, effectiveAltSkillId, altPolicy, snap]);

  const formatResolution = (
    res: string,
    grade: string,
    gameOverEndingId?: keyof typeof ENDINGS
  ) => {
    if (res === 'game_over') {
      const endDef = gameOverEndingId ? ENDINGS[gameOverEndingId] : null;
      return isEn
        ? `💀 GAME OVER (${endDef ? endDef.badgeEn : 'Eliminated'})`
        : `💀 게임 오버 (${endDef ? endDef.badgeKo : '중도 탈락'})`;
    }
    const meta = STAGE_RESOLUTION_META[res as keyof typeof STAGE_RESOLUTION_META];
    if (!meta) return res;
    return isEn ? `[${grade}] ${meta.nameEn}` : `[등급 ${grade}] ${meta.nameKo}`;
  };

  // Immediate single-turn effect vs Full-stage ripple effect
  const immediateTurnComparison = useMemo(() => {
    if (!result || result.mode !== 'single_turn' || result.turnIndexReplaced === undefined) return null;
    const step = result.turnIndexReplaced + 1;
    const actPt = result.actual.turnTrajectory[step];
    const cfPt = result.counterfactual.turnTrajectory[step];
    if (!actPt || !cfPt) return null;
    return {
      turnNum: step,
      actPressure: actPt.pressure,
      cfPressure: cfPt.pressure,
      actXp: actPt.xp,
      cfXp: cfPt.xp,
      actRisk: actPt.risk,
      cfRisk: cfPt.risk,
    };
  }, [result]);

  // Dual trajectory SVG
  const chartW = 500;
  const chartH = 150;
  const padX = 36;
  const padY = 18;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const maxLen = result
    ? Math.max(result.actual.turnTrajectory.length, result.counterfactual.turnTrajectory.length, 2)
    : 2;

  const toPoly = (traj: { pressure: number }[]) =>
    traj
      .map((pt, idx) => {
        const x = padX + (idx / (maxLen - 1)) * innerW;
        const y = padY + ((100 - pt.pressure) / 100) * innerH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="pixel-card max-w-4xl w-full p-4 sm:p-6 border-amber-400 my-auto max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-amber-300 font-pixel text-xs font-bold">
              <GitBranch className="w-4 h-4" />
              <span>
                {isEn
                  ? 'COUNTERFACTUAL SIMULATION — WHAT IF?'
                  : '반사실적 시뮬레이션 — WHAT IF? (“만약 다른 선택을 했다면?”)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isEn
                ? 'Restores exact stage-start state, journalist stats, crisis, and RNG seed to compare alternative choices.'
                : '스테이지 시작 시점의 자원·기자 능력치·사건·난수 시드(Seed)를 동일하게 고정한 채 대체 선택의 결과를 정량 비교합니다.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {availableStages.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded p-6 text-center text-xs font-pixel text-slate-300">
            {isEn
              ? 'Play at least 1 turn in any stage first to compare your actual actions against counterfactuals!'
              : '실제 플레이 기록과 비교하는 기능입니다. 스테이지에서 최소 1턴 이상 행동한 뒤 실행해 주세요!'}
          </div>
        ) : (
          <>
            {/* Stage Tabs & Mode Switch */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 flex-wrap">
                {availableStages.map((stg) => (
                  <button
                    key={stg}
                    onClick={() => {
                      sound.playBlip();
                      setSelectedStage(stg);
                      setTurnIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-pixel border ${
                      selectedStage === stg
                        ? 'bg-amber-600 text-white border-amber-300 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    STAGE {stg}
                  </button>
                ))}
              </div>

              {/* Single-turn vs Full-strategy toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => {
                    sound.playBlip();
                    setMode('single_turn');
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-pixel flex items-center gap-1 ${
                    mode === 'single_turn'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Single Action Swap' : '단일 행동 변경 효과'}</span>
                </button>
                <button
                  onClick={() => {
                    sound.playBlip();
                    setMode('full_strategy');
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-pixel flex items-center gap-1 ${
                    mode === 'full_strategy'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Full Strategy Swap' : '이후 전체 전략 변경 효과'}</span>
                </button>
              </div>
            </div>

            {/* Contextual One-Click Questions */}
            {presets.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-pixel text-amber-300">
                  💡 {isEn ? 'Suggested Counterfactual Questions:' : '추천 반사실 질문 바로가기:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p, idx) => (
                    <button
                      key={`${p.turnIdx}_${p.altSkillId}_${idx}`}
                      onClick={() => {
                        sound.playClick();
                        setMode('single_turn');
                        setTurnIndex(p.turnIdx);
                        setAltSkillId(p.altSkillId);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-400 text-[11px] text-slate-200 text-left transition-colors"
                    >
                      “{isEn ? p.labelEn : p.labelKo}”
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Controls */}
            {snap && mode === 'single_turn' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                <div>
                  <label className="block font-pixel text-slate-400 mb-1">
                    {isEn ? '1. Select Actual Turn to Replace' : '1. 변경할 실제 플레이 턴 선택'}
                  </label>
                  <select
                    value={turnIndex}
                    onChange={(e) => setTurnIndex(Number(e.target.value))}
                    className="voxel-input w-full text-xs font-pixel"
                  >
                    {snap.chosenSkillSequence.map((skId, idx) => {
                      const sk = PR_SKILLS_BY_ID[skId];
                      return (
                        <option key={`${idx}_${skId}`} value={idx}>
                          {isEn
                            ? `Turn ${idx + 1}: ${sk?.nameEn || skId}`
                            : `${idx + 1}턴 실제 선택: [${sk?.nameKo || skId}]`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-pixel text-slate-400 mb-1">
                    {isEn ? '2. Alternative PR Skill' : '2. 대체할 홍보 스킬 선택'}
                  </label>
                  <select
                    value={effectiveAltSkillId}
                    onChange={(e) => setAltSkillId(e.target.value)}
                    className="voxel-input w-full text-xs font-pixel"
                  >
                    {unlockedForStage.map((sk) => {
                      const opt = turnSkillOptions.find((o) => o.skillId === sk.id);
                      const isUsable = opt ? opt.usable : true;
                      const reason = isEn ? opt?.lockReasonEn : opt?.lockReasonKo;
                      return (
                        <option key={sk.id} value={sk.id} disabled={!isUsable}>
                          #{String(sk.num).padStart(2, '0')} [{sk.category}] {isEn ? sk.nameEn : sk.nameKo}
                          {!isUsable && reason ? ` (${reason})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {mode === 'full_strategy' && (
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs space-y-2">
                <label className="block font-pixel text-slate-300">
                  {isEn
                    ? 'Select Full-Stage Alternative Strategy Policy:'
                    : '스테이지 시작부터 끝까지 적용할 대체 전략 유형 선택:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      'transparent_remedy',
                      'fact_check',
                      'relationship',
                      'legal_defense',
                      'big_budget',
                      'random_baseline',
                    ] as StrategyPolicyId[]
                  ).map((pol) => {
                    const m = STRATEGY_POLICY_META[pol];
                    return (
                      <button
                        key={pol}
                        onClick={() => {
                          sound.playBlip();
                          setAltPolicy(pol);
                        }}
                        className={`p-2 rounded border text-left font-pixel text-[11px] ${
                          altPolicy === pol
                            ? 'bg-indigo-950 border-indigo-400 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div>{isEn ? m.nameEn : m.nameKo}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-indigo-200/90">
                  {isEn ? STRATEGY_POLICY_META[altPolicy].ruleDescEn : STRATEGY_POLICY_META[altPolicy].ruleDescKo}
                </p>
              </div>
            )}

            {/* Comparison Output */}
            {result && (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-amber-500/50 rounded p-3">
                  <div className="font-pixel text-xs sm:text-sm text-amber-300 font-bold">
                    ❓ {isEn ? result.questionEn : result.questionKo}
                  </div>
                  <div className="text-[10px] font-pixel text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    <span>🔒 {isEn ? `Controlled Seed: ${result.seedUsed}` : `동일 통제 시드(Seed): ${result.seedUsed}`}</span>
                    <span>·</span>
                    <span>
                      {result.mode === 'single_turn'
                        ? isEn
                          ? 'Mode: Single Turn Replaced (Subsequent actual sequence preserved where usable)'
                          : '구분: 단일 턴 행동 교체 (이후 턴은 원래 플레이 수순 유지)'
                        : isEn
                          ? 'Mode: Full Stage Strategy Replaced (All turns re-decided by policy)'
                          : '구분: 전체 전략 교체 (1턴부터 종료까지 대안 전략 일관 수행)'}
                    </span>
                  </div>
                </div>

                {/* Single-Turn Immediate Delta vs Stage-End Separation */}
                {immediateTurnComparison && (
                  <div className="bg-sky-950/40 border border-sky-600/60 rounded p-2.5 text-xs flex flex-wrap items-center justify-between gap-2 font-pixel">
                    <span className="text-sky-300 font-bold">
                      ⚡{' '}
                      {isEn
                        ? `[Turn ${immediateTurnComparison.turnNum} Immediate Single-Action Effect]`
                        : `[${immediateTurnComparison.turnNum}턴 직후 단일 행동 직접 효과]`}
                    </span>
                    <div className="flex flex-wrap gap-3 text-[11px]">
                      <span>
                        {isEn ? 'Pressure:' : '직후 압박:'} <b>{immediateTurnComparison.actPressure}%</b> →{' '}
                        <b className="text-amber-300">{immediateTurnComparison.cfPressure}%</b>
                      </span>
                      <span>
                        XP: <b>{immediateTurnComparison.actXp}</b> →{' '}
                        <b className="text-amber-300">{immediateTurnComparison.cfXp}</b>
                      </span>
                      <span>
                        RISK: <b>{immediateTurnComparison.actRisk}</b> →{' '}
                        <b className="text-amber-300">{immediateTurnComparison.cfRisk}</b>
                      </span>
                    </div>
                  </div>
                )}

                {/* Dual SVG Trajectory Chart */}
                <div className="pixel-slot p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-pixel">
                    <span className="text-slate-200 font-bold">
                      {isEn ? 'Press Pressure Comparison Curve' : '기사 보도 압박 궤적 비교 (실제 vs WHAT IF)'}
                    </span>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-sky-400">● {isEn ? 'Actual Play' : '실제 플레이'}</span>
                      <span className="text-amber-400">● {isEn ? 'Counterfactual (WHAT IF)' : '가상 대안 (WHAT IF)'}</span>
                    </div>
                  </div>
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36 bg-slate-950 rounded border border-slate-800">
                    <line
                      x1={padX}
                      y1={padY + ((100 - 68) / 100) * innerH}
                      x2={chartW - padX}
                      y2={padY + ((100 - 68) / 100) * innerH}
                      stroke="#475569"
                      strokeDasharray="4 4"
                    />
                    <polyline
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      points={toPoly(result.actual.turnTrajectory)}
                    />
                    <polyline
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={3}
                      strokeDasharray="6 3"
                      points={toPoly(result.counterfactual.turnTrajectory)}
                    />
                  </svg>
                </div>

                {/* Side-by-Side 7-Metric Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-pixel border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-700 text-slate-300">
                        <th className="p-2 text-left">{isEn ? 'Metric' : '비교 지표'}</th>
                        <th className="p-2 text-right text-sky-300">
                          {isEn ? result.actual.labelEn : result.actual.labelKo}
                        </th>
                        <th className="p-2 text-right text-amber-300">
                          {isEn ? result.counterfactual.labelEn : result.counterfactual.labelKo}
                        </th>
                        <th className="p-2 text-right">{isEn ? 'Difference' : '대안 차이(Δ)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {[
                        {
                          label: isEn ? 'Stage Outcome' : '사건 대응 결과',
                          actStr: formatResolution(
                            result.actual.resolution,
                            result.actual.grade,
                            result.actual.gameOverEndingId
                          ),
                          cfStr: formatResolution(
                            result.counterfactual.resolution,
                            result.counterfactual.grade,
                            result.counterfactual.gameOverEndingId
                          ),
                          diff: '',
                        },
                        {
                          label: isEn ? 'End Battle XP' : '전투 종료 XP',
                          actVal: result.actual.finalResources.xp,
                          cfVal: result.counterfactual.finalResources.xp,
                          goodHigh: true,
                        },
                        {
                          label: isEn ? 'End Battle HP' : '전투 종료 HP',
                          actVal: result.actual.finalResources.hp,
                          cfVal: result.counterfactual.finalResources.hp,
                          goodHigh: true,
                        },
                        {
                          label: isEn ? 'Backlash RISK' : '역풍 위험 (RISK)',
                          actVal: result.actual.finalResources.risk,
                          cfVal: result.counterfactual.finalResources.risk,
                          goodHigh: false,
                        },
                        {
                          label: isEn ? 'Corporate Reputation' : '기업 평판',
                          actVal: result.actual.carryOverResources.reputation,
                          cfVal: result.counterfactual.carryOverResources.reputation,
                          goodHigh: true,
                        },
                        {
                          label: isEn ? 'Reporter Trust' : '기자 신뢰(친밀도)',
                          actVal: result.actual.finalTrust,
                          cfVal: result.counterfactual.finalTrust,
                          goodHigh: true,
                        },
                        {
                          label: isEn ? 'Carry-Over to Next Stage' : '다음 스테이지 이월 자원',
                          actStr: `${result.actual.carryOverResources.xp} XP / ${result.actual.carryOverResources.hp} HP`,
                          cfStr: `${result.counterfactual.carryOverResources.xp} XP / ${result.counterfactual.carryOverResources.hp} HP`,
                          diff: `${
                            result.counterfactual.carryOverResources.xp - result.actual.carryOverResources.xp >= 0
                              ? '+'
                              : ''
                          }${result.counterfactual.carryOverResources.xp - result.actual.carryOverResources.xp} XP`,
                        },
                      ].map((row) => {
                        const d =
                          row.actVal !== undefined && row.cfVal !== undefined
                            ? row.cfVal - row.actVal
                            : null;
                        const dColor =
                          d === null || d === 0
                            ? 'text-slate-400'
                            : (row.goodHigh ? d > 0 : d < 0)
                              ? 'text-emerald-400 font-bold'
                              : 'text-rose-400 font-bold';

                        return (
                          <tr key={row.label} className="bg-slate-950/60">
                            <td className="p-2 text-slate-300">{row.label}</td>
                            <td className="p-2 text-right text-white">
                              {row.actStr ?? row.actVal}
                            </td>
                            <td className="p-2 text-right text-amber-200 font-bold">
                              {row.cfStr ?? row.cfVal}
                            </td>
                            <td className={`p-2 text-right ${dColor}`}>
                              {d !== null ? (d > 0 ? `+${d}` : d) : row.diff}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded p-2.5 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            {isEn
              ? 'Virtual Simulation Disclaimer: Counterfactual outcomes reflect deterministic game rules under identical RNG seeds, not real-world media predictions.'
              : '가상 모형 고지: 위 반사실 비교 결과는 동일한 난수 시드 아래 게임 내 수칙으로 계산된 가상 시뮬레이션이며 실제 현실의 언론·기업 행동을 예측하지 않습니다.'}
          </span>
        </div>
      </div>
    </div>
  );
};
