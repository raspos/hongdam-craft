import React, { useState } from 'react';
import { Activity, AlertTriangle, BarChart2, Flag, HelpCircle, ShieldCheck, Wallet } from 'lucide-react';
import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { JOURNALIST_ARCHETYPES, JOURNALIST_COUNTER_SKILLS } from '../data/journalists';
import { STAGES } from '../data/stages';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState } from '../types/game';
import { sound } from '../utils/sound';

interface BattleHUDProps {
  state: GameState;
  onOpenSurvivalSim: () => void;
  onOpenMethodology: () => void;
  onResign: () => void;
}

export const BattleHUD: React.FC<BattleHUDProps> = ({
  state,
  onOpenSurvivalSim,
  onOpenMethodology,
  onResign,
}) => {
  const { isEn } = useLanguage();
  const [infoTip, setInfoTip] = useState<string | null>(null);

  const battle = state.stageBattle;
  const scaleDef = COMPANY_SCALES[state.company.scale];
  const indDef = INDUSTRIES[state.company.industry];
  const stageDef = STAGES[state.currentStage];
  const xpRatio = Math.min(100, Math.round((state.resources.xp / Math.max(1, state.resources.initialXp)) * 100));

  return (
    <div className="space-y-3">
      {/* Top Compact Status Strip */}
      <div className="pixel-card p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500 font-pixel text-xs text-red-200 font-bold">
              STAGE {state.currentStage}/6 {stageDef.stars}
            </span>
            <span className="font-pixel text-xs sm:text-sm text-white font-bold">
              {state.player.companyName}
            </span>
            <span className="text-[11px] font-pixel text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {indDef.icon} {isEn ? `${scaleDef.nameEn} · ${indDef.nameEn}` : `${scaleDef.nameKo} · ${indDef.nameKo}`}
            </span>
            <span className="text-[11px] font-pixel text-sky-300">
              {state.player.name} {isEn ? `(${state.player.experienceYears}y PR Lead)` : `홍보팀장 (${state.player.experienceYears}년차)`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playBlip();
                onOpenSurvivalSim();
              }}
              className="px-2 py-1 rounded bg-indigo-950/90 border border-indigo-500/80 hover:border-indigo-300 text-[11px] font-pixel text-indigo-200 flex items-center gap-1"
              title={isEn ? 'Run Monte Carlo Survival Simulator' : '남은 스테이지 생존 시뮬레이터'}
            >
              <BarChart2 className="w-3 h-3 text-indigo-400" />
              <span>{isEn ? 'Survival Odds' : '생존 확률'}</span>
            </button>

            <button
              onClick={() => {
                sound.playBlip();
                onOpenMethodology();
              }}
              className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-sky-300"
              title={isEn ? 'How metrics are calculated' : '수치 계산 공식 보기'}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onResign();
              }}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-rose-500 text-[11px] font-pixel text-slate-300 hover:text-rose-300 flex items-center gap-1"
              title={isEn ? 'Submit Resignation (Escape Ending)' : '사표 제출 (홍담 탈출 엔딩)'}
            >
              <Flag className="w-3 h-3" />
              <span>{isEn ? 'Resign' : '사표'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Gauges: XP, HP, RISK, REPUTATION */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-pixel">
          {/* XP */}
          <div
            onClick={() => setInfoTip(infoTip === 'xp' ? null : 'xp')}
            className="pixel-slot p-2 cursor-pointer hover:border-amber-500/60"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-amber-300 flex items-center gap-1">
                <Wallet className="w-3 h-3" /> XP {isEn ? 'Budget' : '홍보예산'} ⓘ
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
            onClick={() => setInfoTip(infoTip === 'hp' ? null : 'hp')}
            className={`pixel-slot p-2 cursor-pointer hover:border-emerald-500/60 ${
              state.resources.hp <= 25 ? 'danger-pulse border-red-500' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-300 flex items-center gap-1">
                <Activity className="w-3 h-3" /> HP {isEn ? 'Stamina' : '체력'} ⓘ
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
            onClick={() => setInfoTip(infoTip === 'risk' ? null : 'risk')}
            className={`pixel-slot p-2 cursor-pointer hover:border-rose-500/60 ${
              state.resources.risk >= 75 ? 'danger-pulse border-rose-500' : ''
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> RISK {isEn ? 'Backlash' : '역풍위험'} ⓘ
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
          <div
            onClick={() => setInfoTip(infoTip === 'rep' ? null : 'rep')}
            className="pixel-slot p-2 cursor-pointer hover:border-sky-500/60"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-sky-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> {isEn ? 'Reputation' : '기업평판'} ⓘ
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

        {/* Inline Metric Formula Explanation Tooltip (Section 7) */}
        {infoTip && (
          <div className="bg-slate-900 border border-sky-500/50 rounded p-2 text-[11px] text-slate-200 flex items-center justify-between">
            <span>
              {infoTip === 'xp' &&
                (isEn
                  ? 'XP (PR Budget): Scaled by corporate size (Cost mult: ' +
                    scaleDef.xpCostMultiplier +
                    'x). Exhaustion with no free actions triggers Transfer Game Over.'
                  : `XP (홍보예산): 기업 규모 배율(${scaleDef.xpCostMultiplier}배)이 유료 스킬에 적용됩니다. 예산 고갈 시 타 부서 발령 게임 오버!`)}
              {infoTip === 'hp' &&
                (isEn
                  ? 'HP (Stamina): Drops from overtime, stress, and drinks. Hitting 0 causes immediate Hospitalization Game Over. Use Skill #20 or #10 to recover.'
                  : 'HP (체력): 야근·술자리·기자의 압박으로 감소하며 0이 되면 즉시 [병원 입원] 게임 오버됩니다. #20 긴급 휴식 또는 #10 법무·위기관리 전담지원으로 회복 가능!')}
              {infoTip === 'risk' &&
                (isEn
                  ? 'RISK (Backlash): Rises from D-category spin/lobbying. Above 45/70 triggers leak events; 100 triggers Dark PR Scandal Game Over.'
                  : 'RISK (역풍 위험): 광고 압박·협찬·외압 등 고위험 선택 시 상승. 45·70 돌파 시 폭로 이벤트 확률 급증, 100 도달 시 즉시 게임 오버!')}
              {infoTip === 'rep' &&
                (isEn
                  ? 'REPUTATION: Starts at 50. Shapes final promotion eligibility (52+ VP Promotion, 76+ Crisis Legend). Hitting 0 causes Dismissal.'
                  : 'REPUTATION (기업 평판): 50 시작. 정정·보상·개선 시 상승하며 최종 임원 승진(52 이상) 및 전설 엔딩(76 이상)을 좌우합니다.')}
            </span>
            <button onClick={() => setInfoTip(null)} className="text-slate-400 hover:text-white ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Active Buffs & Stage Pressure Bar */}
        {battle && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-pixel">
              <span className="text-rose-300">
                🔥 {isEn ? 'Press Pressure (Target ≤ 68 at Deadline, ≤ 15 Instant Drop)' : '기사 보도 압박 (마감 시 68 이하 방어 성공 · 15 이하 즉시 보도 철회!)'}
              </span>
              <span className="font-bold text-white">{battle.pressure}%</span>
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
              {/* Threshold marker at 68% */}
              <div className="absolute top-0 bottom-0 left-[68%] w-0.5 bg-white/80" title="68% Clear Line" />
            </div>

            {/* Active Tactical Buffs */}
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
                  🤢 {isEn ? 'Hangover (+5 HP cost)' : '숙취 디버프 (체력소모 +5)'}
                </span>
              )}
              {battle.buffs.dataMismatchDebuff && (
                <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500 text-rose-300">
                  📉 {isEn ? 'Data Error (-28% Statement)' : '숫자 오류 (팩트체크로 해제 가능)'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Journalist Dossier Card(s) */}
      {battle && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {battle.journalists.map((j, idx) => {
            const arch = JOURNALIST_ARCHETYPES[j.archetype];
            const nextMove = j.nextPlannedSkillId ? JOURNALIST_COUNTER_SKILLS[j.nextPlannedSkillId] : null;
            return (
              <div
                key={j.memoryId}
                className={`pixel-card p-3 space-y-1.5 ${
                  battle.journalists.length === 1 ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{arch.badgeIcon}</span>
                    <div>
                      <div className="font-pixel text-xs sm:text-sm text-white font-bold flex items-center gap-1.5 flex-wrap">
                        <span>{isEn ? `${j.nameEn} (${j.outletEn})` : `${j.outletKo} ${j.nameKo} ${j.titleKo}`}</span>
                        {idx === 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-600 text-amber-300">
                            {isEn ? 'Co-Reporter' : '공동취재'}
                          </span>
                        )}
                        {j.isReturning && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 border border-purple-500 text-purple-200">
                            🧠 {isEn ? 'Returning NPC' : '구면 재등장'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-amber-300 font-pixel">
                        {isEn ? arch.nameEn : arch.nameKo}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-pixel text-xs">
                    <div className="text-sky-300">
                      {isEn ? 'TRUST' : '친밀·신뢰'} <span className="text-white font-bold">{j.stats.intimacy}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isEn ? 'Evidence' : '증거수준'}{' '}
                      <span className="text-rose-300 font-bold">
                        {j.isAnalyzed || j.intentProbed ? `${j.stats.evidenceLevel}%` : j.stats.evidenceLevel >= 70 ? 'HIGH' : 'MED'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 bg-slate-950/80 px-2.5 py-1.5 rounded border border-slate-800 italic">
                  {j.currentDialogueKo ? (isEn ? j.currentDialogueEn : j.currentDialogueKo) : ''}
                </p>

                {isEn && (
                  <div className="text-[10px] text-sky-300/90">
                    💡 K-Media Context: {arch.culturalNoteEn}
                  </div>
                )}

                {j.isAnalyzed ? (
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-pixel pt-1 text-slate-300">
                    <div className="bg-slate-950 px-1.5 py-1 rounded border border-slate-800">
                      {isEn ? 'Report' : '취재력'} <b className="text-amber-300">{j.stats.reportingPower}</b>
                    </div>
                    <div className="bg-slate-950 px-1.5 py-1 rounded border border-slate-800">
                      {isEn ? 'Persist' : '집요함'} <b className="text-amber-300">{j.stats.persistence}</b>
                    </div>
                    <div className="bg-slate-950 px-1.5 py-1 rounded border border-slate-800">
                      {isEn ? 'Expert' : '전문성'} <b className="text-amber-300">{j.stats.expertise}</b>
                    </div>
                    <div className="bg-slate-950 px-1.5 py-1 rounded border border-slate-800">
                      {isEn ? 'Distrust' : '불신도'} <b className="text-rose-300">{j.stats.distrust}</b>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 font-pixel">
                    🔒 {isEn ? 'Use Skill #05 [Reporter Profiling & Probe] to reveal exact stats & next move' : '스킬 #05 [기자 프로파일·취재탐색] 사용 시 상세 능력치·다음 행동 공개'}
                  </div>
                )}

                {j.intentProbed && nextMove && (
                  <div className="text-[10px] font-pixel text-indigo-300 bg-indigo-950/60 px-2 py-1 rounded border border-indigo-700">
                    🔭 {isEn ? `Next Intended Move: ${nextMove.nameEn}` : `간파한 다음 기자 행동: [${nextMove.nameKo}]`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
