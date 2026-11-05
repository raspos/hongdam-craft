import React from 'react';
import {
  BarChart3,
  Building2,
  Dices,
  Flame,
  Gauge,
  MessageSquareText,
  Play,
  Save,
  ShieldAlert,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import {
  checkResemblesRealCompany,
  COMPANY_SCALES,
  EXEC_TRAITS,
  INDUSTRIES,
} from '../data/companies';
import { MAX_COMPANY_REROLLS } from '../engine/balanceConfig';
import { DIFFICULTY_LIST, DIFFICULTY_SETTINGS } from '../engine/difficultyConfig';
import { RANDOM_COMPANY_NAMES, RANDOM_PR_NAMES } from '../engine/gameEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { AssignedCompany, PRAppearance, PRPlayerProfile } from '../types/game';
import { IncomingChallengeParams } from '../utils/challengeShare';
import { sound } from '../utils/sound';

interface CharacterCreationProps {
  phase: 'character_create' | 'company_assigned';
  profile: PRPlayerProfile;
  company: AssignedCompany;
  rerollsLeft: number;
  incomingChallenge?: IncomingChallengeParams | null;
  onChangeProfile: (p: PRPlayerProfile) => void;
  onQuickStart: () => void;
  onAcceptChallenge?: () => void;
  onDismissChallenge?: () => void;
  onAssignCompany: () => void;
  onRerollCompany: () => void;
  onStartStage1: () => void;
  onOpenDataLab: () => void;
  onOpenSimulator: () => void;
  onOpenBamboo?: () => void;
}

const SKIN_TONES = ['#fce5d4', '#f3cfb3', '#e5b899', '#c99372'];
const SUIT_COLORS = [
  { hex: '#1e3a8a', ko: '네이비 정장', en: 'Navy Suit' },
  { hex: '#1e293b', ko: '차콜 수트', en: 'Charcoal' },
  { hex: '#374151', ko: '그레이 콤비', en: 'Slate Grey' },
  { hex: '#4c1d95', ko: '버건디/퍼플', en: 'Plum Jacket' },
];
const TIE_COLORS = ['#dc2626', '#2563eb', '#d97706', '#10b981'];
const HAIR_STYLES: { id: PRAppearance['hairStyle']; ko: string; en: string }[] = [
  { id: 'neat', ko: '단정한 가르마', en: 'Neat Classic' },
  { id: 'parted', ko: '댄디 컷', en: 'Side Part' },
  { id: 'short', ko: '짧은 스포츠', en: 'Short Crop' },
  { id: 'bob', ko: '칼단발', en: 'Sharp Bob' },
];

export const CharacterCreationScreen: React.FC<CharacterCreationProps> = ({
  phase,
  profile,
  company,
  rerollsLeft,
  incomingChallenge,
  onChangeProfile,
  onQuickStart,
  onAcceptChallenge,
  onDismissChallenge,
  onAssignCompany,
  onRerollCompany,
  onStartStage1,
  onOpenDataLab,
  onOpenSimulator,
  onOpenBamboo,
}) => {
  const { isEn } = useLanguage();
  const resemblesReal = checkResemblesRealCompany(profile.companyName);

  const rollRandomName = () => {
    sound.playBlip();
    const filtered = RANDOM_PR_NAMES.filter((n) => n !== profile.name);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)] || '김홍담';
    onChangeProfile({ ...profile, name: chosen });
  };

  const rollRandomCompany = () => {
    sound.playBlip();
    const filtered = RANDOM_COMPANY_NAMES.filter((c) => c !== profile.companyName);
    const chosen = filtered[Math.floor(Math.random() * filtered.length)] || RANDOM_COMPANY_NAMES[0];
    onChangeProfile({ ...profile, companyName: chosen });
  };

  if (phase === 'company_assigned') {
    const scaleDef = COMPANY_SCALES[company.scale];
    const indDef = INDUSTRIES[company.industry];
    const traitDef = EXEC_TRAITS[company.execTrait];

    return (
      <div className="pixel-card p-5 space-y-4 border-amber-500/80">
        <div className="border-b border-slate-800 pb-3">
          <div className="text-[11px] font-pixel text-amber-400">
            {isEn ? 'STEP 2 · RANDOM CORPORATE ASSIGNMENT' : 'STEP 2 · 가상 기업 시나리오 무작위 배정 완료'}
          </div>
          <h2 className="font-pixel text-lg sm:text-xl text-white font-bold mt-0.5">
            {profile.companyName} — {profile.name} {isEn ? 'PR Team Lead' : '홍보팀장'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isEn
              ? '※ Fictional simulation profile. Scale, industry, and C-suite culture were randomly assigned.'
              : '※ 입력하신 사명은 가상 세계관으로 재구성되었으며 실제 기업과 무관합니다.'}
          </p>
        </div>

        {/* Assigned Corporate Specs */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="pixel-slot p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-slate-400 font-pixel text-[11px]">
                {isEn ? 'Corporate Scale' : '기업 규모'}
              </span>
              <span className="text-[10px] font-pixel px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300">
                {isEn
                  ? `Score ×${scaleDef.scoreMultiplier.toFixed(2)}`
                  : `점수 ×${scaleDef.scoreMultiplier.toFixed(2)}`}
              </span>
            </div>
            <div className="font-pixel text-base text-amber-300 font-bold mt-0.5">
              {isEn ? scaleDef.nameEn : scaleDef.nameKo}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isEn ? `Initial XP: ${scaleDef.initialXp}` : `초기 홍보예산: ${scaleDef.initialXp} XP`}
            </div>
          </div>

          <div className="pixel-slot p-3">
            <div className="text-slate-400 font-pixel text-[11px]">{isEn ? 'Assigned Industry' : '배정 업종'}</div>
            <div className="font-pixel text-base text-sky-300 font-bold mt-0.5">
              {indDef.icon} {isEn ? indDef.nameEn : indDef.nameKo}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isEn
                ? `Press Interest: ${scaleDef.pressInterestEn}`
                : `기자 관심도: ${scaleDef.pressInterestKo}`}
            </div>
          </div>

          <div className="pixel-slot p-3 col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-pixel text-[11px]">
                {isEn ? 'Executive Culture Trait' : '가상 경영진 특성'}
              </span>
              <span className="text-[10px] font-pixel px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-rose-300">
                {isEn
                  ? `Crisis Impact: ${scaleDef.crisisImpactEn}`
                  : `위기 파급력: ${scaleDef.crisisImpactKo}`}
              </span>
            </div>
            <div className="font-pixel text-sm text-emerald-300 font-bold mt-1">
              {isEn ? traitDef.nameEn : traitDef.nameKo}
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isEn ? traitDef.descEn : traitDef.descKo}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded p-3 text-xs text-slate-300 leading-relaxed">
          {isEn ? scaleDef.descEn : scaleDef.descKo}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={() => {
              sound.playSuccess();
              onStartStage1();
            }}
            className="pixel-btn-mc pixel-btn-mc-primary flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{isEn ? 'Enter STAGE 1 Crisis Battle!' : 'STAGE 1 위기 대응 출격!'}</span>
          </button>

          <button
            onClick={() => {
              if (rerollsLeft <= 0) return;
              sound.playClick();
              onRerollCompany();
            }}
            disabled={rerollsLeft <= 0}
            className="pixel-btn-mc py-2.5 px-3 text-xs text-slate-200 flex items-center justify-center gap-1.5"
            title={
              rerollsLeft > 0
                ? isEn
                  ? `Re-roll random company (${rerollsLeft} left)`
                  : `기업 규모·업종 다시 배정 (${rerollsLeft}회 남음)`
                : isEn
                  ? 'No re-rolls remaining'
                  : '재배정 횟수를 모두 사용했습니다'
            }
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span>
              {isEn
                ? `Re-roll (${rerollsLeft}/${MAX_COMPANY_REROLLS})`
                : `재배정 (${rerollsLeft}/${MAX_COMPANY_REROLLS})`}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            sound.playBlip();
            onOpenSimulator();
          }}
          className="w-full py-2 rounded bg-indigo-950/80 border border-indigo-500/70 hover:border-indigo-400 text-xs font-pixel text-indigo-200 flex items-center justify-center gap-1.5"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {isEn
              ? 'Preview Monte Carlo Survival Odds Before Starting'
              : '출격 전 몬테카를로 6단계 생존 확률 시뮬레이션 해보기'}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Intro Story Banner — Crimson PR sibling of Personnel Craft's Newsroom Welcome Card */}
      <div className="pixel-card p-5 border-red-500/50 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950">
        <div className="text-[11px] font-pixel text-amber-300 flex items-center gap-1.5 mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {isEn
              ? 'Data Journalism Virtual PR Crisis Simulation'
              : '데이터저널리즘 가상 시뮬레이션 인터랙티브 프로젝트'}
          </span>
        </div>
        <h2 className="font-pixel text-lg sm:text-xl text-rose-300 font-bold mb-2 flex items-center gap-2">
          <span>🚨</span>
          <span>
            {isEn
              ? '“Welcome to the Corporate PR War Room.”'
              : '“기사는 쏟아지고, 예산은 바닥나고, 팀장 목숨은 하나다.”'}
          </span>
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          {isEn
            ? 'You are a corporate PR Team Lead facing relentless exclusive scoops, whistleblowers, and executive scandals. Will you survive 6 crisis stages before midnight deadlines?'
            : '당신은 쏟아지는 단독 질문지와 데스크 마감 시계를 마주한 대한민국 기업 홍보팀장입니다. 신제품 오보부터 오너리스크까지, 6번의 위기에서 회사와 내 자리를 지켜낼 수 있을까요?'}
        </p>
      </div>

      {/* Incoming Same-Seed Friend Challenge Banner */}
      {incomingChallenge && onAcceptChallenge && (
        <div className="bg-amber-950/80 border-2 border-amber-400 rounded-lg p-3.5 space-y-2.5 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="font-pixel text-xs sm:text-sm text-amber-300 font-extrabold flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                {isEn
                  ? `FRIEND CHALLENGE ARRIVED! (Seed #${incomingChallenge.seed})`
                  : `🔥 동일 조건 위기대응 도전장 도착! (시드 #${incomingChallenge.seed})`}
              </span>
            </div>
            {onDismissChallenge && (
              <button
                type="button"
                onClick={onDismissChallenge}
                className="text-[11px] font-pixel text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-amber-100 leading-relaxed">
            {isEn
              ? `${incomingChallenge.challengerName ? `‘${incomingChallenge.challengerName}’` : 'A challenger'} faced ${incomingChallenge.scale ? COMPANY_SCALES[incomingChallenge.scale].nameEn : 'this company'} · ${incomingChallenge.industry ? INDUSTRIES[incomingChallenge.industry].nameEn : 'this beat'}${typeof incomingChallenge.challengerRate === 'number' ? ` (Defense Rate ${incomingChallenge.challengerRate}%)` : ''}. Face the exact same reporters & crises!`
              : `${incomingChallenge.challengerName ? `‘${incomingChallenge.challengerName}’ 홍보팀장` : '도전자'}님이 플레이한 [${incomingChallenge.scale ? COMPANY_SCALES[incomingChallenge.scale].nameKo : '동일 기업'} · ${incomingChallenge.industry ? INDUSTRIES[incomingChallenge.industry].nameKo : '동일 업종'}]${typeof incomingChallenge.challengerRate === 'number' ? ` (방어율 ${incomingChallenge.challengerRate}%)` : ''}과 똑같은 기자·사건 조건으로 승부합니다!`}
          </p>
          <button
            type="button"
            onClick={() => {
              sound.playSuccess();
              onAcceptChallenge();
            }}
            className="pixel-btn-mc pixel-btn-mc-gold w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>
              {isEn
                ? 'Accept Challenge & Start STAGE 1 Instantly!'
                : '같은 회사·같은 기자 조건으로 즉시 도전 시작!'}
            </span>
          </button>
        </div>
      )}

      {/* Main Character Profile & Company Selection Card */}
      <div className="pixel-card p-4 sm:p-5 space-y-4 border-amber-500/60 bg-slate-950/80">
        <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
          <div className="font-pixel text-sm sm:text-base text-amber-300 font-bold flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'PR Chief & Target Company Setup' : '홍보팀장 신상 & 소속 회사 선택'}</span>
          </div>
          <span className="text-[11px] font-pixel text-slate-400">
            {isEn ? 'Step 1 of 2' : '1단계 · 기본 설정'}
          </span>
        </div>

        {/* 1. Name & Company Name Inputs with Random Dice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5 font-pixel">
              <label className="text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold">{isEn ? 'PR Chief Name' : '홍보팀장 이름·닉네임'}</span>
              </label>
              <button
                type="button"
                onClick={rollRandomName}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                title={isEn ? 'Randomize Name' : '이름 랜덤 뽑기'}
              >
                <Dices className="w-3 h-3" />
                <span>{isEn ? 'Random' : '랜덤'}</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={16}
              value={profile.name}
              onChange={(e) => onChangeProfile({ ...profile, name: e.target.value })}
              placeholder={isEn ? 'e.g., Alex Kim' : '예: 김홍담'}
              className="voxel-input w-full text-sm font-pixel font-bold"
            />
            <div className="text-[10px] text-slate-500 mt-1 font-pixel">
              {isEn ? 'Unified Rank: PR Team Lead' : '직급 통일: 기업 홍보팀장'}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 font-pixel">
              <label className="text-slate-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">{isEn ? 'Company Name' : '소속 회사명'}</span>
              </label>
              <button
                type="button"
                onClick={rollRandomCompany}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                title={isEn ? 'Randomize Company' : '회사명 랜덤 뽑기'}
              >
                <Dices className="w-3 h-3" />
                <span>{isEn ? 'Random' : '랜덤'}</span>
              </button>
            </div>
            <input
              type="text"
              maxLength={20}
              value={profile.companyName}
              onChange={(e) => onChangeProfile({ ...profile, companyName: e.target.value })}
              placeholder={isEn ? 'e.g., Hanbit Tech' : '예: 한빛테크놀로지'}
              className="voxel-input w-full text-sm font-pixel font-bold text-amber-300"
            />
            <div className="text-[10px] text-slate-400 mt-1">
              {resemblesReal
                ? isEn
                  ? '⚠️ Fictional Scenario: Unrelated to any real-world company.'
                  : '⚠️ 가상 설정 안내: 입력 사명은 게임 속 가상 기업으로 작동하며 실제 기업과 무관합니다.'
                : isEn
                  ? '* Scale & beat will be randomly assigned.'
                  : '* 기업 규모(스타트업~재벌)와 세부 업종은 무작위 배정됩니다.'}
            </div>
          </div>
        </div>

        {/* 2. PR Team Lead Persona & Game Difficulty Mode */}
        <div className="pixel-slot p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between font-pixel">
            <span className="text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'PR Team Lead Persona & Difficulty' : '홍보팀장 유형 & 난이도'}</span>
            </span>
            <span className="text-amber-300 font-bold text-[11px]">
              {DIFFICULTY_SETTINGS[profile.difficulty || 'normal']?.[isEn ? 'nameEn' : 'nameKo']}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DIFFICULTY_LIST.map((diff) => {
              const isSelected = (profile.difficulty || 'normal') === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => {
                    sound.playBlip();
                    onChangeProfile({
                      ...profile,
                      difficulty: diff.id,
                      experienceYears: diff.defaultYears,
                    });
                  }}
                  className={`p-2.5 rounded text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] font-pixel">
                      <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                        {isEn ? diff.badgeEn : diff.badgeKo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {diff.id === 'rookie' ? '×0.85' : diff.id === 'veteran' ? '×1.50' : '×1.00'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {isEn ? diff.descEn : diff.descKo}
                    </p>
                  </div>
                  {diff.id === 'rookie' && (
                    <span className="text-[10px] text-emerald-400 font-pixel mt-1.5 block">
                      ✓ {isEn ? 'Retry on Game Over' : '패배 시 재도전 지원'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Character Voxel Appearance (Hair / Suit / Tie / Glasses) */}
        <div className="pixel-slot p-3 space-y-2.5 text-xs">
          <div className="font-pixel text-slate-200">
            {isEn ? '3D Voxel Appearance' : '3D 복셀 캐릭터 외형 선택'}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                {isEn ? 'Hairstyle' : '헤어스타일'}
              </span>
              <div className="grid grid-cols-2 gap-1">
                {HAIR_STYLES.map((hs) => (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => {
                      sound.playBlip();
                      onChangeProfile({
                        ...profile,
                        appearance: { ...profile.appearance, hairStyle: hs.id },
                      });
                    }}
                    className={`py-1 px-1.5 rounded text-[11px] font-pixel border ${
                      profile.appearance.hairStyle === hs.id
                        ? 'bg-amber-600 text-white border-amber-300 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {isEn ? hs.en : hs.ko}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">
                {isEn ? 'Suit Style' : '수트 색상'}
              </span>
              <div className="grid grid-cols-2 gap-1">
                {SUIT_COLORS.map((sc) => (
                  <button
                    key={sc.hex}
                    type="button"
                    onClick={() => {
                      sound.playBlip();
                      onChangeProfile({
                        ...profile,
                        appearance: { ...profile.appearance, suitColor: sc.hex },
                      });
                    }}
                    className={`py-1 px-1.5 rounded text-[11px] font-pixel border flex items-center gap-1 ${
                      profile.appearance.suitColor === sc.hex
                        ? 'bg-sky-700 text-white border-sky-300 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: sc.hex }} />
                    <span className="truncate">{isEn ? sc.en : sc.ko}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{isEn ? 'Skin:' : '피부톤:'}</span>
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() =>
                    onChangeProfile({
                      ...profile,
                      appearance: { ...profile.appearance, skinTone: tone },
                    })
                  }
                  className={`w-5 h-5 rounded border-2 ${
                    profile.appearance.skinTone === tone ? 'border-amber-300 scale-110' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: tone }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">{isEn ? 'Tie:' : '넥타이:'}</span>
              {TIE_COLORS.map((tc) => (
                <button
                  key={tc}
                  type="button"
                  onClick={() =>
                    onChangeProfile({
                      ...profile,
                      appearance: { ...profile.appearance, tieColor: tc },
                    })
                  }
                  className={`w-5 h-5 rounded border-2 ${
                    profile.appearance.tieColor === tc ? 'border-white scale-110' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: tc }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playBlip();
                onChangeProfile({
                  ...profile,
                  appearance: { ...profile.appearance, glasses: !profile.appearance.glasses },
                });
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-pixel border ${
                profile.appearance.glasses
                  ? 'bg-emerald-700 text-white border-emerald-300 font-bold'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              👓 {isEn ? (profile.appearance.glasses ? 'Glasses ON' : 'Glasses OFF') : profile.appearance.glasses ? '안경 착용' : '안경 미착용'}
            </button>
          </div>
        </div>
      </div>

      {/* START ACTIONS: Immediate Launch or Corporate Specs Preview */}
      <div className="space-y-2.5 pt-1">
        <button
          type="button"
          onClick={() => {
            sound.playSuccess();
            onQuickStart();
          }}
          className="pixel-btn-mc pixel-btn-mc-primary w-full py-3.5 text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-lg"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>
            {isEn
              ? `Launch Crisis Defense as ${profile.name} at ${profile.companyName}!`
              : `[${profile.companyName}] ${profile.name} 홍보팀장으로 즉시 출격!`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onAssignCompany();
          }}
          className="pixel-btn-mc pixel-btn-mc-gold w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>
            {isEn
              ? 'Preview Assigned Corporate Specs (Scale & C-Suite) First →'
              : '가상 기업 세부 배정(규모·경영진 특성) 먼저 확인 후 출격 →'}
          </span>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-pixel px-1">
          <span className="flex items-center gap-1 text-slate-300">
            <Save className="w-3 h-3 text-sky-400" />
            {isEn ? 'Auto-saved every turn · Resume anytime' : '매 턴 자동 저장 · 1단계만 끝내도 공유 가능'}
          </span>
          <span className="text-amber-300/90">
            {isEn
              ? `Active: ${profile.name} · ${DIFFICULTY_SETTINGS[profile.difficulty || 'normal']?.nameEn || 'Strategist Lead'}`
              : `현재 설정: ${profile.name} · ${DIFFICULTY_SETTINGS[profile.difficulty || 'normal']?.nameKo || '전략 팀장 (표준)'}`}
          </span>
        </div>
      </div>

      {/* Secondary Quick Entries: Data Lab & Bamboo Grove */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => {
            sound.playBlip();
            onOpenDataLab();
          }}
          className="w-full py-2 px-2.5 rounded bg-slate-900 hover:bg-indigo-950/70 border border-indigo-500/50 text-xs font-pixel text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>
            {isEn
              ? 'HONGDAM DATA LAB'
              : '📊 홍담 데이터랩'}
          </span>
        </button>

        {onOpenBamboo && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenBamboo();
            }}
            className="w-full py-2 px-2.5 rounded bg-slate-900 hover:bg-emerald-950/70 border border-emerald-600/50 text-xs font-pixel text-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isEn
                ? 'PR Bamboo Grove Lounge'
                : '🎋 익명 대나무숲 라운지'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
