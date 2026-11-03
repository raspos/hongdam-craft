import React, { useEffect, useRef, useState } from 'react';
import { BarChart2, Eye, Users, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  fetchGlobalOrLocalFunnel,
  FunnelSnapshot,
  getRemoteCounter,
  hitRemoteCounter,
} from '../utils/funnelTracker';

interface PublicVisitorStats {
  today: number;
  total: number;
  isRemoteVerified: boolean;
}

export const VisitorCounter: React.FC = () => {
  const { isEn } = useLanguage();
  const fetchedRef = useRef(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [funnel, setFunnel] = useState<FunnelSnapshot | null>(null);

  const [stats, setStats] = useState<PublicVisitorStats>(() => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const savedDate = localStorage.getItem('hcraft_pub_date_v1');
      const savedToday = parseInt(localStorage.getItem('hcraft_pub_today_v1') || '1', 10);
      const savedTotal = parseInt(localStorage.getItem('hcraft_pub_total_v1') || '1', 10);
      return {
        today: savedDate === dateStr ? Math.max(1, savedToday) : 1,
        total: Math.max(1, savedTotal),
        isRemoteVerified: false,
      };
    } catch {
      return { today: 1, total: 1, isRemoteVerified: false };
    }
  });

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const sessionKey = 'hcraft_pub_session_counted_v1';
    let isNewSession = true;
    try {
      isNewSession = !sessionStorage.getItem(sessionKey);
    } catch {
      isNewSession = false;
    }

    const totalKey = 'raspos_hongdam_craft_total_v1';
    const todayKey = `raspos_hongdam_craft_d_${dateStr}`;

    const updateGlobalVisitorCount = async () => {
      try {
        const fn = isNewSession ? hitRemoteCounter : getRemoteCounter;
        const [totalHit, todayHit] = await Promise.all([fn(totalKey), fn(todayKey)]);

        if (!totalHit && !todayHit) {
          return;
        }

        setStats((prev) => {
          const currentTotal = totalHit ? Math.max(1, totalHit.value) : prev.total;
          const currentToday = todayHit ? Math.max(1, todayHit.value) : prev.today;

          try {
            localStorage.setItem('hcraft_pub_date_v1', dateStr);
            localStorage.setItem('hcraft_pub_today_v1', String(currentToday));
            localStorage.setItem('hcraft_pub_total_v1', String(currentTotal));
            if (isNewSession) {
              sessionStorage.setItem(sessionKey, '1');
            }
          } catch {}

          return {
            today: currentToday,
            total: currentTotal,
            isRemoteVerified: true,
          };
        });
      } catch {
        // Offline environment: retain local cache strictly marked as unverified
      }
    };

    void updateGlobalVisitorCount();
  }, []);

  useEffect(() => {
    if (!showFunnel) return;
    let cancelled = false;
    const load = () => {
      fetchGlobalOrLocalFunnel().then((snap) => {
        if (!cancelled) setFunnel(snap);
      });
    };
    load();
    window.addEventListener('hcraft_funnel_updated', load);
    return () => {
      cancelled = true;
      window.removeEventListener('hcraft_funnel_updated', load);
    };
  }, [showFunnel]);

  const pctOfVisit = (val: number, visit: number) =>
    visit > 0 ? `${Math.min(100, Math.round((val / visit) * 100))}%` : '0%';

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className="inline-flex flex-wrap items-center justify-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none"
        title={
          stats.isRemoteVerified
            ? isEn
              ? 'Browser session hits synced via public counter API (not deduplicated unique individuals)'
              : '브라우저 세션 기준 공용 카운터 API 집계 수치 (순방문자 UV와는 다를 수 있음)'
            : isEn
              ? 'Counter API unreachable — displaying browser local cache'
              : '외부 카운터 연결 대기/오프라인 — 브라우저 로컬 캐시 표시 중'
        }
      >
        <div className="flex items-center gap-1.5 text-slate-400">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-bold text-slate-300">
            {isEn ? 'TODAY (SESSIONS)' : '오늘 접속(세션)'}
          </span>
          <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
            {stats.today.toLocaleString()}
          </span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-slate-300">
            {isEn ? 'TOTAL (SESSIONS)' : '누적 접속'}
          </span>
          <span className="font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
            {stats.total.toLocaleString()}
          </span>
          {!stats.isRemoteVerified && (
            <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-950 border border-slate-800">
              {isEn ? 'local' : '로컬캐시'}
            </span>
          )}
        </div>

        <span className="text-slate-700">|</span>

        <button
          type="button"
          onClick={() => setShowFunnel((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-400 text-[11px] text-indigo-300 transition-colors"
        >
          <BarChart2 className="w-3 h-3" />
          <span>{isEn ? 'Player Funnel' : '전환 퍼널'}</span>
        </button>
      </div>

      {showFunnel && funnel && (
        <div className="w-full max-w-xl bg-slate-900/95 border border-indigo-500/50 rounded-lg p-3 text-left font-pixel text-[11px] space-y-2 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="text-indigo-300 font-bold">
              📈{' '}
              {isEn
                ? `Conversion Funnel (${funnel.isRemoteVerified ? 'Public Session Counter' : 'This Browser Only'})`
                : `방문자 → 플레이어 전환 퍼널 (${funnel.isRemoteVerified ? '공용 세션 집계' : '내 브라우저 기준'})`}
            </span>
            <button
              type="button"
              onClick={() => setShowFunnel(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center">
            {[
              { ko: '1. 페이지 방문', en: '1. Visit', val: funnel.visit, color: 'text-slate-200' },
              { ko: '2. 게임 시작', en: '2. Start', val: funnel.start, color: 'text-sky-300' },
              { ko: '3. 1단계 돌파', en: '3. Stage 1', val: funnel.stage1_clear, color: 'text-emerald-300' },
              { ko: '4. 최종 엔딩', en: '4. Ending', val: funnel.ending, color: 'text-amber-300' },
              { ko: '5. 결과 공유', en: '5. Share', val: funnel.share, color: 'text-rose-300' },
            ].map((item) => (
              <div key={item.en} className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-[9px] text-slate-400 truncate">{isEn ? item.en : item.ko}</div>
                <div className={`text-xs font-bold mt-0.5 ${item.color}`}>
                  {item.val.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">{pctOfVisit(item.val, funnel.visit)}</div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 leading-snug">
            {isEn
              ? '※ Visit counts deduplicate per browser session; Start / Stage 1 / Ending / Share deduplicate per unique playthrough (playId).'
              : '※ 방문은 브라우저 세션당 1회, 시작·1단계 돌파·엔딩·공유는 고유 플레이(playId)당 1회씩 구분 집계됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
};
