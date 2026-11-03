import React, { useEffect, useRef, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { CRAFT_UNIVERSE_BRAND } from '../config/craftUniverse';
import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { ENDINGS, PR_ARCHETYPES } from '../data/endings';
import { PR_SKILLS_BY_ID } from '../data/skills';
import { useLanguage } from '../i18n/LanguageContext';
import { GameState } from '../types/game';
import { sound } from '../utils/sound';

interface ShareCardModalProps {
  state: GameState;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({ state, onClose }) => {
  const { isEn } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>('');

  const endSum = state.endingSummary;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !endSum) return;
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const endDef = ENDINGS[endSum.endingId];
    const archDef = PR_ARCHETYPES[endSum.archetypeId];
    const scaleDef = COMPANY_SCALES[state.company.scale];
    const indDef = INDUSTRIES[state.company.industry];
    const clearedStages = state.stageHistory.filter((s) => s.resolution !== 'damaging_report').length;

    // 1. Background gradient + pixel grid
    const grad = ctx.createLinearGradient(0, 0, 1200, 630);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.55, '#131c31');
    grad.addColorStop(1, endDef.isVictory ? '#1e1b4b' : '#2a0f18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1200; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 630);
      ctx.stroke();
    }
    for (let y = 0; y < 630; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1200, y);
      ctx.stroke();
    }

    // Outer Pixel Frame
    ctx.strokeStyle = endDef.isVictory ? '#fbbf24' : '#f43f5e';
    ctx.lineWidth = 8;
    ctx.strokeRect(18, 18, 1164, 594);

    // 13. CRAFT UNIVERSE Logo Badge + 1. Game Title
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(48, 44, 235, 36);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.fillText(`★ ${CRAFT_UNIVERSE_BRAND.title}`, 62, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(
      isEn
        ? 'HONGDAM CRAFT — The PR Survival Game'
        : '홍담 크래프트 — 기사 막기 전쟁',
      300,
      70
    );

    // Subtitle badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(
      isEn
        ? 'A Data Journalism-Inspired Interactive Simulation'
        : '데이터저널리즘형 가상 시뮬레이션 리포트 카드',
      48,
      106
    );

    // 7. Final Ending Banner
    ctx.fillStyle = endDef.isVictory ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.22)';
    ctx.fillRect(48, 124, 1104, 88);
    ctx.strokeStyle = endDef.isVictory ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.strokeRect(48, 124, 1104, 88);

    ctx.fillStyle = endDef.isVictory ? '#fde047' : '#fda4af';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(isEn ? endDef.titleEn : endDef.titleKo, 68, 168);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '18px sans-serif';
    ctx.fillText(isEn ? endDef.quoteEn : endDef.quoteKo, 68, 198);

    // Left Column: 2. Name, 3. Company, 4. Scale/Industry, 5. Career, 6. Cleared Stages, 8. PR Archetype
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(48, 232, 540, 315);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 232, 540, 315);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(isEn ? 'PR CHIEF DOSSIER' : '홍보팀장 인사·소속 기록 (가상 설정)', 68, 264);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(
      isEn
        ? `${state.player.name} · PR Team Lead (${state.player.experienceYears}y)`
        : `${state.player.name} 홍보팀장 (경력 ${state.player.experienceYears}년차)`,
      68,
      302
    );

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(
      `${state.player.companyName} (${
        isEn
          ? `${scaleDef.nameEn} · ${indDef.nameEn}`
          : `${scaleDef.nameKo} · ${indDef.nameKo}`
      })`,
      68,
      336
    );

    // 6. Cleared stages & 11. Reporter relations
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '19px sans-serif';
    ctx.fillText(
      isEn
        ? `• Crises Cleared: ${clearedStages} / 6 Stages (Reached STAGE ${endSum.finalStage})`
        : `• 방어 성공 스테이지: ${clearedStages} / 6관문 (최종 STAGE ${endSum.finalStage})`,
      68,
      380
    );
    ctx.fillText(
      isEn
        ? `• Final Press Relations: Trusted ${endSum.trustedCount} / Hostile ${endSum.hostileCount} / Total ${state.journalistPool.length}`
        : `• 기자 최종 관계 요약: 신뢰 우군 ${endSum.trustedCount}명 / 적대 감시 ${endSum.hostileCount}명 (총 ${state.journalistPool.length}명)`,
      68,
      412
    );

    // 8. PR Chief Archetype Box
    ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
    ctx.fillRect(68, 436, 500, 92);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(68, 436, 500, 92);
    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(
      `${archDef.icon} ${isEn ? `PR Style: ${archDef.nameEn}` : `나의 홍담 유형: ${archDef.nameKo}`}`,
      84,
      472
    );
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px sans-serif';
    const archDesc = isEn ? archDef.descEn : archDef.descKo;
    ctx.fillText(archDesc.slice(0, 42) + (archDesc.length > 42 ? '…' : ''), 84, 504);

    // Right Column: 10. Final Resources & 9. Top 3 Skills
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(612, 232, 540, 315);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(612, 232, 540, 315);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(isEn ? 'FINAL METRICS & TOP 3 PR SKILLS' : '최종 자원 지표 및 최다 사용 스킬 TOP 3', 632, 264);

    // 4 Stat Pills
    const statItems = [
      { label: 'XP', val: `${state.resources.xp}`, col: '#fbbf24' },
      { label: 'HP', val: `${state.resources.hp}/100`, col: '#34d399' },
      { label: 'RISK', val: `${state.resources.risk}/100`, col: '#fb7185' },
      { label: isEn ? 'REP' : '평판', val: `${state.resources.reputation}/100`, col: '#38bdf8' },
    ];
    statItems.forEach((st, i) => {
      const bx = 632 + i * 126;
      ctx.fillStyle = '#090d16';
      ctx.fillRect(bx, 282, 114, 72);
      ctx.strokeStyle = st.col;
      ctx.strokeRect(bx, 282, 114, 72);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(st.label, bx + 14, 306);
      ctx.fillStyle = st.col;
      ctx.font = 'bold 24px monospace, sans-serif';
      ctx.fillText(st.val, bx + 14, 340);
    });

    // 9. Top 3 Skills
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(isEn ? 'Most Deployed PR Skills TOP 3:' : '가장 많이 사용한 홍보 스킬 TOP 3:', 632, 392);

    if (endSum.topSkills.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '17px sans-serif';
      ctx.fillText(isEn ? '• Resigned before using skills' : '• 스킬 사용 전 조기 사표 제출', 632, 426);
    } else {
      endSum.topSkills.slice(0, 3).forEach((ts, idx) => {
        const sk = PR_SKILLS_BY_ID[ts.skillId];
        ctx.fillStyle = idx === 0 ? '#fde047' : '#e2e8f0';
        ctx.font = 'bold 19px sans-serif';
        ctx.fillText(
          `${idx + 1}. ${sk ? (isEn ? sk.nameEn : sk.nameKo) : ts.skillId}  —  ${
            isEn ? `${ts.count}x` : `${ts.count}회`
          }`,
          632,
          428 + idx * 34
        );
      });
    }

    // 12. Footer URL & Slogan
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.fillText('🔗 https://raspos.github.io/hongdam-craft/', 48, 584);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(
      isEn
        ? 'CRAFT UNIVERSE · Personnel Craft × Hongdam Craft'
        : '“기사는 쏟아지고, 예산은 바닥나고, 팀장 목숨은 하나다.”',
      1152,
      584
    );
    ctx.textAlign = 'left';

    setDataUrl(canvas.toDataURL('image/png'));
  }, [state, endSum, isEn]);

  const handleDownload = () => {
    if (!dataUrl) return;
    sound.playSuccess();
    const link = document.createElement('a');
    link.download = `hongdam-craft-${state.player.name || 'report'}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="pixel-card max-w-4xl w-full p-4 sm:p-6 border-amber-400 my-auto space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="font-pixel text-sm sm:text-base text-amber-300 font-bold flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            <span>
              {isEn
                ? '1200×630 PNG RESULT SHARE CARD'
                : '결과 공유 이미지 카드 (1200×630 고해상도 PNG)'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-950 p-2 rounded-lg border-2 border-slate-800 overflow-hidden">
          <canvas ref={canvasRef} className="hidden" />
          {dataUrl && (
            <img
              src={dataUrl}
              alt="Hongdam Craft Share Card"
              className="w-full h-auto rounded shadow-lg"
            />
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="pixel-btn-mc px-4 py-2.5 text-xs text-slate-200"
          >
            {isEn ? 'Close' : '닫기'}
          </button>
          <button
            onClick={handleDownload}
            className="pixel-btn-mc pixel-btn-mc-gold px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isEn ? 'Download 1200×630 PNG' : 'PNG 이미지 저장하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
