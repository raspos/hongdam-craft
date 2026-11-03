import React from 'react';
import { AlertOctagon, Flag, X } from 'lucide-react';
import { PR_SKILLS_BY_ID } from '../data/skills';
import { useLanguage } from '../i18n/LanguageContext';
import { SkillExecutionPreview } from '../types/game';
import { sound } from '../utils/sound';

interface DangerConfirmModalProps {
  mode: 'lethal_skill' | 'resignation';
  skillId?: string;
  preview?: SkillExecutionPreview;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DangerConfirmModal: React.FC<DangerConfirmModalProps> = ({
  mode,
  skillId,
  preview,
  onConfirm,
  onCancel,
}) => {
  const { isEn } = useLanguage();
  const skill = skillId ? PR_SKILLS_BY_ID[skillId] : undefined;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-card max-w-md w-full p-5 border-rose-500 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-pixel font-bold text-sm sm:text-base">
            {mode === 'lethal_skill' ? (
              <>
                <AlertOctagon className="w-5 h-5 animate-pulse" />
                <span>
                  {isEn ? 'IMMEDIATE GAME OVER WARNING!' : '즉시 게임 오버 위험 경고!'}
                </span>
              </>
            ) : (
              <>
                <Flag className="w-5 h-5" />
                <span>
                  {isEn ? 'Submit Resignation Letter?' : '정말 사직서를 제출하시겠습니까?'}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === 'lethal_skill' && skill && preview ? (
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="bg-rose-950/70 border border-rose-500/80 rounded p-3 text-rose-100 font-pixel">
              <div className="font-bold text-sm text-amber-300 mb-1">
                [{isEn ? skill.nameEn : skill.nameKo}]
              </div>
              <p>{isEn ? preview.lethalWarningEn : preview.lethalWarningKo}</p>
            </div>
            <p className="text-slate-300">
              {isEn
                ? 'Are you sure you want to take this risk anyway, or cancel and select a recovery/safe skill (e.g., Skill #40 Emergency Rest or #19 VP Budget)?'
                : '다른 안전한 스킬(예: #40 긴급 휴식, #19 홍보실장 지원 요청 등)을 선택할 수 있습니다. 그래도 강행하시겠습니까?'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed text-slate-200">
            <div className="bg-slate-900 border border-amber-500/60 rounded p-3">
              {isEn
                ? 'Submitting your resignation immediately triggers [Resignation — Escaped PR Hell!] ending and concludes this playthrough.'
                : '품속의 사직서를 제출하면 즉시 [사표 제출 — 홍담 탈출 엔딩]으로 이번 플레이가 종료되며 최종 데이터 리포트가 생성됩니다.'}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="pixel-btn-mc flex-1 py-2.5 text-xs font-bold text-white"
          >
            {isEn ? 'Cancel & Stay Safe' : '취소하고 돌아가기'}
          </button>
          <button
            onClick={() => {
              sound.playWarning();
              onConfirm();
            }}
            className="pixel-btn-mc flex-1 py-2.5 text-xs font-bold bg-rose-700 border-rose-400 text-white"
          >
            {mode === 'lethal_skill'
              ? isEn
                ? 'Execute Anyway!'
                : '위험 감수하고 강행!'
              : isEn
                ? 'Throw Resignation!'
                : '사직서 던지기!'}
          </button>
        </div>
      </div>
    </div>
  );
};
