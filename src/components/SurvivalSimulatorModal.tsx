import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, Dices, HelpCircle, Play, X } from 'lucide-react';
import { COMPANY_SCALES } from '../data/companies';
import { STRATEGY_POLICY_META } from '../engine/analyticsEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { CompanyScaleId, GameState, MonteCarloResult, StrategyPolicyId } from '../types/game';
import { sound } from '../utils/sound';
import { runMonteCarloAsync } from '../workers/mcClient';

interface SurvivalSimulatorModalProps {
  state: GameState;
  onClose: () => void;
  onOpenMethodology: () => void;
}

export const SurvivalSimulatorModal: React.FC<SurvivalSimulatorModalProps> = ({
  state,
  onClose,
  onOpenMethodology,
}) => {
  const { isEn } = useLanguage();
  const hasActiveRun =
    state.phase === 'battle' || state.phase === 'stage_result' || state.phase === 'company_assigned';

  const [iterations, setIterations] = useState<1000 | 5000>(1000);
  const [policy, setPolicy] = useState<StrategyPolicyId>(
    Object.keys(state.skillUsageCounts).length > 0 ? 'player_habit' : 'transparent_remedy'
  );
  const [customScale, setCustomScale] = useState<CompanyScaleId>(state.company.scale);
  const [seed, setSeed] = useState<number>(() => (state.seed || 20261103) >>> 0);
  const [loading, setLoading] = useState<boolean>(true);
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);

  const executeSimulation = async (iterCount = iterations, pol = policy, simSeed = seed, sc = customScale) => {
    setLoading(true);
    try {
      const resp = await runMonteCarloAsync({
        kind: 'single',
        baseState: hasActiveRun ? state : undefined,
        companyScale: sc,
        experienceYears: state.player.experienceYears,
        startStage: 1,
        strategyPolicy: pol,
        iterations: iterCount,
        seed: simSeed,
      });
      if (resp.singleResult) {
        setMcResult(resp.singleResult);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    runMonteCarloAsync({
      kind: 'single',
      baseState: hasActiveRun ? state : undefined,
      companyScale: customScale,
      experienceYears: state.player.experienceYears,
      startStage: 1,
      strategyPolicy: policy,
      iterations,
      seed,
    }).then((resp) => {
      if (!active) return;
      if (resp.singleResult) setMcResult(resp.singleResult);
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const policyMeta = STRATEGY_POLICY_META[policy];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="pixel-card max-w-4xl w-full p-4 sm:p-6 border-indigo-400 my-auto max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-pixel text-xs sm:text-sm font-bold">
              <BarChart3 className="w-4 h-4" />
              <span>
                {isEn
                  ? 'HONGDAM MONTE CARLO SURVIVAL SIMULATOR'
                  : '홍담 생존 시뮬레이터 (시드 기반 몬테카를로 가상 실험)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {hasActiveRun
                ? isEn
                  ? `Simulating remaining stages from your live resources (${state.resources.xp} XP, ${state.resources.hp} HP, RISK ${state.resources.risk}, Rep ${state.resources.reputation}).`
                  : `현재 보유 자원(${state.resources.xp} XP, ${state.resources.hp} HP, RISK ${state.resources.risk}, 평판 ${state.resources.reputation}) 상태에서 남은 스테이지의 다양한 사건·기자 조합을 반복 생성해 생존 확률을 계산합니다.`
                : isEn
                  ? 'Simulating Stages 1–6 across randomized crises and journalist combinations.'
                  : '선택한 기업 규모와 미래 대응 전략 아래 STAGE 1~6 전체 위기를 반복 시뮬레이션합니다.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenMethodology}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-pixel text-sky-300 flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ⓘ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded border border-slate-800 text-xs">
          <div>
            <label className="block font-pixel text-[11px] text-slate-400 mb-1">
              {isEn ? 'Assumed Future Strategy' : '가정할 미래 대응 전략'}
            </label>
            <select
              value={policy}
              onChange={(e) => {
                const nextPol = e.target.value as StrategyPolicyId;
                setPolicy(nextPol);
                executeSimulation(iterations, nextPol, seed, customScale);
              }}
              className="voxel-input w-full text-xs font-pixel"
            >
              {(Object.keys(STRATEGY_POLICY_META) as StrategyPolicyId[]).map((pid) => (
                <option key={pid} value={pid}>
                  {isEn ? STRATEGY_POLICY_META[pid].nameEn : STRATEGY_POLICY_META[pid].nameKo}
                </option>
              ))}
            </select>
          </div>

          {!hasActiveRun && (
            <div>
              <label className="block font-pixel text-[11px] text-slate-400 mb-1">
                {isEn ? 'Corporate Scale' : '가상 기업 규모'}
              </label>
              <select
                value={customScale}
                onChange={(e) => {
                  const sc = e.target.value as CompanyScaleId;
                  setCustomScale(sc);
                  executeSimulation(iterations, policy, seed, sc);
                }}
                className="voxel-input w-full text-xs font-pixel"
              >
                {(['startup', 'sme', 'midsize', 'large', 'chaebol'] as CompanyScaleId[]).map((sc) => (
                  <option key={sc} value={sc}>
                    {isEn ? COMPANY_SCALES[sc].nameEn : COMPANY_SCALES[sc].nameKo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-pixel text-[11px] text-slate-400 mb-1">
              {isEn ? 'Monte Carlo Iterations' : '반복 실행 횟수 (N)'}
            </label>
            <div className="grid grid-cols-2 gap-1">
              {([1000, 5000] as const).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => {
                    sound.playBlip();
                    setIterations(cnt);
                    executeSimulation(cnt, policy, seed, customScale);
                  }}
                  className={`py-2 rounded font-pixel text-xs border ${
                    iterations === cnt
                      ? 'bg-indigo-600 text-white border-indigo-300 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {cnt.toLocaleString()}{isEn ? 'x' : '회'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end gap-1">
            <label className="block font-pixel text-[11px] text-slate-400">
              Seed: <span className="text-amber-300">{seed}</span>
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  sound.playClick();
                  const nextSeed = ((seed + 7919) >>> 0) || 12345;
                  setSeed(nextSeed);
                  executeSimulation(iterations, policy, nextSeed, customScale);
                }}
                className="pixel-btn-mc px-2.5 py-1.5 text-xs text-amber-300 flex items-center gap-1"
                title={isEn ? 'Change RNG Seed' : '시드 변경 재실험'}
              >
                <Dices className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  sound.playClick();
                  executeSimulation(iterations, policy, seed, customScale);
                }}
                className="pixel-btn-mc pixel-btn-mc-primary flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{loading ? (isEn ? 'Running...' : '계산 중...') : isEn ? 'Re-Run' : '실행'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assumed Strategy Explanation */}
        <div className="bg-indigo-950/40 border border-indigo-600/60 rounded p-3 text-xs">
          <div className="font-pixel text-indigo-300 font-bold mb-0.5">
            🧭 {isEn ? `Assumed Strategy Rule — [${policyMeta.nameEn}]` : `적용된 미래 전략 가정 — [${policyMeta.nameKo}]`}
          </div>
          <p className="text-slate-200">{isEn ? policyMeta.ruleDescEn : policyMeta.ruleDescKo}</p>
        </div>

        {/* Results Dashboard */}
        {mcResult && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between text-[11px] font-pixel text-slate-400 px-1">
              <span>
                ✓{' '}
                {isEn
                  ? `Exact Executed Trials: ${mcResult.iterations.toLocaleString()} runs (Start: STAGE ${mcResult.startStage}, Scale: ${COMPANY_SCALES[mcResult.companyScale].nameEn})`
                  : `실제 실행 반복 횟수: 정확히 ${mcResult.iterations.toLocaleString()}회 완료 (시작: STAGE ${mcResult.startStage}, 규모: ${COMPANY_SCALES[mcResult.companyScale].nameKo})`}
              </span>
              <span>RNG Seed #{mcResult.seedUsed}</span>
            </div>

            {/* 5 Core Rate Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-pixel">
              <div className="pixel-slot p-3 border-sky-500/50">
                <div className="text-[10px] text-slate-400">
                  {isEn ? 'Reach Final Stage 6' : '최종 스테이지 도달'}
                </div>
                <div className="text-lg font-extrabold text-sky-300 mt-1">
                  {mcResult.reachStage6Rate.toFixed(1)}%
                </div>
              </div>

              <div className="pixel-slot p-3 border-amber-500/60">
                <div className="text-[10px] text-slate-400">
                  {isEn ? 'VP Promotion Ending' : '임원 승진 엔딩 비율'}
                </div>
                <div className="text-lg font-extrabold text-amber-300 mt-1">
                  {mcResult.execPromotionRate.toFixed(1)}%
                </div>
                <div className="text-[10px] text-emerald-400">
                  {isEn ? `Total Survive: ${mcResult.anySurvivalVictoryRate.toFixed(1)}%` : `생존 완주 합계: ${mcResult.anySurvivalVictoryRate.toFixed(1)}%`}
                </div>
              </div>

              <div className="pixel-slot p-3">
                <div className="text-[10px] text-slate-400">
                  {isEn ? 'XP Budget Exhausted' : 'XP 예산 고갈 탈락'}
                </div>
                <div className="text-lg font-extrabold text-orange-300 mt-1">
                  {mcResult.xpExhaustedRate.toFixed(1)}%
                </div>
              </div>

              <div className="pixel-slot p-3">
                <div className="text-[10px] text-slate-400">
                  {isEn ? 'HP Burnout Collapse' : 'HP 과로 입원 탈락'}
                </div>
                <div className="text-lg font-extrabold text-rose-300 mt-1">
                  {mcResult.hpExhaustedRate.toFixed(1)}%
                </div>
              </div>

              <div className="pixel-slot p-3 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">
                  {isEn ? 'RISK Limit Exceeded' : 'RISK 폭로 / 평판붕괴'}
                </div>
                <div className="text-lg font-extrabold text-red-400 mt-1">
                  {mcResult.riskExplodedRate.toFixed(1)}%{' '}
                  <span className="text-xs text-slate-400">/ {mcResult.reputationCollapsedRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Histogram: Expected Final Reputation Distribution + Stage Survival */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="pixel-slot p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-pixel">
                  <span className="text-sky-300 font-bold">
                    {isEn ? 'Expected Final Reputation Distribution' : '예상 최종 기업 평판 분포 (0~100)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isEn ? `Mean: ${mcResult.avgFinalReputation}` : `평균 평판: ${mcResult.avgFinalReputation}점`}
                  </span>
                </div>

                <div className="grid grid-cols-10 gap-1 items-end h-32 pt-4 px-1 bg-slate-950 rounded border border-slate-800">
                  {mcResult.reputationDistribution.map((bin) => {
                    const maxRate = Math.max(10, ...mcResult.reputationDistribution.map((b) => b.rate));
                    const heightPct = Math.max(4, Math.round((bin.rate / maxRate) * 100));
                    const isPromoZone = bin.min >= 50;
                    return (
                      <div key={bin.bucketLabel} className="flex flex-col items-center justify-end h-full">
                        <span className="text-[9px] font-pixel text-slate-300 mb-0.5">
                          {bin.rate > 0 ? `${Math.round(bin.rate)}%` : ''}
                        </span>
                        <div
                          className={`w-full rounded-t transition-all ${
                            isPromoZone ? 'bg-sky-500' : 'bg-slate-600'
                          }`}
                          style={{ height: `${heightPct}%` }}
                          title={`${bin.bucketLabel}: ${bin.count} (${bin.rate}%)`}
                        />
                        <span className="text-[8px] font-pixel text-slate-400 mt-1">
                          {bin.min}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] text-slate-400 font-pixel">
                  * {isEn ? 'Blue bars (50+) indicate reputation eligible for VP promotion.' : '파란 구간(50점 이상)은 임원 승진 심사 기준권입니다.'}
                </div>
              </div>

              <div className="pixel-slot p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-pixel">
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" />
                    {isEn ? 'Cumulative Survival Rate by Stage' : '스테이지별 누적 생존 통과율'}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {mcResult.stageSurvivalRates.map((sr) => (
                    <div key={sr.stage} className="space-y-0.5 text-xs font-pixel">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">STAGE {sr.stage}</span>
                        <span className="text-emerald-300 font-bold">
                          {sr.survivedRate.toFixed(1)}%{' '}
                          <span className="text-slate-500 font-normal">
                            (XP {sr.avgXp} · HP {sr.avgHp})
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${sr.survivedRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mandatory Virtual Rule Disclaimer */}
        <div className="bg-slate-950 border border-amber-500/40 rounded p-2.5 text-[11px] text-amber-200/90 font-pixel">
          ⚠️{' '}
          {isEn
            ? 'Virtual Model Notice: These probabilities are NOT real-world forecasts. They are exact Monte Carlo outcomes under HONGDAM CRAFT’s internal virtual game mechanics and the selected strategy rule.'
            : '가상 시뮬레이션 안내: 위 수치는 실제 현실의 기업·언론 예측이 아니라, 〈홍담 크래프트〉의 가상 게임 규칙과 위에서 선택한 미래 대응 전략 가정에 따라 계산된 시뮬레이션 결과입니다.'}
        </div>
      </div>
    </div>
  );
};
