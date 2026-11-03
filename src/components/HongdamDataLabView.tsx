import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Building2,
  Compass,
  Filter,
  Flame,
  RefreshCw,
  Scale,
  Users,
  Zap,
} from 'lucide-react';
import { COMPANY_SCALE_LIST } from '../data/companies';
import {
  PAC_2023_MEDIA_SHARES,
  PAC_2024_CLAIM_TYPES,
  PAC_ANNUAL_TREND,
} from '../data/empiricalPressData';
import { JOURNALIST_ARCHETYPE_LIST, JOURNALIST_ARCHETYPES } from '../data/journalists';
import { SKILL_CATEGORIES } from '../data/skills';
import { STAGES } from '../data/stages';
import {
  computeJournalistLabMetrics,
  computeSkillEfficiencyBubbles,
  computeStageCrisisProfiles,
  SkillBubbleDatum,
  STRATEGY_POLICY_META,
} from '../engine/analyticsEngine';
import { useLanguage } from '../i18n/LanguageContext';
import {
  CompanyScaleId,
  JournalistArchetypeId,
  MonteCarloResult,
  SkillCategory,
  StageNumber,
  StrategyPolicyId,
} from '../types/game';
import { sound } from '../utils/sound';
import { runMonteCarloAsync } from '../workers/mcClient';

interface HongdamDataLabViewProps {
  onBackToGame: () => void;
  onOpenMethodology: () => void;
}

type LabTabId =
  | 'A_journalists'
  | 'B_skills'
  | 'C_scales'
  | 'D_stages'
  | 'E_strategies'
  | 'F_empirical';

