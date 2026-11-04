import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Lightbulb, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState } from '../types/game';
import { sound } from '../utils/sound';

interface BeginnerTutorialGuideProps {
  state: GameState;
  onHighlightSkill?: (skillId: string) => void;
}

const TUTORIAL_STORAGE_KEY = 'hongdam_tutorial_completed';

function isTutorialCompleted(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setTutorialCompleted(): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  } catch {}
}

export const BeginnerTutorialGuide: React.FC<BeginnerTutorialGuideProps> = ({
  state,
  onHighlightSkill,
}) => {
  const { isEn } = useLanguage();
  const [dismissed, setDismissed] = useState<boolean>(() => isTutorialCompleted());

  const battle = state.stageBattle;
  const isStage1 = state.currentStage === 1 && state.phase === 'battle';

  // Mark tutorial complete when Stage 1 ends or moves forward
  useEffect(() => {
    if (state.currentStage > 1 || (state.currentStage === 1 && state.phase === 'stage_result')) {
      setTutorialCompleted();
    }
  }, [state.currentStage, state.phase]);

  if (!isStage1 || !battle || dismissed) {
    return null;
  }

  // Determine current tutorial step dynamically from game state
  let currentStep = 1;
  let titleKo = '';
  let titleEn = '';
  let bodyKo = '';
  let bodyEn = '';
  let targetSkillId: string | null = null;

  const turn = battle.turnNumber;
  const buffs = battle.buffs;

  if (turn === 1) {
    currentStep = 2;
    titleKo = 'STEP 1~2: 위기 발생 & 첫 탐색 대응';
    titleEn = 'STEP 1~2: Crisis Scoop & Initial Probe';
    bodyKo =
      '기자가 제품 결함 단독 보도를 준비 중입니다. 먼저 [기자에게 전화]를 선택해 취재 내용을 파악하고 신뢰를 쌓으세요.';
    bodyEn =
      'A reporter has received an exclusive leak. Choose [Call Reporter] first to probe the facts and build initial rapport.';
    targetSkillId = 'A01_phone_call';
  } else if (!buffs.factChecked && turn === 2) {
    currentStep = 3;
    titleKo = 'STEP 3: 사내 사실관계 검증 (팩트체크)';
    titleEn = 'STEP 3: Internal Fact Verification';
    bodyKo =
      '소문만으로 해명하면 역풍을 맞습니다! [사내 팩트체크]를 실행하여 사실관계를 확인하면 이후 공식 해명자료의 효과가 45% 급상승합니다.';
    bodyEn =
      'Unverified denials backfire! Execute [Fact-Check Team] to verify truth and boost subsequent press statement power by 45%.';
    targetSkillId = 'B05_fact_check_team';
  } else if (buffs.factChecked && turn <= 3) {
    currentStep = 4;
    titleKo = 'STEP 4: 공식 해명자료 배포';
    titleEn = 'STEP 4: Official Press Statement';
    bodyKo =
      '팩트체크가 완료되었습니다! 이제 [공식 해명자료]를 내어 기자의 의혹을 논리적으로 해소하고 보도 압박을 대폭 낮추세요.';
    bodyEn =
      'Facts verified! Now issue an [Official Statement] to logically counter the allegations and sharply drop press pressure.';
    targetSkillId = 'A04_press_statement';
  } else {
    currentStep = 5;
    titleKo = 'STEP 5: 마감 방어 및 결과 확인';
    titleEn = 'STEP 5: Deadline Defense & Outcome Review';
    bodyKo =
      '행동 직후 기자의 실시간 반응과 압박 순감소치를 확인하세요. 마감(D-0턴) 전 보도 압박을 68% 이하로 유지하면 위기 방어 성공입니다!';
    bodyEn =
      'Check the reporter’s live reaction and net pressure drop. Keep pressure ≤68% before deadline hits D-0 to win this crisis!';
  }

  const handleSkip = () => {
    sound.playClick();
    setTutorialCompleted();
    setDismissed(true);
  };

  const handleSelectRecommendedSkill = () => {
    if (targetSkillId && onHighlightSkill) {
      sound.playBlip();
      onHighlightSkill(targetSkillId);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/80 border-2 border-amber-400 rounded-lg p-3 sm:p-3.5 space-y-2 shadow-lg font-pixel select-none animate-fadeIn">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/40 pb-1.5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="text-xs sm:text-sm text-amber-200 font-bold">
            {isEn ? '1-MINUTE BEGINNER PR GUIDE' : '초보 홍담 1분 가이드'}
          </span>
          <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] border border-amber-400/50">
            {currentStep}/5
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
          title={isEn ? 'Skip tutorial' : '튜토리얼 건너뛰기'}
        >
          <span>{isEn ? 'Skip' : '건너뛰기'}</span>
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-white font-bold flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{isEn ? titleEn : titleKo}</span>
        </div>
        <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed font-sans font-medium pl-5">
          {isEn ? bodyEn : bodyKo}
        </p>
      </div>

      {targetSkillId && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleSelectRecommendedSkill}
            className="text-[11px] px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <span>{isEn ? 'Inspect Guided Skill' : '추천 스킬 확인하기'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
