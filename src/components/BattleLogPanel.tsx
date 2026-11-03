import React from 'react';
import { ScrollText } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { BattleLogEntry } from '../types/game';

interface BattleLogPanelProps {
  logs: BattleLogEntry[];
}

export const BattleLogPanel: React.FC<BattleLogPanelProps> = ({ logs }) => {
  const { isEn } = useLanguage();

  const toneStyle: Record<BattleLogEntry['tone'], string> = {
    good: 'border-emerald-600/70 bg-emerald-950/30 text-emerald-100',
    warn: 'border-amber-600/70 bg-amber-950/25 text-amber-100',
    bad: 'border-rose-600/80 bg-rose-950/35 text-rose-100',
    info: 'border-slate-700 bg-slate-900/80 text-slate-200',
  };

  return (
    <div className="pixel-card p-3 sm:p-4 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
        <div className="font-pixel text-xs text-sky-300 font-bold flex items-center gap-1.5">
          <ScrollText className="w-4 h-4 text-sky-400" />
          <span>{isEn ? 'LIVE CRISIS RESPONSE LOG' : '실시간 언론 대응 상황 일지'}</span>
        </div>
        <span className="text-[10px] font-pixel text-slate-500">
          {isEn ? `${logs.length} entries` : `기록 ${logs.length}건`}
        </span>
      </div>

      <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-xs text-slate-500 font-pixel py-4 text-center">
            {isEn ? 'No battle actions recorded yet.' : '아직 기록된 대응 로그가 없습니다.'}
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              className={`p-2.5 rounded border text-xs leading-relaxed ${toneStyle[entry.tone]}`}
            >
              <div className="flex items-center justify-between gap-2 font-pixel text-[11px] font-bold mb-0.5">
                <span>{isEn ? entry.titleEn : entry.titleKo}</span>
                <span className="text-[10px] opacity-75 shrink-0">
                  {entry.turn > 0 ? (isEn ? `Turn ${entry.turn}` : `${entry.turn}턴`) : 'OPEN'}
                </span>
              </div>
              <p className="text-[11px] opacity-95">{isEn ? entry.bodyEn : entry.bodyKo}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
