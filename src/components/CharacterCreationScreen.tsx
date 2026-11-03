import React from 'react';
import { BarChart3, Building2, Dices, Play, ShieldAlert, Sparkles, User } from 'lucide-react';
import {
  checkResemblesRealCompany,
  COMPANY_SCALES,
  EXEC_TRAITS,
  INDUSTRIES,
} from '../data/companies';
import { getExperienceModifiers } from '../engine/balanceConfig';
import { useLanguage } from '../i18n/LanguageContext';
import { AssignedCompany, PRAppearance, PRPlayerProfile } from '../types/game';
import { sound } from '../utils/sound';

interface CharacterCreationProps {
  phase: 'character_create' | 'company_assigned';
  profile: PRPlayerProfile;
  company: AssignedCompany;
  onChangeProfile: (p: PRPlayerProfile) => void;
  onAssignCompany: () => void;
  onRerollCompany: () => void;
  onStartStage1: () => void;
  onOpenDataLab: () => void;
  onOpenSimulator: () => void;
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
  onChangeProfile,
  onAssignCompany,
  onRerollCompany,
  onStartStage1,
  onOpenDataLab,
  onOpenSimulator,
}) => {
  const { isEn } = useLanguage();
  const expMod = getExperienceModifiers(profile.experienceYears);
  const resemblesReal = checkResemblesRealCompany(profile.companyName);

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
            <div className="text-slate-400 font-pixel text-[11px]">{isEn ? 'Corporate Scale' : '기업 규모'}</div>
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
              sound.playClick();
              onRerollCompany();
            }}
            className="pixel-btn-mc py-2.5 px-3 text-xs text-slate-200 flex items-center justify-center gap-1.5"
            title={isEn ? 'Re-roll random company scale & industry' : '기업 규모·업종 다시 무작위 배정'}
          >
            <Dices className="w-4 h-4 text-amber-400" />
            <span>{isEn ? 'Re-roll' : '재배정'}</span>
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
    <div className="pixel-card p-4 sm:p-5 space-y-4">
      {/* Slogan Banner */}
      <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-slate-950 border-l-4 border-red-500 p-3 rounded">
        <div className="text-[10px] font-pixel text-amber-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>
            {isEn
              ? 'A Data Journalism-Inspired Interactive Simulation'
              : '데이터저널리즘형 가상 시뮬레이션 인터랙티브 프로젝트'}
          </span>
        </div>
        <p className="font-pixel text-xs sm:text-sm text-white font-bold mt-1 leading-snug">
          {isEn
            ? '“The headlines keep coming. The budget keeps shrinking. And the PR chief only has one life.”'
            : '“기사는 쏟아지고, 예산은 바닥나고, 팀장 목숨은 하나다.”'}
        </p>
      </div>

      {/* 1. Name & Company Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-pixel text-slate-300 mb-1 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>{isEn ? 'PR Chief Name / Nickname' : '홍보팀장 이름·닉네임'}</span>
          </label>
          <input
            type="text"
            maxLength={16}
            value={profile.name}
            onChange={(e) => onChangeProfile({ ...profile, name: e.target.value })}
            placeholder={isEn ? 'e.g., Alex Kim' : '예: 김홍담'}
            className="voxel-input w-full text-xs font-pixel"
          />
          <div className="text-[10px] text-slate-500 mt-1 font-pixel">
            {isEn ? 'Unified Rank: PR Team Lead' : '직급 통일: 홍보팀장'}
          </div>
        </div>

        <div>
          <label className="block font-pixel text-slate-300 mb-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEn ? 'Virtual Company Name' : '회사명 입력'}</span>
          </label>
          <input
            type="text"
            maxLength={20}
            value={profile.companyName}
            onChange={(e) => onChangeProfile({ ...profile, companyName: e.target.value })}
            placeholder={isEn ? 'e.g., Hanbit Tech' : '예: 한빛테크놀로지'}
            className="voxel-input w-full text-xs font-pixel"
          />
          <div className="text-[10px] text-amber-400/90 mt-1">
            {resemblesReal
              ? isEn
                ? '⚠️ Fictional Scenario Notice: Unrelated to any real-world company of similar name.'
                : '⚠️ 가상 설정 안내: 입력 사명은 게임 속 무작위 가상 기업으로만 작동하며 실제 기업과 무관합니다.'
              : isEn
                ? '* Scale & industry will be randomly assigned.'
                : '* 기업 규모(스타트업~재벌)와 업종은 무작위 배정됩니다.'}
          </div>
        </div>
      </div>

      {/* 2. PR Experience Years */}
      <div className="pixel-slot p-3 space-y-1.5 text-xs">
        <div className="flex items-center justify-between font-pixel">
          <span className="text-slate-200">
            {isEn ? 'PR Career Experience (Years)' : '홍보 경력 (연차)'}
          </span>
          <span className="text-amber-300 font-bold text-sm">
            {isEn ? `Year ${profile.experienceYears} · PR Team Lead` : `${profile.experienceYears}년차 홍보팀장`}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={profile.experienceYears}
          onChange={(e) =>
            onChangeProfile({ ...profile, experienceYears: parseInt(e.target.value, 10) || 1 })
          }
          className="w-full accent-amber-500 cursor-pointer"
        />
        <div className="flex flex-wrap justify-between text-[11px] text-slate-400 gap-1">
          <span>
            {isEn
              ? `Skill Proficiency: +${Math.round(expMod.skillProficiencyBonus * 100)}%`
              : `스킬 숙련 보너스: +${Math.round(expMod.skillProficiencyBonus * 100)}%`}
          </span>
          <span>
            {isEn
              ? `Initial Reporter Trust: +${expMod.initialTrustBonus}`
              : `기자 초기 친밀도: +${expMod.initialTrustBonus}`}
          </span>
        </div>
      </div>

      {/* 3. Character Voxel Appearance */}
      <div className="pixel-slot p-3 space-y-2.5 text-xs">
        <div className="font-pixel text-slate-200">{isEn ? '3D Voxel Appearance' : '3D 복셀 캐릭터 외형 선택'}</div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">{isEn ? 'Hairstyle' : '헤어스타일'}</span>
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
                      ? 'bg-amber-600 text-white border-amber-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {isEn ? hs.en : hs.ko}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">{isEn ? 'Suit Style' : '수트 색상'}</span>
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
                      ? 'bg-sky-700 text-white border-sky-300'
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
                ? 'bg-emerald-700 text-white border-emerald-300'
                : 'bg-slate-900 text-slate-400 border-slate-700'
            }`}
          >
            👓 {isEn ? (profile.appearance.glasses ? 'Glasses ON' : 'Glasses OFF') : profile.appearance.glasses ? '안경 착용' : '안경 미착용'}
          </button>
        </div>
      </div>

      {/* Start & Data Lab Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => {
            sound.playClick();
            onAssignCompany();
          }}
          className="pixel-btn-mc pixel-btn-mc-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isEn ? 'Assign Virtual Company & Begin PR War!' : '가상 기업 배정받고 홍보팀장 부임하기!'}</span>
        </button>

        <button
          onClick={() => {
            sound.playBlip();
            onOpenDataLab();
          }}
          className="w-full py-2 rounded bg-slate-900 hover:bg-indigo-950/70 border border-indigo-500/50 text-xs font-pixel text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>
            {isEn
              ? 'Explore HONGDAM DATA LAB Without Playing First'
              : '게임 시작 전 [홍담 데이터랩 — 기사 막기의 통계학] 먼저 둘러보기'}
          </span>
        </button>
      </div>
    </div>
  );
};
