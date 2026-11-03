import React, { useEffect, useRef, useState } from 'react';
import { Eye, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface PublicVisitorStats {
  today: number;
  total: number;
}

export const VisitorCounter: React.FC = () => {
  const { isEn } = useLanguage();
  const fetchedRef = useRef(false);

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
      };
    } catch {
      return { today: 1, total: 1 };
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
        const action = isNewSession ? 'hit' : 'get';

        const [totalRes, todayRes] = await Promise.allSettled([
          fetch(`https://countapi.mileshilliard.com/api/v1/${action}/${totalKey}`).then((r) => r.json()),
          fetch(`https://countapi.mileshilliard.com/api/v1/${action}/${todayKey}`).then((r) => r.json()),
        ]);

        setStats((prev) => {
          let currentTotal = prev.total;
          let currentToday = prev.today;

          if (
            totalRes.status === 'fulfilled' &&
            totalRes.value &&
            typeof totalRes.value.value === 'number'
          ) {
            currentTotal = Math.max(1, totalRes.value.value);
          } else if (isNewSession) {
            currentTotal += 1;
          }

          if (
            todayRes.status === 'fulfilled' &&
            todayRes.value &&
            typeof todayRes.value.value === 'number'
          ) {
            currentToday = Math.max(1, todayRes.value.value);
          } else if (isNewSession) {
            currentToday += 1;
          }

          try {
            localStorage.setItem('hcraft_pub_date_v1', dateStr);
            localStorage.setItem('hcraft_pub_today_v1', String(currentToday));
            localStorage.setItem('hcraft_pub_total_v1', String(currentTotal));
            if (isNewSession) {
              sessionStorage.setItem(sessionKey, '1');
            }
          } catch {
            // ignore storage quota errors
          }

          return { today: currentToday, total: currentTotal };
        });
      } catch {
        // Fallback to cached visitor stats when offline
      }
    };

    void updateGlobalVisitorCount();
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none"
      title={
        isEn
          ? 'Actual total visitors across all devices (Global public counter)'
          : '실제 전체 사이트 접속자 수 (글로벌 공용 카운터)'
      }
    >
      <div className="flex items-center gap-1.5 text-slate-400">
        <Eye className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold text-slate-300">{isEn ? 'TODAY' : '오늘 방문'}</span>
        <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
          {stats.today.toLocaleString()}
        </span>
      </div>

      <span className="text-slate-700">|</span>

      <div className="flex items-center gap-1.5 text-slate-400">
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-bold text-slate-300">{isEn ? 'TOTAL' : '누적 방문'}</span>
        <span className="font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
          {stats.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
