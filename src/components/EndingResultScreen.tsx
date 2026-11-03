import React, { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  Check,
  Clock,
  Copy,
  Flame,
  GitBranch,
  HelpCircle,
  MessageSquarePlus,
  RotateCcw,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { ENDINGS, PR_ARCHETYPES } from '../data/endings';
import { PR_SKILLS_BY_ID, SKILL_CATEGORIES } from '../data/skills';
import { STAGES } from '../data/stages';
import { runWhatIfFullStrategy } from '../engine/analyticsEngine';
import { STAGE_RESOLUTION_META } from '../engine/progressionEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState, SkillCategory, StageNumber } from '../types/game';
import {
  buildEndingSharePayload,
  buildEndingViralDiagnosis,
  shareOrCopyChallenge,
} from '../utils/challengeShare';
import { trackFunnelStep } from '../utils/funnelTracker';
import { sound } from '../utils/sound';

interface EndingResultScreenProps {
  state: GameState;
  finishedCount?: number;
  onOpenShareCard: () => void;
  onOpenBambooWithEnding: () => void;
  onOpenWhatIf: (stage: StageNumber) => void;
  onOpenDataLab: () => void;
  onOpenMethodology: () => void;
  onRestart: () => void;
}

export const EndingResultScreen: React.FC<EndingResultScreenProps> = ({
  state,
  finishedCount = 0,
  onOpenShareCard,
  onOpenBambooWithEnding,
  onOpenWhatIf,
  onOpenDataLab,
  onOpenMethodology,
  onRestart,
}) => {
  const { isEn } = useLanguage();
  const endSum = state.endingSummary;
  const logs = state.telemetryLogs;

  // Interactive 6-Stage Timeline state
  const [selectedTimelineStage, setSelectedTimelineStage] = useState<StageNumber>(
    (state.stageHistory[state.stageHistory.length - 1]?.stage || state.currentStage || 1) as StageNumber
  );
  const [viralFeedback, setViralFeedback] = useState<'challenge' | 'copy' | null>(null);

  // Aggregate real telemetry metrics (Section 6: strictly from actual telemetryLogs!)
  const metrics = useMemo(() => {
    const totalXpSpent = logs.reduce((s, l) => s + Math.max(0, -l.playerSkillDeltas.xp), 0);
    const totalHpSpent = logs.reduce((s, l) => s + Math.max(0, -l.netTurnDeltas.hp), 0);
    const peakRisk = logs.reduce(
      (mx, l) => Math.max(mx, l.before.risk, l.afterTurnComplete.risk),
      state.resources.risk
    );

    const catCounts: Record<SkillCategory, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    logs.forEach((l) => {
      catCounts[l.skillCategory] = (catCounts[l.skillCategory] || 0) + 1;
    });

    const bestLog = [...logs].sort(
      (a, b) => a.playerSkillDeltas.pressure - b.playerSkillDeltas.pressure
    )[0];
    const costliestLog = [...logs].sort(
      (a, b) =>
        Math.abs(b.playerSkillDeltas.xp) +
        Math.max(0, -b.playerSkillDeltas.hp) +
        Math.max(0, b.playerSkillDeltas.risk) -
        (Math.abs(a.playerSkillDeltas.xp) +
          Math.max(0, -a.playerSkillDeltas.hp) +
          Math.max(0, a.playerSkillDeltas.risk))
    )[0];

    const repSeries = [
      50,
      ...logs.map((l) => l.afterTurnComplete.reputation),
    ];
    const trustSeries =
      logs.length > 0
        ? [logs[0].before.trust, ...logs.map((l) => l.afterTurnComplete.trust)]
        : [40];

    return {
      totalTurns: logs.length,
      totalXpSpent,
      totalHpSpent,
      peakRisk,
      catCounts,
      bestLog,
      costliestLog,
      repSeries,
      trustSeries,
    };
  }, [logs, state.resources.risk]);

  // Item 11: Counterfactual comparison on the most pivotal/final played stage
  const autoWhatIf = useMemo(() => {
    if (!endSum) return null;
    const playedStages = ([6, 5, 4, 3, 2, 1] as StageNumber[]).filter(
      (s) => (state.stageSnapshots[s]?.chosenSkillSequence.length || 0) > 0
    );
    if (playedStages.length === 0) return null;
    const targetStg = playedStages[0];
    const altPol = endSum.archetypeId === 'type_crisis_master' ? 'big_budget' : 'transparent_remedy';
    return runWhatIfFullStrategy(state, targetStg, altPol);
  }, [state, endSum]);

  if (!endSum) return null;

  const endDef = ENDINGS[endSum.endingId];
  const archDef = PR_ARCHETYPES[endSum.archetypeId];
  const scaleDef = COMPANY_SCALES[state.company.scale];
  const indDef = INDUSTRIES[state.company.industry];
  const viralDiag = buildEndingViralDiagnosis(state);

  const handleViralChallengeShare = async () => {
    sound.playClick();
    const payload = buildEndingSharePayload(state, isEn);
    await shareOrCopyChallenge(payload, state.playId);
    setViralFeedback('challenge');
    window.setTimeout(() => setViralFeedback(null), 3200);
  };

  const handleCopyViralReport = async () => {
    sound.playClick();
    const payload = buildEndingSharePayload(state, isEn);
    trackFunnelStep('share', state.playId);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
    }
    setViralFeedback('copy');
    window.setTimeout(() => setViralFeedback(null), 3200);
  };

  const renderLineSvg = (values: number[], strokeColor: string) => {
    const w = 440;
    const h = 115;
    const px = 26;
    const py = 14;
    const iw = w - px * 2;
    const ih = h - py * 2;
    const pts = values
      .map((v, i) => {
        const x = values.length <= 1 ? px + iw / 2 : px + (i / (values.length - 1)) * iw;
        const y = py + ((100 - Math.max(0, Math.min(100, v))) / 100) * ih;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28 bg-slate-950 rounded border border-slate-800">
        <line x1={px} y1={py + ih / 2} x2={w - px} y2={py + ih / 2} stroke="#334155" strokeDasharray="3 3" />
        <polyline fill="none" stroke={strokeColor} strokeWidth={2.8} points={pts} />
      </svg>
    );
  };

  const timelineLogs = logs.filter((l) => l.stage === selectedTimelineStage);
  const timelineHist = state.stageHistory.find((h) => h.stage === selectedTimelineStage);

  return (
    <div className="space-y-5">
      {/* Personal Run Completion Badge (Personnel Craft Design Consistency) */}
      {finishedCount > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-pixel shadow-sm select-none">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">
              {isEn ? 'My Simulation Record:' : '나의 시뮬레이션 도전 기록:'}
            </span>
            <span className="font-bold text-amber-300">
              {isEn ? `Run #${finishedCount} Completed` : `제${finishedCount}회차 완주`}
            </span>
          </div>
        </div>
      )}

      {/* 1. Ending Story & PR Chief Archetype Hero Card */}
      <div
        className={`pixel-card p-5 sm:p-6 space-y-4 relative overflow-hidden ${
          endDef.isVictory ? 'border-amber-400' : 'border-rose-500'
        }`}
      >
        {/* Personnel Craft Newspaper Stamp Accent */}
        <div
          className={`hidden sm:inline-block absolute top-4 right-5 newspaper-stamp text-xs ${
            endDef.isVictory ? 'stamp-green' : ''
          }`}
        >
          {endDef.isVictory
            ? isEn
              ? 'CRISIS CLEARED'
              : '위기방어 완주'
            : isEn
              ? 'HEADLINE HIT'
              : '단독보도 직격'}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 rounded font-pixel text-xs font-bold border ${
                  endDef.isHidden
                    ? 'bg-purple-950 border-purple-400 text-purple-200'
                    : endDef.isVictory
                      ? 'bg-amber-950 border-amber-400 text-amber-300'
                      : 'bg-rose-950 border-rose-500 text-rose-300'
                }`}
              >
                {isEn ? endDef.badgeEn : endDef.badgeKo}
              </span>
              <span className="text-xs font-pixel text-slate-400">
                {state.player.companyName} ({isEn ? `${scaleDef.nameEn} · ${indDef.nameEn}` : `${scaleDef.nameKo} · ${indDef.nameKo}`})
              </span>
            </div>
            <h2 className="font-pixel text-xl sm:text-2xl text-white font-extrabold">
              {isEn ? endDef.titleEn : endDef.titleKo}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200 font-medium">
              {isEn ? endDef.subtitleEn : endDef.subtitleKo}
            </p>
          </div>

          {/* Action CTA Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onOpenShareCard();
              }}
              className="pixel-btn-mc pixel-btn-mc-gold px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Share Card (PNG)' : '공유 카드 저장'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenBambooWithEnding();
              }}
              className="pixel-btn-mc px-3.5 py-2 text-xs font-bold bg-emerald-800 border-emerald-400 text-white flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>{isEn ? 'Post to Bamboo Grove' : '대나무숲에 소감 남기기'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/90 p-4 rounded-lg border border-slate-800">
          {isEn ? endDef.storyEn : endDef.storyKo}
        </p>

        <div className="text-xs sm:text-sm font-pixel text-amber-300 italic text-center py-1">
          {isEn ? endDef.quoteEn : endDef.quoteKo}
        </div>

        {/* Item 12: PR Chief Style Card */}
        <div className="bg-slate-900/95 border-2 border-amber-500/60 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="text-3xl bg-slate-950 p-2.5 rounded-lg border border-slate-700">
              {archDef.icon}
            </div>
            <div>
              <div className="text-[11px] font-pixel text-amber-400">
                ⑫ {isEn ? 'YOUR PR CHIEF ARCHETYPE (1 OF 8)' : '나의 홍보팀장 유형 판정 (8종 중 1종)'}
              </div>
              <div className="font-pixel text-base sm:text-lg text-white font-bold">
                {isEn ? archDef.nameEn : archDef.nameKo}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isEn ? archDef.descEn : archDef.descKo}
              </p>
            </div>
          </div>

          <div className="text-right font-pixel text-xs shrink-0 space-y-0.5">
            <div className="text-sky-300">
              {isEn ? 'Trusted Reporters:' : '신뢰 확보 기자:'} <b>{endSum.trustedCount}</b>
            </div>
            <div className="text-rose-300">
              {isEn ? 'Hostile Reporters:' : '적대 돌아선 기자:'} <b>{endSum.hostileCount}</b>
            </div>
          </div>
        </div>

        {/* Viral One-Line Report Card & Same-Seed Friend Challenge */}
        <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-rose-950/80 border-2 border-rose-400/75 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-pixel text-xs text-amber-300 font-bold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>
                {isEn
                  ? 'SHAREABLE REPORT CARD & SAME-SEED CHALLENGE'
                  : '나의 홍담 한줄 성적표 & 동일 조건 친구 도전장'}
              </span>
            </span>
            <span className="font-pixel text-[10px] text-slate-400">
              Seed #{state.seed} · {isEn ? scaleDef.nameEn : scaleDef.nameKo}
            </span>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded p-3 space-y-1.5 text-xs">
            <div className="font-pixel text-white font-bold text-sm">
              {isEn
                ? `You are ‘${archDef.nameEn}’ among the 8 PR Chief types.`
                : `당신은 8가지 홍보팀장 중 ‘${archDef.nameKo}’ 입니다.`}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 font-pixel text-[11px] text-slate-300">
              <span>
                {isEn ? 'Crisis Defense:' : '언론 대응 성공률:'}{' '}
                <b className="text-amber-300">{viralDiag.defenseRatePct}%</b> ({viralDiag.clearedCount}/6)
              </span>
              <span>·</span>
              <span>
                {isEn ? 'Press Rapport:' : '기자와의 관계:'}{' '}
                <b className="text-emerald-300">{isEn ? viralDiag.pressTierEn : viralDiag.pressTierKo}</b>
              </span>
              <span>·</span>
              <span>
                {isEn ? 'Public Trust:' : '기업 평판:'}{' '}
                <b className="text-sky-300">{isEn ? viralDiag.repTierEn : viralDiag.repTierKo}</b>
              </span>
            </div>
            <p className="text-amber-200 font-medium pt-0.5">
              “{isEn ? viralDiag.punchlineEn : viralDiag.punchlineKo}”
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={handleViralChallengeShare}
              className="pixel-btn-mc pixel-btn-mc-primary flex-1 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {viralFeedback === 'challenge' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isEn ? 'Challenge Link Ready!' : '도전장 링크 공유·복사 완료!'}
                  </span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>
                    {isEn
                      ? 'Challenge a Friend (Exact Same Company & Reporters)'
                      : '🔥 같은 회사·같은 기자로 친구에게 도전장 보내기'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyViralReport}
              className="pixel-btn-mc px-3.5 py-2.5 text-xs font-bold text-slate-100 border-slate-500 flex items-center justify-center gap-1.5"
            >
              {viralFeedback === 'copy' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isEn ? 'Copied!' : '성적표 복사됨!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-300" />
                  <span>{isEn ? 'Copy Report Text' : '성적표 문구 복사'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. DATA JOURNALISM COMPREHENSIVE REPORT (Section 6) */}
      <div className="pixel-card p-5 sm:p-6 border-indigo-400 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-[11px] font-pixel text-indigo-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? 'PERSONAL DATA JOURNALISM FINAL REPORT'
                  : '개인 데이터저널리즘 종합 리포트'}
              </span>
            </div>
            <h3 className="font-pixel text-lg sm:text-xl text-white font-extrabold mt-0.5">
              {isEn
                ? '“How You Fought Through Six Media Crises — By The Numbers”'
                : '“당신은 어떻게 6번의 언론 위기를 살아남았나”'}
            </h3>
          </div>

          <button
            onClick={onOpenMethodology}
            className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-pixel text-sky-300 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isEn ? 'Methodology ⓘ' : '분석 기준 ⓘ'}</span>
          </button>
        </div>

        {/* Metrics 1 ~ 5 Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-pixel">
          <div className="pixel-slot p-3">
            <div className="text-[10px] text-slate-400">① {isEn ? 'Crises / Turns' : '대응 사건·턴 수'}</div>
            <div className="text-base font-bold text-white mt-0.5">
              {state.stageHistory.length || 1} {isEn ? 'Stg' : '개'} / {metrics.totalTurns}T
            </div>
          </div>
          <div className="pixel-slot p-3">
            <div className="text-[10px] text-slate-400">② {isEn ? 'Total Skills Used' : '총 스킬 사용 횟수'}</div>
            <div className="text-base font-bold text-sky-300 mt-0.5">
              {metrics.totalTurns}{isEn ? ' actions' : '회'}
            </div>
          </div>
          <div className="pixel-slot p-3">
            <div className="text-[10px] text-slate-400">③ {isEn ? 'Total XP Spent' : '총 홍보예산 소모'}</div>
            <div className="text-base font-bold text-amber-300 mt-0.5">
              {metrics.totalXpSpent} XP
            </div>
          </div>
          <div className="pixel-slot p-3">
            <div className="text-[10px] text-slate-400">④ {isEn ? 'Total HP Spent' : '총 체력 소모량'}</div>
            <div className="text-base font-bold text-emerald-300 mt-0.5">
              {metrics.totalHpSpent} HP
            </div>
          </div>
          <div className="pixel-slot p-3 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400">⑤ {isEn ? 'Peak Backlash RISK' : '최고 RISK 도달치'}</div>
            <div className="text-base font-bold text-rose-400 mt-0.5">
              {metrics.peakRisk} / 100
            </div>
          </div>
        </div>

        {/* Item 2: Skill Category Distribution */}
        <div className="pixel-slot p-3.5 space-y-2">
          <div className="text-xs font-pixel text-slate-200 font-bold">
            ② {isEn ? 'PR Skill Category Distribution' : '사용한 홍보 스킬 계열 분포 (실제 로그 집계)'}
          </div>
          <div className="grid grid-cols-5 gap-2 text-center font-pixel text-xs">
            {(['A', 'B', 'C', 'D', 'E'] as SkillCategory[]).map((cat) => {
              const cnt = metrics.catCounts[cat];
              const pct = metrics.totalTurns > 0 ? Math.round((cnt / metrics.totalTurns) * 100) : 0;
              return (
                <div key={cat} className="bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="text-[11px] text-slate-300">
                    {SKILL_CATEGORIES[cat].icon} {cat}
                  </div>
                  <div className="text-sm font-bold text-amber-300 mt-0.5">
                    {cnt}{isEn ? 'x' : '회'} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items 6 & 7: Corporate Reputation & Reporter Trust Curves */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="pixel-slot p-3 space-y-1.5">
            <div className="flex justify-between text-xs font-pixel">
              <span className="text-sky-300 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                ⑥ {isEn ? 'Corporate Reputation Trajectory' : '기업 평판 변화 그래프 (전체 턴)'}
              </span>
              <span className="text-white font-bold">50 → {state.resources.reputation}</span>
            </div>
            {renderLineSvg(metrics.repSeries, '#38bdf8')}
          </div>

          <div className="pixel-slot p-3 space-y-1.5">
            <div className="flex justify-between text-xs font-pixel">
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                ⑦ {isEn ? 'Lead Journalist Trust Trajectory' : '담당 기자 신뢰(친밀도) 변화 그래프'}
              </span>
              <span className="text-white font-bold">
                {metrics.trustSeries[metrics.trustSeries.length - 1]}/100
              </span>
            </div>
            {renderLineSvg(metrics.trustSeries, '#10b981')}
          </div>
        </div>

        {/* Items 9, 10, 11: Best Move, Costliest Move, Auto Counterfactual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="pixel-slot p-3.5 border-emerald-600/60 space-y-1">
            <div className="font-pixel text-[11px] text-emerald-300 font-bold">
              ⑨ {isEn ? 'Most Effective Single Move' : '가장 효과적이었던 결정적 한 수'}
            </div>
            {metrics.bestLog ? (
              <>
                <div className="font-pixel text-sm text-white font-bold">
                  STAGE {metrics.bestLog.stage} · {metrics.bestLog.stageTurn}T [
                  {isEn
                    ? PR_SKILLS_BY_ID[metrics.bestLog.skillId]?.nameEn
                    : PR_SKILLS_BY_ID[metrics.bestLog.skillId]?.nameKo}
                  ]
                </div>
                <p className="text-slate-300 text-[11px]">
                  {isEn
                    ? `Cut press pressure by ${metrics.bestLog.playerSkillDeltas.pressure}%p against ${metrics.bestLog.journalistNameEn}.`
                    : `${metrics.bestLog.journalistNameKo} 상대로 보도 압박을 단숨에 ${metrics.bestLog.playerSkillDeltas.pressure}%p 낮췄습니다.`}
                </p>
              </>
            ) : (
              <p className="text-slate-500">{isEn ? 'No actions taken.' : '행동 기록 없음'}</p>
            )}
          </div>

          <div className="pixel-slot p-3.5 border-rose-600/60 space-y-1">
            <div className="font-pixel text-[11px] text-rose-300 font-bold">
              ⑩ {isEn ? 'Costliest / Highest-Burden Move' : '가장 비용·부담이 컸던 선택'}
            </div>
            {metrics.costliestLog ? (
              <>
                <div className="font-pixel text-sm text-white font-bold">
                  STAGE {metrics.costliestLog.stage} · {metrics.costliestLog.stageTurn}T [
                  {isEn
                    ? PR_SKILLS_BY_ID[metrics.costliestLog.skillId]?.nameEn
                    : PR_SKILLS_BY_ID[metrics.costliestLog.skillId]?.nameKo}
                  ]
                </div>
                <p className="text-slate-300 text-[11px]">
                  XP {metrics.costliestLog.playerSkillDeltas.xp}, HP {metrics.costliestLog.playerSkillDeltas.hp}, RISK{' '}
                  {metrics.costliestLog.playerSkillDeltas.risk >= 0
                    ? `+${metrics.costliestLog.playerSkillDeltas.risk}`
                    : metrics.costliestLog.playerSkillDeltas.risk}
                </p>
              </>
            ) : (
              <p className="text-slate-500">{isEn ? 'No actions taken.' : '행동 기록 없음'}</p>
            )}
          </div>

          <div className="pixel-slot p-3.5 border-amber-500/60 space-y-1">
            <div className="font-pixel text-[11px] text-amber-300 font-bold">
              ⑪ {isEn ? 'Counterfactual Strategy Benchmark' : '다른 전략을 택했을 경우의 가상 비교'}
            </div>
            {autoWhatIf ? (
              <>
                <div className="font-pixel text-xs text-white font-bold">
                  STAGE {autoWhatIf.stage}: {isEn ? autoWhatIf.counterfactual.labelEn : autoWhatIf.counterfactual.labelKo}
                </div>
                <p className="text-slate-300 text-[11px]">
                  {isEn
                    ? `Actual Rep ${autoWhatIf.actual.carryOverResources.reputation} vs Alt Rep ${autoWhatIf.counterfactual.carryOverResources.reputation} (Seed #${autoWhatIf.seedUsed}).`
                    : `실제 평판 ${autoWhatIf.actual.carryOverResources.reputation} vs 대안 전략 평판 ${autoWhatIf.counterfactual.carryOverResources.reputation} (동일 시드 #${autoWhatIf.seedUsed}).`}
                </p>
                <button
                  onClick={() => onOpenWhatIf(autoWhatIf.stage)}
                  className="text-[11px] font-pixel text-amber-300 underline hover:text-amber-200"
                >
                  {isEn ? 'Open Interactive WHAT IF Explorer →' : '턴별 WHAT IF 직접 실험하기 →'}
                </button>
              </>
            ) : (
              <p className="text-slate-500">{isEn ? 'No stage snapshot recorded.' : '비교할 스테이지 기록 없음'}</p>
            )}
          </div>
        </div>

        {/* Item 8 + Interactive 6-Stage Chronological Timeline */}
        <div className="pixel-slot p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-pixel text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                ⑧ {isEn ? 'INTERACTIVE 6-STAGE CRISIS TIMELINE (Click Stage)' : '6개 스테이지 인터랙티브 타임라인 (클릭하여 상세 열람)'}
              </span>
            </div>
          </div>

          {/* 6 Stage Stepper Nodes */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([1, 2, 3, 4, 5, 6] as StageNumber[]).map((stg) => {
              const hist = state.stageHistory.find((h) => h.stage === stg);
              const hasLogs = logs.some((l) => l.stage === stg);
              const isSel = selectedTimelineStage === stg;
              return (
                <button
                  key={stg}
                  onClick={() => {
                    sound.playBlip();
                    setSelectedTimelineStage(stg);
                  }}
                  className={`p-2 rounded border text-left font-pixel transition-all ${
                    isSel
                      ? 'bg-indigo-950 border-amber-400 ring-1 ring-amber-400'
                      : hasLogs
                        ? 'bg-slate-900 border-slate-700 hover:border-slate-500'
                        : 'bg-slate-950/50 border-slate-800/60 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">STAGE {stg}</span>
                    {hist && (
                      <span
                        className={`font-bold ${
                          hist.grade === 'F' ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {hist.grade}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white font-bold truncate mt-0.5">
                    {isEn ? STAGES[stg].themeBadgeEn : STAGES[stg].themeBadgeKo}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Turn-by-Turn Drilldown */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
            {timelineLogs.length === 0 ? (
              <div className="text-slate-500 font-pixel py-3 text-center">
                {isEn
                  ? `STAGE ${selectedTimelineStage} was not reached in this playthrough.`
                  : `이번 플레이에서는 STAGE ${selectedTimelineStage}에 도달하기 전에 종료되었습니다.`}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 font-pixel">
                  <div>
                    <span className="text-amber-300 font-bold">
                      STAGE {selectedTimelineStage}:{' '}
                      {isEn ? timelineLogs[0].headlineEn : timelineLogs[0].headlineKo}
                    </span>
                    <div className="text-[11px] text-slate-400">
                      {isEn ? timelineLogs[0].journalistNameEn : timelineLogs[0].journalistNameKo}
                    </div>
                  </div>
                  {timelineHist && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 text-[11px]">
                      {isEn
                        ? STAGE_RESOLUTION_META[timelineHist.resolution].nameEn
                        : STAGE_RESOLUTION_META[timelineHist.resolution].nameKo}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {timelineLogs.map((tl) => {
                    const sk = PR_SKILLS_BY_ID[tl.skillId];
                    return (
                      <div
                        key={tl.id}
                        className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 font-pixel text-[11px]"
                      >
                        <span className="text-white">
                          <b>{tl.stageTurn}T</b> · [{isEn ? sk?.nameEn : sk?.nameKo}]
                          {tl.suddenEventTriggered && (
                            <span className="text-amber-300 ml-2">
                              ⚡ {isEn ? tl.suddenEventTitleEn : tl.suddenEventTitleKo}
                            </span>
                          )}
                        </span>
                        <span className="text-slate-300">
                          {isEn ? 'Pressure' : '압박'} {tl.before.pressure}%→<b>{tl.afterTurnComplete.pressure}%</b> · XP{' '}
                          {tl.netTurnDeltas.xp >= 0 ? `+${tl.netTurnDeltas.xp}` : tl.netTurnDeltas.xp} · HP{' '}
                          {tl.netTurnDeltas.hp >= 0 ? `+${tl.netTurnDeltas.hp}` : tl.netTurnDeltas.hp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <div className="flex flex-wrap gap-2">
            {autoWhatIf && (
              <button
                onClick={() => onOpenWhatIf(autoWhatIf.stage)}
                className="pixel-btn-mc px-4 py-2.5 text-xs font-bold text-amber-200 border-amber-500 flex items-center gap-1.5"
              >
                <GitBranch className="w-4 h-4 text-amber-400" />
                <span>{isEn ? 'Explore WHAT IF' : 'WHAT IF 반사실 실험실'}</span>
              </button>
            )}

            <button
              onClick={onOpenDataLab}
              className="pixel-btn-mc px-4 py-2.5 text-xs font-bold text-indigo-200 border-indigo-500 flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>{isEn ? 'Open HONGDAM DATA LAB' : '홍담 데이터랩 통계학 보기'}</span>
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="pixel-btn-mc pixel-btn-mc-primary px-6 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isEn ? 'Start New PR Career!' : '새 홍보팀장으로 다시 도전!'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
