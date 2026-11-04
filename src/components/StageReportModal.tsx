import React from 'react';
import { ArrowRight, Award, BarChart2, GitBranch, HelpCircle, Sparkles, TrendingDown } from 'lucide-react';
import { PR_SKILLS } from '../data/skills';
import { summarizeStageTelemetry } from '../engine/analyticsEngine';
import { STAGE_RESOLUTION_META } from '../engine/progressionEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState, StageNumber } from '../types/game';
import { sound } from '../utils/sound';

interface StageReportModalProps {
  state: GameState;
  onProceedNextStage: () => void;
  onOpenWhatIf: (stage: StageNumber) => void;
  onOpenSurvivalSim: () => void;
  onOpenMethodology: () => void;
}

export const StageReportModal: React.FC<StageReportModalProps> = ({
  state,
  onProceedNextStage,
  onOpenWhatIf,
  onOpenSurvivalSim,
  onOpenMethodology,
}) => {
  const { isEn } = useLanguage();
  const summary = state.lastStageSummary;
  if (!summary) return null;

  const resMeta = STAGE_RESOLUTION_META[summary.resolution];
  const telSummary = summarizeStageTelemetry(state.telemetryLogs, summary.stage);

  // Build SVG pressure trajectory points
  const pressurePoints: { label: string; val: number }[] = telSummary
    ? [
        { label: isEn ? 'Start' : '시작', val: telSummary.initialPressure },
        ...telSummary.logs.map((l) => ({
          label: `${l.stageTurn}T`,
          val: l.afterTurnComplete.pressure,
        })),
      ]
    : [{ label: 'End', val: summary.finalPressure }];

  const chartW = 460;
  const chartH = 145;
  const padX = 34;
  const padY = 18;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const polyPoints = pressurePoints
    .map((pt, idx) => {
      const x =
        pressurePoints.length === 1
          ? padX + innerW / 2
          : padX + (idx / (pressurePoints.length - 1)) * innerW;
      const y = padY + ((100 - pt.val) / 100) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  const nextStageNum = Math.min(6, summary.stage + 1) as StageNumber;
  const newlyUnlocked = summary.stage < 6 ? PR_SKILLS.filter((s) => s.minStage === nextStageNum) : [];

  return (
    <div className="pixel-card p-4 sm:p-6 border-amber-400/90 space-y-5">
      {/* Top Stage Resolution Header (Metric 8) */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-400 font-pixel text-[11px] text-indigo-200">
              📊 {isEn ? `STAGE ${summary.stage} CRISIS ANALYTICS REPORT` : `STAGE ${summary.stage} 위기 대응 데이터 리포트`}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded font-pixel text-xs font-bold border ${
                resMeta.isSuccess
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                  : 'bg-rose-950 border-rose-500 text-rose-300'
              }`}
            >
              {isEn ? `Grade ${summary.grade} · ${resMeta.nameEn}` : `등급 ${summary.grade} · ${resMeta.nameKo}`}
            </span>
          </div>
          <h2 className="font-pixel text-base sm:text-xl text-white font-extrabold mt-1.5">
            {isEn ? summary.headlineEn : summary.headlineKo}
          </h2>
          <p className="text-xs text-slate-300 mt-1">{isEn ? resMeta.descEn : resMeta.descKo}</p>
        </div>

        <button
          onClick={() => {
            sound.playBlip();
            onOpenMethodology();
          }}
          className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 hover:border-sky-400 text-[11px] font-pixel text-sky-300 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{isEn ? 'Formula Info' : '산출 공식 ⓘ'}</span>
        </button>
      </div>

      {/* Crisp Decision Summary (Clean & Compact) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs font-pixel space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <div className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEn ? 'DECISION IMPACT SUMMARY' : '대응 결과 핵심 분석 요약'}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {isEn ? `Final Pressure: ${summary.finalPressure}%` : `최종 보도압박: ${summary.finalPressure}%`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          {telSummary?.bestMove ? (
            <div className="bg-slate-950/80 p-2 rounded border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
              <span className="text-base">🎯</span>
              <div>
                <span className="text-slate-400 font-normal">{isEn ? 'Decisive Move: ' : '결정적 한 수: '}</span>
                <b className="text-emerald-300">{isEn ? telSummary.bestMove.skillNameEn : telSummary.bestMove.skillNameKo}</b>
                <span className="text-emerald-400 ml-1">({telSummary.bestMove.pressureDelta}%p)</span>
              </div>
            </div>
          ) : null}

          {telSummary?.worstMove && telSummary.worstMove.outcome === 'backfire' ? (
            <div className="bg-slate-950/80 p-2 rounded border border-rose-500/40 text-rose-200 flex items-center gap-2">
              <span className="text-base">💥</span>
              <div>
                <span className="text-slate-400 font-normal">{isEn ? 'Risk Backfire: ' : '취재 역풍: '}</span>
                <b className="text-rose-300">{isEn ? telSummary.worstMove.skillNameEn : telSummary.worstMove.skillNameKo}</b>
                <span className="text-rose-400 ml-1">(RISK +{telSummary.worstMove.riskDelta})</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-slate-300 flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <div>
                <span className="text-slate-400 font-normal">{isEn ? 'Resolution: ' : '대응 성과: '}</span>
                <b className="text-sky-300">{isEn ? resMeta.nameEn : resMeta.nameKo}</b>
                <span className="text-slate-400 ml-1">({telSummary?.logs.length || 0}턴 대응)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics 2~6: 5 Core Delta Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-pixel text-xs">
        <div className="pixel-slot p-2.5">
          <div className="text-[10px] text-slate-400">② {isEn ? 'XP Budget Spent' : '홍보예산 XP 소모'}</div>
          <div className="text-sm font-bold text-amber-300 mt-0.5">
            -{telSummary?.totalXpSpent ?? 0} XP
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            +{summary.xpReward} {isEn ? 'Stage Bonus' : '보충 지급'}
          </div>
        </div>

        <div className="pixel-slot p-2.5">
          <div className="text-[10px] text-slate-400">③ {isEn ? 'HP Stamina Spent' : '체력 HP 소모'}</div>
          <div className="text-sm font-bold text-rose-300 mt-0.5">
            -{telSummary?.totalHpSpent ?? 0} HP
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            +{summary.hpReward} {isEn ? 'Rest Bonus' : '정비 회복'}
          </div>
        </div>

        <div className="pixel-slot p-2.5">
          <div className="text-[10px] text-slate-400">④ {isEn ? 'Reputation Shift' : '기업 평판 변화'}</div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              (telSummary?.netReputationDelta ?? 0) >= 0 ? 'text-sky-300' : 'text-rose-400'
            }`}
          >
            {(telSummary?.netReputationDelta ?? 0) >= 0
              ? `+${telSummary?.netReputationDelta ?? 0}`
              : telSummary?.netReputationDelta ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isEn ? `Now ${state.resources.reputation}/100` : `현재 ${state.resources.reputation}/100`}
          </div>
        </div>

        <div className="pixel-slot p-2.5">
          <div className="text-[10px] text-slate-400">⑤ {isEn ? 'Reporter Trust' : '기자 신뢰 변화'}</div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              (telSummary?.netTrustDelta ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {(telSummary?.netTrustDelta ?? 0) >= 0
              ? `+${telSummary?.netTrustDelta ?? 0}`
              : telSummary?.netTrustDelta ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
            {isEn ? summary.leadJournalistNameEn : summary.leadJournalistNameKo}
          </div>
        </div>

        <div className="pixel-slot p-2.5 col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-400">⑥ {isEn ? 'Backlash RISK' : '역풍 위험 변화'}</div>
          <div
            className={`text-sm font-bold mt-0.5 ${
              (telSummary?.netRiskDelta ?? 0) <= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}
          >
            {(telSummary?.netRiskDelta ?? 0) > 0
              ? `+${telSummary?.netRiskDelta}`
              : telSummary?.netRiskDelta ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isEn ? `Total RISK ${state.resources.risk}` : `누적 RISK ${state.resources.risk}`}
          </div>
        </div>
      </div>

      {/* Charts Row: ① Press Pressure Curve + ⑦ Skill Cost-Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ① Press Pressure Curve */}
        <div className="pixel-slot p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-pixel">
            <span className="text-rose-300 font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              ① {isEn ? 'Press Pressure Trajectory (%)' : '기사 보도 압박 변화 추이 (%)'}
            </span>
            <span className="text-[10px] text-slate-400">
              {telSummary?.initialPressure ?? 0}% → {summary.finalPressure}%
            </span>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36 bg-slate-950 rounded border border-slate-800">
            {/* 68% Safe Line */}
            <line
              x1={padX}
              y1={padY + ((100 - 68) / 100) * innerH}
              x2={chartW - padX}
              y2={padY + ((100 - 68) / 100) * innerH}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <text
              x={chartW - padX - 4}
              y={padY + ((100 - 68) / 100) * innerH - 4}
              textAnchor="end"
              fill="#fbbf24"
              fontSize="9"
            >
              68% {isEn ? 'Defense Line' : '방어선'}
            </text>

            {/* 15% Drop Line */}
            <line
              x1={padX}
              y1={padY + ((100 - 15) / 100) * innerH}
              x2={chartW - padX}
              y2={padY + ((100 - 15) / 100) * innerH}
              stroke="#10b981"
              strokeDasharray="3 3"
              strokeWidth={1}
            />

            {/* Polyline */}
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth={3}
              points={polyPoints}
            />

            {/* Data Dots */}
            {pressurePoints.map((pt, idx) => {
              const x =
                pressurePoints.length === 1
                  ? padX + innerW / 2
                  : padX + (idx / (pressurePoints.length - 1)) * innerW;
              const y = padY + ((100 - pt.val) / 100) * innerH;
              return (
                <g key={`${pt.label}_${idx}`}>
                  <circle cx={x} cy={y} r={4.5} fill="#0ea5e9" stroke="#fff" strokeWidth={1.5} />
                  <text x={x} y={y - 8} textAnchor="middle" fill="#e2e8f0" fontSize="9.5" fontWeight="bold">
                    {pt.val}%
                  </text>
                  <text x={x} y={chartH - 4} textAnchor="middle" fill="#94a3b8" fontSize="9">
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ⑦ Cost-Effectiveness Per Skill */}
        <div className="pixel-slot p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-pixel">
            <span className="text-amber-300 font-bold">
              ⑦ {isEn ? 'Skill Cost-Effectiveness Breakdown' : '사용한 스킬의 비용 대비 효과'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isEn ? 'Pressure Δ / XP·HP Cost' : '압박감소 및 투입자원'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {telSummary?.skillEfficiencyList.map((item) => {
              const pressReduction = -item.pressureDelta;
              const barPct = Math.min(100, Math.max(8, Math.abs(pressReduction) * 3.2));
              const isPositive = pressReduction >= 0;
              return (
                <div key={`${item.turn}_${item.skillId}`} className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between font-pixel">
                    <span className="text-white font-bold">
                      {item.turn}T · {isEn ? item.skillNameEn : item.skillNameKo}
                    </span>
                    <span className={isPositive ? 'text-emerald-300' : 'text-rose-400'}>
                      {isEn ? 'Pressure' : '압박'} {item.pressureDelta > 0 ? `+${item.pressureDelta}` : item.pressureDelta} ·{' '}
                      {isEn ? 'Eff' : '효율'} {item.effRatio}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden mt-1">
                    <div
                      className={`h-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Newly Unlocked Skills Banner */}
      {newlyUnlocked.length > 0 && (
        <div className="bg-indigo-950/50 border border-indigo-500/60 rounded p-3 text-xs">
          <div className="font-pixel text-indigo-300 font-bold mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>
              {isEn
                ? `NEW SKILLS UNLOCKED FOR STAGE ${nextStageNum} (${newlyUnlocked.length})`
                : `STAGE ${nextStageNum} 진입 신규 홍보 스킬 해금 (${newlyUnlocked.length}종)`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {newlyUnlocked.map((sk) => (
              <span
                key={sk.id}
                className="px-2 py-0.5 rounded bg-slate-950 border border-indigo-600/60 font-pixel text-[11px] text-slate-200"
              >
                #{sk.num} {isEn ? sk.nameEn : sk.nameKo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons: Counterfactual WHAT-IF, Survival Sim, Next Stage */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <button
          onClick={() => {
            sound.playBlip();
            onOpenWhatIf(summary.stage);
          }}
          className="pixel-btn-mc px-4 py-3 text-xs font-bold text-amber-200 border-amber-500 flex items-center justify-center gap-1.5"
        >
          <GitBranch className="w-4 h-4 text-amber-400" />
          <span>{isEn ? 'WHAT IF? Counterfactual Lab' : 'WHAT IF? 반사실 대안 비교'}</span>
        </button>

        <button
          onClick={() => {
            sound.playBlip();
            onOpenSurvivalSim();
          }}
          className="pixel-btn-mc px-4 py-3 text-xs font-bold text-indigo-200 border-indigo-500 flex items-center justify-center gap-1.5"
        >
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>{isEn ? 'Remaining Survival Odds' : '남은 스테이지 생존 확률'}</span>
        </button>

        <button
          onClick={() => {
            sound.playSuccess();
            onProceedNextStage();
          }}
          className="pixel-btn-mc pixel-btn-mc-primary flex-1 py-3 px-5 text-sm font-bold flex items-center justify-center gap-2"
        >
          <span>
            {summary.stage < 6
              ? isEn
                ? `Proceed to STAGE ${summary.stage + 1}`
                : `STAGE ${summary.stage + 1} 위기 대응으로 이동`
              : isEn
                ? 'View Final Executive Evaluation!'
                : '최종 임원 인사 결과 확인!'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