export const HongdamDataLabView: React.FC<HongdamDataLabViewProps> = ({
  onBackToGame,
  onOpenMethodology,
}) => {
  const { isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState<LabTabId>('A_journalists');

  // Section A states
  const journalistMetrics = useMemo(() => computeJournalistLabMetrics(), []);
  const [selectedJournalistId, setSelectedJournalistId] = useState<JournalistArchetypeId>('fact_checker');

  // Section B states
  const [bubbleArchetype, setBubbleArchetype] = useState<JournalistArchetypeId | 'all'>('all');
  const [bubbleStage, setBubbleStage] = useState<StageNumber>(3);
  const [bubbleScale, setBubbleScale] = useState<CompanyScaleId>('midsize');
  const [selectedBubble, setSelectedBubble] = useState<SkillBubbleDatum | null>(null);

  const skillBubbles = useMemo(
    () => computeSkillEfficiencyBubbles(bubbleArchetype, bubbleStage, bubbleScale),
    [bubbleArchetype, bubbleStage, bubbleScale]
  );

  // Section C states (Corporate Scale Monte Carlo)
  const [scalePolicy, setScalePolicy] = useState<StrategyPolicyId>('transparent_remedy');
  const [scaleIter, setScaleIter] = useState<300 | 1000>(300);
  const [scaleMcMap, setScaleMcMap] = useState<Record<string, MonteCarloResult>>({});
  const [scaleLoading, setScaleLoading] = useState(false);

  // Section D state
  const [stageProfileScale, setStageProfileScale] = useState<CompanyScaleId>('midsize');
  const stageProfiles = useMemo(
    () => computeStageCrisisProfiles(stageProfileScale),
    [stageProfileScale]
  );

  // Section E states (6 Virtual Strategies Monte Carlo)
  const [stratScale, setStratScale] = useState<CompanyScaleId>('midsize');
  const [stratIter, setStratIter] = useState<300 | 1000>(300);
  const [stratMcMap, setStratMcMap] = useState<Record<string, MonteCarloResult>>({});
  const [stratLoading, setStratLoading] = useState(false);

  const runScalesComparison = async (pol: StrategyPolicyId, iters: number) => {
    setScaleLoading(true);
    try {
      const res = await runMonteCarloAsync({
        kind: 'scales_compare',
        strategyPolicy: pol,
        iterations: iters,
        seed: 20261103,
        experienceYears: 7,
      });
      if (res.multiResults) setScaleMcMap(res.multiResults);
    } finally {
      setScaleLoading(false);
    }
  };

  const runStrategiesComparison = async (sc: CompanyScaleId, iters: number) => {
    setStratLoading(true);
    try {
      const res = await runMonteCarloAsync({
        kind: 'strategies_compare',
        companyScale: sc,
        strategyPolicy: 'transparent_remedy',
        iterations: iters,
        seed: 20261103,
        experienceYears: 7,
      });
      if (res.multiResults) setStratMcMap(res.multiResults);
    } finally {
      setStratLoading(false);
    }
  };

  const handleSelectTab = (tabId: LabTabId) => {
    sound.playBlip();
    setActiveTab(tabId);
    if (tabId === 'C_scales' && Object.keys(scaleMcMap).length === 0) {
      runScalesComparison(scalePolicy, scaleIter);
    }
    if (tabId === 'E_strategies' && Object.keys(stratMcMap).length === 0) {
      runStrategiesComparison(stratScale, stratIter);
    }
  };

  // Radar Chart Helper for Section A
  const selectedJMetric =
    journalistMetrics.find((m) => m.id === selectedJournalistId) || journalistMetrics[0];
  const selectedJDef = JOURNALIST_ARCHETYPES[selectedJMetric.id];

  const renderRadarChart = () => {
    const cx = 140;
    const cy = 135;
    const maxR = 88;
    const axes = [
      { label: isEn ? 'Report' : '취재력', val: selectedJMetric.reportingPower },
      { label: isEn ? 'Persist' : '집요함', val: selectedJMetric.persistence },
      { label: isEn ? 'Expert' : '전문성', val: selectedJMetric.expertise },
      { label: isEn ? 'Network' : '정보망', val: selectedJMetric.sourceNetwork },
      { label: isEn ? 'Resist' : '스킬저항', val: selectedJMetric.skillResistance },
      { label: isEn ? 'TrustDiff' : '신뢰난이도', val: selectedJMetric.trustDifficulty },
    ];

    const getPt = (idx: number, ratio: number) => {
      const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / axes.length;
      return {
        x: cx + Math.cos(angle) * maxR * ratio,
        y: cy + Math.sin(angle) * maxR * ratio,
      };
    };

    const poly = axes
      .map((a, idx) => {
        const p = getPt(idx, a.val / 100);
        return `${p.x},${p.y}`;
      })
      .join(' ');

    return (
      <svg viewBox="-24 0 328 270" className="w-full max-w-[300px] mx-auto">
        {[0.25, 0.5, 0.75, 1.0].map((ring) => (
          <polygon
            key={ring}
            points={axes
              .map((_, idx) => {
                const p = getPt(idx, ring);
                return `${p.x},${p.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
          />
        ))}
        {axes.map((a, idx) => {
          const outer = getPt(idx, 1.0);
          const lbl = getPt(idx, 1.24);
          return (
            <g key={a.label}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#334155" strokeWidth={1} />
              <text
                x={lbl.x}
                y={lbl.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#cbd5e1"
                fontSize="10"
                fontWeight="bold"
              >
                {a.label} ({a.val})
              </text>
            </g>
          );
        })}
        <polygon
          points={poly}
          fill="rgba(244, 63, 94, 0.32)"
          stroke="#fb7185"
          strokeWidth={2.5}
        />
      </svg>
    );
  };

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 space-y-4">
      {/* Header Banner */}
      <div className="pixel-card p-4 sm:p-5 border-indigo-500/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-400 font-pixel text-[11px] text-indigo-200 font-bold">
              📊 A Data Journalism-Inspired Interactive Simulation
            </span>
            <span className="text-[11px] font-pixel text-amber-300">
              {isEn ? 'Explore freely without playing!' : '게임 플레이 전·후 언제든 자유 탐색 가능'}
            </span>
          </div>
          <h2 className="font-pixel text-lg sm:text-2xl text-white font-extrabold mt-1">
            {isEn
              ? 'HONGDAM DATA LAB — The Numbers Behind PR Survival'
              : '홍담 데이터랩 — 기사 막기의 통계학'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEn
              ? 'Quantitative analysis of 12 fictional journalist archetypes, 20 core PR skills, 5 corporate scales, 6 crisis stages, and 6 strategy models.'
              : '가상 시뮬레이션 규칙 아래에서 작동하는 12종 기자 상성, 20종 핵심 홍보 스킬 효율, 5대 기업 규모, 6대 위기 난이도, 6대 대응 전략의 정량 분석실입니다.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playBlip();
              onOpenMethodology();
            }}
            className="pixel-btn-mc px-3 py-2 text-xs text-sky-200 border-sky-500 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>{isEn ? 'Model Info ⓘ' : '가상 모형 설명 ⓘ'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onBackToGame();
            }}
            className="pixel-btn-mc pixel-btn-mc-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEn ? 'Back to PR Arena' : '게임 화면으로'}</span>
          </button>
        </div>
      </div>

      {/* 5 Analytical Section Tabs (A ~ E) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          {
            id: 'A_journalists' as const,
            icon: Users,
            ko: 'A. 기자 12유형 분석',
            en: 'A. 12 Reporter Types',
          },
          {
            id: 'B_skills' as const,
            icon: Zap,
            ko: 'B. 20스킬 버블 효율',
            en: 'B. 20 Skills Bubble',
          },
          {
            id: 'C_scales' as const,
            icon: Building2,
            ko: 'C. 기업 규모별 생존',
            en: 'C. 5 Company Scales',
          },
          {
            id: 'D_stages' as const,
            icon: Flame,
            ko: 'D. 6스테이지 위험도',
            en: 'D. 6 Crisis Stages',
          },
          {
            id: 'E_strategies' as const,
            icon: Compass,
            ko: 'E. 6대 전략 생존곡선',
            en: 'E. 6 Strategy Curves',
          },
          {
            id: 'F_empirical' as const,
            icon: Scale,
            ko: 'F. 현실 언론분쟁 실증 통계',
            en: 'F. Real Press Dispute Data',
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleSelectTab(t.id)}
              className={`px-3.5 py-2 rounded-lg font-pixel text-xs whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-indigo-600 text-white border-indigo-300 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isEn ? t.en : t.ko}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== SECTION A: 12 JOURNALIST ARCHETYPES ==================== */}
      {activeTab === 'A_journalists' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Radar & Profile Inspector */}
          <div className="lg:col-span-5 pixel-card p-4 space-y-3">
            <div className="font-pixel text-sm text-rose-300 font-bold">
              {isEn ? '6-Axis Journalist Capability Radar' : '기자 유형별 6축 특성 레이더 차트'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {JOURNALIST_ARCHETYPE_LIST.map((arch) => (
                <button
                  key={arch.id}
                  onClick={() => {
                    sound.playBlip();
                    setSelectedJournalistId(arch.id);
                  }}
                  className={`p-1.5 rounded border text-left font-pixel text-[11px] flex items-center gap-1 ${
                    selectedJournalistId === arch.id
                      ? 'bg-rose-950 border-rose-400 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{arch.badgeIcon}</span>
                  <span className="truncate">{isEn ? arch.nameEn : arch.nameKo}</span>
                </button>
              ))}
            </div>

            {renderRadarChart()}

            <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-pixel">
                <span className="text-white font-bold">
                  {selectedJDef.badgeIcon} {isEn ? selectedJDef.nameEn : selectedJDef.nameKo}
                </span>
                <span className="text-amber-300">
                  {isEn ? `Difficulty ${selectedJMetric.overallDifficulty}` : `종합 난이도 ${selectedJMetric.overallDifficulty}`}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {isEn ? selectedJDef.personalityEn : selectedJDef.personalityKo}
              </p>
              <p className="text-[11px] text-rose-300">
                ⚡ {isEn ? `Special Trait: ${selectedJDef.specialAbilityEn}` : `고유 특성: ${selectedJDef.specialAbilityKo}`}
              </p>
              <p className="text-[11px] text-sky-300">
                💡 {isEn ? selectedJDef.culturalNoteEn : `핵심 공략: 상성 히트맵에서 초록색(1.15x↑) 계열 스킬을 구사하세요.`}
              </p>
            </div>
          </div>

          {/* 12 x 5 Skill Category Affinity/Resistance Heatmap */}
          <div className="lg:col-span-7 pixel-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-pixel text-sm text-amber-300 font-bold">
                {isEn
                  ? '12 Journalists × 5 PR Skill Categories Affinity Heatmap'
                  : '12개 기자 유형 × 5대 홍보 스킬 계열 상성·저항도 히트맵'}
              </div>
              <span className="text-[10px] font-pixel text-slate-400">
                {isEn ? '>1.0x Favorable · <0.85x Resistant' : '1.0x 초과 유리 · 0.85x 미만 강한 저항'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-pixel border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-300 bg-slate-900">
                    <th className="p-2 text-left">{isEn ? 'Journalist Archetype' : '기자 유형'}</th>
                    {(['A', 'B', 'C', 'D', 'E'] as SkillCategory[]).map((cat) => (
                      <th key={cat} className="p-2 text-center">
                        {SKILL_CATEGORIES[cat].icon} {cat}
                      </th>
                    ))}
                    <th className="p-2 text-right">{isEn ? 'Diff' : '난이도'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {journalistMetrics.map((jm) => (
                    <tr
                      key={jm.id}
                      onClick={() => setSelectedJournalistId(jm.id)}
                      className={`cursor-pointer transition-colors ${
                        selectedJournalistId === jm.id ? 'bg-slate-800/80' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <td className="p-2 text-white font-bold whitespace-nowrap">
                        {jm.badgeIcon} {isEn ? jm.nameEn : jm.nameKo}
                      </td>
                      {(['A', 'B', 'C', 'D', 'E'] as SkillCategory[]).map((cat) => {
                        const mult = jm.categoryMultiplierAvg[cat];
                        const cellCls =
                          mult >= 1.15
                            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                            : mult >= 0.98
                              ? 'bg-slate-900 text-slate-200 border-slate-800'
                              : mult >= 0.8
                                ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                                : 'bg-rose-950/90 text-rose-300 border-rose-700';
                        return (
                          <td key={cat} className="p-1 text-center">
                            <span className={`inline-block w-14 py-0.5 rounded border text-[11px] ${cellCls}`}>
                              {mult.toFixed(2)}x
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-2 text-right text-amber-300 font-bold">{jm.overallDifficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION B: 20 CORE PR SKILLS BUBBLE CHART ==================== */}
      {activeTab === 'B_skills' && (
        <div className="pixel-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="font-pixel text-sm sm:text-base text-amber-300 font-bold flex items-center gap-1.5">
                <Filter className="w-4 h-4" />
                <span>
                  {isEn
                    ? '20 Core PR Skills Cost–Effectiveness Bubble Explorer'
                    : '20종 핵심 홍보 스킬 비용 대비 기대효과 버블 차트'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'X-Axis: XP Cost · Y-Axis: Expected Persuasion/Tactical Score · Bubble Size: HP Stamina Cost · Color: RISK Delta'
                  : '가로축(X): XP 예산 소모 · 세로축(Y): 기대 대응 효과 · 버블 크기: 체력(HP) 소모 · 색상: 역풍 위험(RISK)'}
              </p>
            </div>

            {/* 3 Live Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-pixel">
              <select
                value={bubbleArchetype}
                onChange={(e) => setBubbleArchetype(e.target.value as JournalistArchetypeId | 'all')}
                className="voxel-input text-xs py-1.5"
              >
                <option value="all">{isEn ? 'All 12 Reporters (Avg)' : '전체 12종 기자 평균'}</option>
                {JOURNALIST_ARCHETYPE_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.badgeIcon} {isEn ? a.nameEn : a.nameKo}
                  </option>
                ))}
              </select>

              <select
                value={bubbleStage}
                onChange={(e) => setBubbleStage(Number(e.target.value) as StageNumber)}
                className="voxel-input text-xs py-1.5"
              >
                {([1, 2, 3, 4, 5, 6] as StageNumber[]).map((stg) => (
                  <option key={stg} value={stg}>
                    STAGE {stg}: {isEn ? STAGES[stg].themeBadgeEn : STAGES[stg].themeBadgeKo}
                  </option>
                ))}
              </select>

              <select
                value={bubbleScale}
                onChange={(e) => setBubbleScale(e.target.value as CompanyScaleId)}
                className="voxel-input text-xs py-1.5"
              >
                {COMPANY_SCALE_LIST.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {isEn ? sc.nameEn : sc.nameKo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive SVG Bubble Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 bg-slate-950 border-2 border-slate-800 rounded-lg p-3">
              {(() => {
                const w = 680;
                const h = 340;
                const px = 48;
                const py = 28;
                const iw = w - px * 2;
                const ih = h - py * 2;
                const maxXp = Math.max(80, ...skillBubbles.map((b) => b.xpCost));
                const minEff = Math.min(-15, ...skillBubbles.map((b) => b.expectedEffectiveness));
                const maxEff = Math.max(38, ...skillBubbles.map((b) => b.expectedEffectiveness));
                const spanEff = Math.max(1, maxEff - minEff);

                return (
                  <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[320px]">
                    {/* Zero Effectiveness Line */}
                    <line
                      x1={px}
                      y1={py + ((maxEff - 0) / spanEff) * ih}
                      x2={w - px}
                      y2={py + ((maxEff - 0) / spanEff) * ih}
                      stroke="#475569"
                      strokeDasharray="4 4"
                    />
                    <line x1={px} y1={py} x2={px} y2={h - py} stroke="#64748b" />
                    <line x1={px} y1={h - py} x2={w - px} y2={h - py} stroke="#64748b" />

                    <text x={w / 2} y={h - 6} textAnchor="middle" fill="#94a3b8" fontSize="11">
                      {isEn ? `Effective XP Cost (0 ~ ${maxXp} XP)` : `실효 홍보예산 XP 소모량 (0 ~ ${maxXp} XP)`}
                    </text>
                    <text
                      x={14}
                      y={h / 2}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="11"
                      transform={`rotate(-90 14 ${h / 2})`}
                    >
                      {isEn ? 'Expected Effectiveness' : '기대 대응 효과 점수'}
                    </text>

                    {skillBubbles.map((b) => {
                      const cx = px + (b.xpCost / maxXp) * iw;
                      const cy = py + ((maxEff - b.expectedEffectiveness) / spanEff) * ih;
                      const r = Math.max(5.5, Math.min(16, 6 + Math.max(0, b.hpCost) * 0.42));
                      const fill =
                        b.riskDelta >= 15
                          ? 'rgba(244, 63, 94, 0.78)'
                          : b.riskDelta >= 5
                            ? 'rgba(245, 158, 11, 0.78)'
                            : b.riskDelta < 0
                              ? 'rgba(16, 185, 129, 0.82)'
                              : 'rgba(56, 189, 248, 0.78)';
                      const isSel = selectedBubble?.id === b.id;

                      return (
                        <g
                          key={b.id}
                          onClick={() => {
                            sound.playBlip();
                            setSelectedBubble(b);
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isSel ? r + 3 : r}
                            fill={fill}
                            stroke={isSel ? '#ffffff' : '#0f172a'}
                            strokeWidth={isSel ? 2.5 : 1.2}
                          />
                          <text
                            x={cx}
                            y={cy + 3}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="8.5"
                            fontWeight="bold"
                          >
                            {b.num}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

              <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-pixel pt-1">
                <span className="text-emerald-400">● {isEn ? 'RISK Reducing (<0)' : 'RISK 감소형'}</span>
                <span className="text-sky-400">● {isEn ? 'Safe (RISK 0~4)' : '안전형 (RISK 0~4)'}</span>
                <span className="text-amber-400">● {isEn ? 'Caution (RISK 5~14)' : '주의형 (RISK 5~14)'}</span>
                <span className="text-rose-400">● {isEn ? 'High Risk (15+)' : '고위험 역풍형 (15+)'}</span>
              </div>
            </div>

            {/* Selected Skill Detail & Top 6 Ranking */}
            <div className="lg:col-span-4 space-y-3">
              <div className="pixel-slot p-3 space-y-1.5 text-xs">
                <div className="font-pixel text-amber-300 font-bold">
                  {isEn ? 'Clicked Bubble Inspector' : '버블 클릭 상세 수치'}
                </div>
                {selectedBubble ? (
                  <div className="space-y-1 font-pixel">
                    <div className="text-sm text-white font-bold">
                      #{selectedBubble.num} [{selectedBubble.category}]{' '}
                      {isEn ? selectedBubble.nameEn : selectedBubble.nameKo}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        XP: <b className="text-amber-300">{selectedBubble.xpCost}</b>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        HP:{' '}
                        <b className="text-emerald-300">
                          {selectedBubble.hpCost < 0
                            ? `Heal +${Math.abs(selectedBubble.hpCost)}`
                            : selectedBubble.hpCost}
                        </b>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        {isEn ? 'Effect:' : '기대효과:'}{' '}
                        <b className="text-sky-300">{selectedBubble.expectedEffectiveness}</b>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        RISK:{' '}
                        <b className="text-rose-300">
                          {selectedBubble.riskDelta > 0 ? `+${selectedBubble.riskDelta}` : selectedBubble.riskDelta}
                        </b>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">
                    {isEn
                      ? 'Click any numbered circle (1–40) on the chart to inspect exact cost & risk.'
                      : '좌측 차트에서 번호(1~40) 버블을 클릭하면 조건별 상세 기대값이 표시됩니다.'}
                  </p>
                )}
              </div>

              <div className="pixel-slot p-3 space-y-1.5 text-xs">
                <div className="font-pixel text-emerald-300 font-bold">
                  {isEn ? 'Top 6 Highest Expected Value (Current Filter)' : '현재 필터 기준 기대효과 TOP 6 스킬'}
                </div>
                <div className="space-y-1">
                  {[...skillBubbles]
                    .sort((a, b) => b.expectedEffectiveness - a.expectedEffectiveness)
                    .slice(0, 6)
                    .map((b, i) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBubble(b)}
                        className="flex items-center justify-between bg-slate-950 px-2 py-1.5 rounded border border-slate-800 cursor-pointer hover:border-emerald-500/60 font-pixel text-[11px]"
                      >
                        <span className="text-white truncate">
                          {i + 1}. #{b.num} {isEn ? b.nameEn : b.nameKo}
                        </span>
                        <span className="text-emerald-300 font-bold shrink-0 ml-2">
                          {b.expectedEffectiveness} ({b.xpCost}XP)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SECTION C: 5 CORPORATE SCALES SURVIVAL ==================== */}
      {activeTab === 'C_scales' && (
        <div className="pixel-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="font-pixel text-sm sm:text-base text-sky-300 font-bold">
                {isEn
                  ? 'Corporate Scale Survival & Promotion Comparison (Startup → Chaebol)'
                  : '기업 규모 5단계별 생존율·승진율 비교 시뮬레이션'}
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Evaluates how initial XP vs press interest & cost multipliers balance survival across all 5 scales.'
                  : '초기 홍보예산(100~1000 XP)과 보도 파급력·대응 비용 배율이 어떻게 균형을 이루는지 시드 기반 반복 실험으로 비교합니다.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-pixel">
              <select
                value={scalePolicy}
                onChange={(e) => {
                  const pol = e.target.value as StrategyPolicyId;
                  setScalePolicy(pol);
                  runScalesComparison(pol, scaleIter);
                }}
                className="voxel-input text-xs py-1.5"
              >
                {(
                  [
                    'transparent_remedy',
                    'fact_check',
                    'relationship',
                    'legal_defense',
                    'big_budget',
                    'random_baseline',
                  ] as StrategyPolicyId[]
                ).map((p) => (
                  <option key={p} value={p}>
                    {isEn ? STRATEGY_POLICY_META[p].nameEn : STRATEGY_POLICY_META[p].nameKo}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const nextN = scaleIter === 300 ? 1000 : 300;
                  setScaleIter(nextN);
                  runScalesComparison(scalePolicy, nextN);
                }}
                className="pixel-btn-mc px-3 py-1.5 text-xs text-indigo-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scaleLoading ? 'animate-spin' : ''}`} />
                <span>N={scaleIter}/scale</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {COMPANY_SCALE_LIST.map((sc) => {
              const mc = scaleMcMap[sc.id];
              return (
                <div key={sc.id} className="pixel-slot p-3.5 space-y-2.5 font-pixel">
                  <div className="border-b border-slate-800 pb-2">
                    <div className="text-sm text-white font-bold">
                      {isEn ? sc.nameEn : sc.nameKo}
                    </div>
                    <div className="text-[11px] text-amber-300">
                      {sc.initialXp} XP · {sc.xpCostMultiplier}x {isEn ? 'Cost' : '비용'}
                    </div>
                  </div>

                  {mc ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{isEn ? 'Survive All 6' : '6단계 생존 완주'}</span>
                          <span className="text-emerald-300 font-bold">{mc.anySurvivalVictoryRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-500" style={{ width: `${mc.anySurvivalVictoryRate}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{isEn ? 'VP Promotion' : '임원 승진 비율'}</span>
                          <span className="text-amber-300 font-bold">{mc.execPromotionRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded overflow-hidden mt-0.5">
                          <div className="h-full bg-amber-400" style={{ width: `${mc.execPromotionRate}%` }} />
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-800/80 text-[10px] space-y-0.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>{isEn ? 'XP Depleted:' : '예산 고갈:'}</span>
                          <span className="text-orange-300">{mc.xpExhaustedRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{isEn ? 'HP Burnout:' : '체력 고갈:'}</span>
                          <span className="text-rose-300">{mc.hpExhaustedRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{isEn ? 'RISK Exposed:' : '공작 폭로:'}</span>
                          <span className="text-red-400">{mc.riskExplodedRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-6 text-center">
                      {isEn ? 'Simulating...' : '시뮬레이션 중...'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SECTION D: 6 STAGES RISK & RESOURCE PROFILE ==================== */}
      {activeTab === 'D_stages' && (
        <div className="pixel-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="font-pixel text-sm sm:text-base text-rose-300 font-bold">
                {isEn
                  ? 'Stages 1–6 Crisis Escalation & Resource Demand Profile'
                  : 'STAGE 1~6 사건 심각도·보도압박·요구 자원 구조 분석'}
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Shows starting press pressure, deadline window, co-reporting hazard, and estimated XP/HP budget per stage.'
                  : '스테이지가 올라갈수록 시작 보도 압박이 높아지고 마감 턴은 짧아지는 위기 구조를 정량 비교합니다.'}
              </p>
            </div>

            <select
              value={stageProfileScale}
              onChange={(e) => setStageProfileScale(e.target.value as CompanyScaleId)}
              className="voxel-input text-xs font-pixel py-1.5"
            >
              {COMPANY_SCALE_LIST.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {isEn ? sc.nameEn : sc.nameKo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stageProfiles.map((sp) => (
              <div key={sp.stage} className="pixel-slot p-3.5 space-y-2 font-pixel">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 text-xs text-red-200 font-bold">
                    STAGE {sp.stage} {sp.stars}
                  </span>
                  <span className="text-[11px] text-amber-300">
                    ⏰ {isEn ? `${sp.deadlineTurns} Turns` : `마감 ${sp.deadlineTurns}턴`}
                  </span>
                </div>
                <div className="text-sm text-white font-bold">
                  {isEn ? sp.themeEn : sp.themeKo}
                </div>
                {sp.isCoReporting && (
                  <div className="text-[10px] text-purple-300 bg-purple-950/60 border border-purple-600 px-2 py-0.5 rounded inline-block">
                    👥 {isEn ? '2-Reporter Joint Investigation' : '2인 공동취재 압박 가중 구간'}
                  </div>
                )}

                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isEn ? 'Initial Pressure:' : '초기 보도 압박:'}</span>
                    <span className="text-rose-300 font-bold">{sp.startPressure}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${sp.startPressure}%` }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">{isEn ? 'Est. XP Needed:' : '권장 XP 소모량:'}</span>
                    <span className="text-amber-300 font-bold">~{sp.estXpNeeded} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isEn ? 'Est. HP Drain:' : '예상 체력 소모:'}</span>
                    <span className="text-emerald-300 font-bold">~{sp.estHpNeeded} HP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{isEn ? 'Failure Rep Drop:' : '방어 실패 평판타격:'}</span>
                    <span className="text-red-400 font-bold">-{sp.repImpactPotential}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SECTION E: 6 ARCHETYPAL STRATEGIES ==================== */}
      {activeTab === 'E_strategies' && (
        <div className="pixel-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="font-pixel text-sm sm:text-base text-emerald-300 font-bold flex items-center gap-1.5">
                <Activity className="w-4 h-4" />
                <span>
                  {isEn
                    ? '6 Virtual PR Strategy Archetypes — Stage 1→6 Survival Curves'
                    : '6대 가상 홍보 전략 유형별 생존율 및 평판 비교'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Compares Relationship, Big-Budget, Legal-First, Fact-Check, Transparent Crisis Mgmt, and Random Baseline.'
                  : '관계 중심형 · 예산 투입형 · 법적 대응형 · 정보·팩트체크형 · 투명한 위기관리형 · 무작위 대응형 6종의 가상 성과를 대조합니다.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-pixel">
              <select
                value={stratScale}
                onChange={(e) => {
                  const sc = e.target.value as CompanyScaleId;
                  setStratScale(sc);
                  runStrategiesComparison(sc, stratIter);
                }}
                className="voxel-input text-xs py-1.5"
              >
                {COMPANY_SCALE_LIST.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {isEn ? sc.nameEn : sc.nameKo}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  const nextN = stratIter === 300 ? 1000 : 300;
                  setStratIter(nextN);
                  runStrategiesComparison(stratScale, nextN);
                }}
                className="pixel-btn-mc px-3 py-1.5 text-xs text-indigo-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${stratLoading ? 'animate-spin' : ''}`} />
                <span>N={stratIter}/strategy</span>
              </button>
            </div>
          </div>

          {/* Multi-Line Stage Survival SVG Chart */}
          <div className="bg-slate-950 border-2 border-slate-800 rounded-lg p-3 space-y-2">
            <div className="text-xs font-pixel text-slate-300 font-bold">
              {isEn ? 'Stage-by-Stage Survival Rate (%)' : '스테이지별 통과 생존율 곡선 (%)'}
            </div>
            {(() => {
              const w = 680;
              const h = 230;
              const px = 46;
              const py = 20;
              const iw = w - px * 2;
              const ih = h - py * 2;
              const stratKeys: StrategyPolicyId[] = [
                'transparent_remedy',
                'fact_check',
                'relationship',
                'legal_defense',
                'big_budget',
                'random_baseline',
              ];

              return (
                <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56">
                  {[0, 25, 50, 75, 100].map((v) => {
                    const y = py + ((100 - v) / 100) * ih;
                    return (
                      <g key={v}>
                        <line x1={px} y1={y} x2={w - px} y2={y} stroke="#1e293b" />
                        <text x={px - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="10">
                          {v}%
                        </text>
                      </g>
                    );
                  })}
                  {[1, 2, 3, 4, 5, 6].map((stg, idx) => {
                    const x = px + (idx / 5) * iw;
                    return (
                      <text key={stg} x={x} y={h - 4} textAnchor="middle" fill="#94a3b8" fontSize="10">
                        STAGE {stg}
                      </text>
                    );
                  })}

                  {stratKeys.map((pol) => {
                    const mc = stratMcMap[pol];
                    if (!mc) return null;
                    const color = STRATEGY_POLICY_META[pol].color;
                    const pts = mc.stageSurvivalRates
                      .map((sr, idx) => {
                        const x = px + (idx / 5) * iw;
                        const y = py + ((100 - sr.survivedRate) / 100) * ih;
                        return `${x},${y}`;
                      })
                      .join(' ');
                    return (
                      <g key={pol}>
                        <polyline fill="none" stroke={color} strokeWidth={2.8} points={pts} />
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* 6 Strategy Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              const meta = STRATEGY_POLICY_META[pol];
              const mc = stratMcMap[pol];
              return (
                <div key={pol} className="pixel-slot p-3.5 space-y-2">
                  <div className="flex items-center justify-between font-pixel">
                    <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: meta.color }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: meta.color }} />
                      {isEn ? meta.nameEn : meta.nameKo}
                    </span>
                    {mc && (
                      <span className="text-xs font-bold text-white">
                        {isEn ? `VP ${mc.execPromotionRate.toFixed(1)}%` : `승진 ${mc.execPromotionRate.toFixed(1)}%`}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isEn ? meta.ruleDescEn : meta.ruleDescKo}
                  </p>
                  {mc && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-pixel">
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        {isEn ? 'Survive' : '완주율'} <b className="text-emerald-300">{mc.anySurvivalVictoryRate.toFixed(1)}%</b>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        {isEn ? 'Avg Rep' : '평균평판'} <b className="text-sky-300">{mc.avgFinalReputation}</b>
                      </div>
                      <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                        {isEn ? 'Avg RISK' : '평균RISK'} <b className="text-rose-300">{mc.avgFinalRisk}</b>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SECTION F: REAL-WORLD PRESS ARBITRATION STATISTICS ==================== */}
      {activeTab === 'F_empirical' && (
        <div className="space-y-4">
          {/* Empirical Source Header */}
          <div className="pixel-card p-4 sm:p-5 border-emerald-500/80 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-400 font-pixel text-[11px] text-emerald-200 font-bold">
                🏛️ {isEn ? 'OFFICIAL EMPIRICAL STATISTICS (PAC KOREA)' : '공식 실증 데이터 · 언론중재위원회 (pac.or.kr)'}
              </span>
              <span className="text-[11px] font-pixel text-amber-300">
                {isEn
                  ? '2021–2024 Annual Press Arbitration Reports'
                  : '2021~2024년 언론조정중재 연간보고서 실측 통계'}
              </span>
            </div>
            <h3 className="font-pixel text-base sm:text-lg text-white font-bold">
              {isEn
                ? 'Real-World Press Disputes vs. <HONGDAM CRAFT> Virtual Simulation'
                : '현실에서는 기사를 어떻게 다투는가 vs 〈홍담 크래프트〉 가상 실험 비교'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isEn
                ? 'Tabs A–E analyze probabilities inside our virtual game engine. Tab F presents official real-world press dispute records from the Press Arbitration Commission of Korea so readers can compare real media remedies against in-game PR choices.'
                : '탭 A~E가 게임 내부 수식에서 도출된 가상 시뮬레이션 수치라면, 탭 F는 실제 대한민국 언론분쟁 현장에서 접수·처리된 언론중재위원회 공식 통계입니다. 현실의 정정·반론·손해배상 비중과 게임 속 홍보 스킬 설계를 직접 대조해 보세요.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: 2021-2024 Annual Dispute Volume & Relief Rate */}
            <div className="lg:col-span-6 pixel-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-pixel text-sm text-emerald-300 font-bold">
                  {isEn
                    ? '1. Annual Press Arbitration Claims & Relief Rate (2021–2024)'
                    : '1. 연도별 언론조정 신청 건수 및 피해구제율 (2021~2024)'}
                </div>
                <span className="text-[10px] font-pixel text-slate-400">단위: 건 / %</span>
              </div>

              <div className="space-y-2.5">
                {PAC_ANNUAL_TREND.map((row) => {
                  const widthPct = Math.round((row.totalClaims / 4500) * 100);
                  return (
                    <div key={row.year} className="pixel-slot p-3 space-y-1.5">
                      <div className="flex items-center justify-between font-pixel text-xs">
                        <span className="text-white font-bold">{row.year}년</span>
                        <div className="flex items-center gap-3">
                          <span className="text-amber-300 font-bold">
                            {row.totalClaims.toLocaleString()}
                            {isEn ? ' claims' : '건'}
                          </span>
                          <span className="text-emerald-300">
                            {isEn ? `Relief ${row.reliefRatePct}%` : `피해구제율 ${row.reliefRatePct}%`}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-sky-400"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 flex justify-between font-pixel">
                        <span>
                          {isEn
                            ? `Online Media Share: ${row.onlineMediaSharePct}%`
                            : `인터넷 기반 매체 비중: ${row.onlineMediaSharePct}%`}
                        </span>
                        <span className="text-slate-500">언론중재위 연간보고서</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Media Outlet Share (2023 Official Breakdown) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="font-pixel text-xs text-rose-300 font-bold">
                  {isEn
                    ? 'Media Type Share of Disputes (4,085 total claims)'
                    : '매체 유형별 분쟁 집중도 (인터넷 매체·포털이 73% 이상 차지)'}
                </div>
                <div className="space-y-1.5">
                  {PAC_2023_MEDIA_SHARES.map((m) => (
                    <div key={m.nameEn} className="text-[11px]">
                      <div className="flex justify-between font-pixel text-slate-300 mb-0.5">
                        <span>{isEn ? m.nameEn : m.nameKo}</span>
                        <span>
                          <b>{m.sharePct}%</b> ({m.cases2023.toLocaleString()}건)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                        <div
                          className="h-full rounded"
                          style={{ width: `${m.sharePct}%`, backgroundColor: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: 2024 Claim Type Breakdown & Direct Game Comparison */}
            <div className="lg:col-span-6 pixel-card p-4 space-y-3">
              <div className="font-pixel text-sm text-sky-300 font-bold">
                {isEn
                  ? '2. 2024 Claim Types (3,937 Cases) Mapped to Game Skills'
                  : '2. 2024년 청구 유형별 실측 비중(3,937건)과 게임 스킬 대응 구조'}
              </div>

              <div className="space-y-2.5">
                {PAC_2024_CLAIM_TYPES.map((ct) => (
                  <div key={ct.id} className="pixel-slot p-3 space-y-1.5">
                    <div className="flex items-center justify-between font-pixel text-xs">
                      <span className="font-bold text-white">{isEn ? ct.nameEn : ct.nameKo}</span>
                      <span className="font-bold" style={{ color: ct.color }}>
                        {ct.sharePct}% ({ct.cases2024.toLocaleString()}
                        {isEn ? ' cases' : '건'})
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 rounded overflow-hidden border border-slate-800">
                      <div
                        className="h-full"
                        style={{ width: `${ct.sharePct}%`, backgroundColor: ct.color }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-300">
                      🎮 {isEn ? ct.gameMappingEn : ct.gameMappingKo}
                    </p>
                  </div>
                ))}
              </div>

              {/* Side-by-Side Comparison: Reality vs Game */}
              <div className="bg-indigo-950/40 border border-indigo-500/60 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="font-pixel text-amber-300 font-bold">
                  🔍 {isEn ? 'Reality vs. Simulation — Key Takeaways' : '현실 실증 데이터 vs 게임 시뮬레이션 핵심 대조'}
                </div>
                <ul className="space-y-1.5 text-slate-200 leading-relaxed list-disc pl-4">
                  <li>
                    {isEn
                      ? 'In reality, Factual Correction (46.3%) + Right-of-Reply Rebuttal (21.0%) make up 67.3% of formal remedies—matching why Fact-Check (#06) + Statement (#04) / Correction (#18) form a core pillar in-game.'
                      : '현실 분쟁의 67.3%는 정정보도(46.3%)와 반론보도(21.0%) 청구입니다. 사실 확인(#06)과 객관적 정정(#18)·반론 해명(#04)이 위기관리의 정석인 이유가 실증 통계로도 확인됩니다.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Over 80.9% of real disputes involve online newspapers & portals where speed outpaces verification—reflected in our Deadline Sprinter & SNS Viral Reporter archetypes.'
                      : '현실 언론분쟁의 80.9%(2024년)가 인터넷 기반 매체에 집중되어 있습니다. 게임 속 [마감 질주형]·[SNS 바이럴형] 기자의 빠른 확산 압박은 이러한 디지털 보도 환경을 반영했습니다.'}
                  </li>
                  <li>
                    {isEn
                      ? 'Crucial Difference: PAC data only captures disputes AFTER publication, whereas corporate PR teams fight most battles BEFORE deadline—which <HONGDAM CRAFT> models as a hypothetical sandbox.'
                      : '결정적 차이: 언론중재위 통계는 기사 출고 ‘이후’의 공식 분쟁만 포착하는 반면, 실제 홍보팀의 치열한 설득·팩트 검증은 출고 ‘이전’ 마감 시계 안에서 벌어집니다. 〈홍담 크래프트〉는 그 블랙박스 구간을 가상 규칙으로 실험합니다.'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Data Honesty Footer */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 font-pixel flex flex-wrap items-center justify-between gap-2">
        <span>
          📌{' '}
          {isEn
            ? 'Methodological Note: Tabs A–E compute from in-game mathematical rules (Seed #20261103); Tab F cites official 2021–2024 Press Arbitration Commission (pac.or.kr) empirical reports.'
            : '데이터 정직성 고지: 탭 A~E는 게임 엔진 수식·시드 난수(#20261103) 가상 실험 결과이며, 탭 F는 언론중재위원회(pac.or.kr) 2021~2024 공식 실측 통계입니다.'}
        </span>
        <span className="text-amber-300">HONGDAM CRAFT · HONGDAM DATA LAB</span>
      </div>
    </div>
  );
};
