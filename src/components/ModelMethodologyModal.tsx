import React from 'react';
import { BookOpen, Cpu, Scale, ShieldAlert, X } from 'lucide-react';
import { COMPANY_SCALE_LIST } from '../data/companies';
import { useLanguage } from '../i18n/LanguageContext';

interface ModelMethodologyModalProps {
  onClose: () => void;
}

export const ModelMethodologyModal: React.FC<ModelMethodologyModalProps> = ({ onClose }) => {
  const { isEn } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="pixel-card max-w-3xl w-full p-5 sm:p-6 border-sky-400 my-auto max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-sky-300 font-pixel text-sm font-bold">
              <BookOpen className="w-4 h-4" />
              <span>
                {isEn
                  ? 'VIRTUAL SIMULATION MODEL & METHODOLOGY DISCLOSURE'
                  : '데이터저널리즘 가상 시뮬레이션 모형 및 계산 원리 설명'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isEn
                ? 'Transparency documentation for HONGDAM CRAFT’s rule-based engine, counterfactual replays, and Monte Carlo simulations.'
                : '〈홍담 크래프트〉의 모든 확률·효율·반사실 분석이 어떤 가상 규칙으로 계산되는지 투명하게 공개합니다.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Non-Predictive Honesty Banner */}
        <div className="bg-amber-950/60 border-2 border-amber-400 rounded-lg p-3.5 text-xs sm:text-sm text-amber-100 leading-relaxed font-pixel">
          <div className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>{isEn ? 'CORE PRINCIPLE' : '핵심 고지 사항'}</span>
          </div>
          <p>
            {isEn
              ? '“These numbers are NOT empirical predictions of real-world corporations or journalists. They are quantitative virtual simulation results governed strictly by in-game rules, parameters, and RNG seeds.”'
              : '“이 프로젝트의 모든 수치는 실제 기업이나 기자의 현실 행동을 예측한 것이 아니라, 게임 내 규칙과 변수에 따라 산출된 가상 시뮬레이션 결과입니다.”'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
          <div className="pixel-slot p-3.5 space-y-1.5">
            <div className="font-pixel text-sky-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>{isEn ? '1. Journalist Parameters & Affinity' : '1. 기자 능력치 및 스킬 상성 수식'}</span>
            </div>
            <p className="text-slate-300">
              {isEn
                ? '12 fictional reporter archetypes sample 8 stats (Reporting Power, Persistence, Expertise, Source Network, Deadline, Trust, Distrust, Evidence) within archetype-specific min–max bands using a seeded Mulberry32 PRNG.'
                : '12개 기자 유형은 유형별 최소~최대 범위 내에서 8개 능력치(취재력·집요함·전문성·정보망·마감압박·친밀도·불신도·증거수준)를 시드 난수(Mulberry32)로 생성합니다.'}
            </p>
            <p className="text-slate-400 text-[11px]">
              {isEn
                ? 'Effective Pressure Δ = Base Δ × AffinityMult × (1 + CareerProficiency) × SynergyMult × StreakDecay.'
                : '보도압박 변화량 = 기본값 × 기자상성배율 × (1 + 연차숙련보너스) × 팩트검증시너지 × 연속사용체감율.'}
            </p>
          </div>

          <div className="pixel-slot p-3.5 space-y-1.5">
            <div className="font-pixel text-emerald-300 font-bold flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>{isEn ? '2. Resource & Risk Rules' : '2. 홍보예산·체력·역풍(RISK) 규칙'}</span>
            </div>
            <p className="text-slate-300">
              {isEn
                ? 'XP scales by company size; HP starts at 100 (0 = Hospital Game Over); RISK rises from D-category spin/pressure (45+ & 70+ raise leak event odds; 100 = Exposure Game Over).'
                : 'XP는 기업 규모별 배율이 적용되며, HP(초기 100)가 0이 되면 과로 입원, 고위험 대응 누적 RISK가 100에 도달하면 홍보 공작 폭로로 즉시 게임 오버됩니다.'}
            </p>
            <p className="text-slate-400 text-[11px]">
              {isEn
                ? 'Stage clears when Pressure ≤ 15 (Instant Drop) or Deadline reaches 0 with Pressure ≤ 68.'
                : '보도 압박 15 이하 도달 시 즉시 보도 철회(S등급), 마감 도달 시 압박 68 이하이면 세부 조건에 따라 정정·연기·반론·신뢰회복·진정으로 판정됩니다.'}
            </p>
          </div>
        </div>

        {/* Corporate Scale Multiplier Table */}
        <div className="pixel-slot p-3.5 space-y-2 text-xs">
          <div className="font-pixel text-amber-300 font-bold">
            {isEn ? '3. Corporate Scale Balance Parameters' : '3. 5대 기업 규모별 밸런스 계수 표'}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-pixel border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-1 text-left">{isEn ? 'Scale' : '기업 규모'}</th>
                  <th className="py-1 text-right">{isEn ? 'Init XP' : '초기 XP'}</th>
                  <th className="py-1 text-right">{isEn ? 'XP Cost Mult' : '비용 배율'}</th>
                  <th className="py-1 text-right">{isEn ? 'Press Mult' : '압박 배율'}</th>
                  <th className="py-1 text-right">{isEn ? 'Stage Bonus' : '기본 보충 XP'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {COMPANY_SCALE_LIST.map((sc) => (
                  <tr key={sc.id}>
                    <td className="py-1 text-white">{isEn ? sc.nameEn : sc.nameKo}</td>
                    <td className="py-1 text-right text-amber-300">{sc.initialXp}</td>
                    <td className="py-1 text-right text-slate-300">{sc.xpCostMultiplier}x</td>
                    <td className="py-1 text-right text-rose-300">{sc.pressureMultiplier}x</td>
                    <td className="py-1 text-right text-emerald-300">+{sc.stageRewardXp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Counterfactual & Monte Carlo Methodology */}
        <div className="pixel-slot p-3.5 space-y-1.5 text-xs leading-relaxed">
          <div className="font-pixel text-indigo-300 font-bold">
            {isEn
              ? '4. Seeded Counterfactual (WHAT IF) & Monte Carlo Simulation'
              : '4. 시드 통제 반사실(WHAT IF) 및 몬테카를로 반복 시뮬레이션 방식'}
          </div>
          <p className="text-slate-300">
            {isEn
              ? '• WHAT IF: Captures an immutable StageReplaySnapshot (exact RNG seed, journalist stats, internal credibility, and starting resources) at the start of every stage so alternative skill sequences are evaluated under identical random draws.'
              : '• WHAT IF 반사실 비교: 각 스테이지 개시 시점의 난수 시드(rngStateAtStart)와 기자 능력치·사건 조건을 스냅샷으로 저장한 뒤, 동일한 난수열 위에서 대안 스킬만 교체 실행해 순수 선택 차이를 측정합니다.'}
          </p>
          <p className="text-slate-300">
            {isEn
              ? '• Monte Carlo Simulator: Executes exactly N = 1,000 or 5,000 independent trials using deterministic per-trial seeds derived from the base seed, pairing randomized crises/reporters with explicit strategy policy rules.'
              : '• 몬테카를로 생존 시뮬레이터: 기본 1,000회(최대 5,000회) 독립 시행을 수행하며, 각 시행마다 시드 기반으로 다양한 사건·기자 조합을 생성하고 명시된 전략 규칙(투명한 위기관리형 등 7종)으로 완주 여부를 집계합니다.'}
          </p>
          <p className="text-slate-400 text-[11px]">
            {isEn
              ? '• Telemetry Integrity: Personal stage & ending reports read exclusively from your real in-session telemetryLogs—zero synthetic logs are ever mixed into player results.'
              : '• 실측 로그 원칙: 개인 위기 대응 리포트와 최종 종합 분석은 오직 현재 플레이에서 기록된 실제 행동 로그(telemetryLogs)만을 사용합니다.'}
          </p>
        </div>
      </div>
    </div>
  );
};
