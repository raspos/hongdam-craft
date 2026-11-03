import { getSupabaseConfig } from '../community/communityService';

export type FunnelStepId = 'visit' | 'start' | 'stage1_clear' | 'ending' | 'share';

export interface FunnelSnapshot {
  visit: number;
  start: number;
  stage1_clear: number;
  ending: number;
  share: number;
  isRemoteVerified: boolean;
  sourceLabel: 'supabase' | 'countapi' | 'local';
}

const LOCAL_FUNNEL_KEY = 'hcraft_local_funnel_v1';
const DEDUPE_PREFIX = 'hcraft_f_done_v1_';

const REMOTE_KEYS: Record<FunnelStepId, string> = {
  visit: 'raspos_hc_f_visit_v1',
  start: 'raspos_hc_f_start_v1',
  stage1_clear: 'raspos_hc_f_stg1_v1',
  ending: 'raspos_hc_f_end_v1',
  share: 'raspos_hc_f_share_v1',
};

export async function hitRemoteCounter(counterKey: string): Promise<{ value: number; source: 'supabase' | 'countapi' } | null> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/rpc/increment_hongdam_counter`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_key: counterKey }),
      });
      if (res.ok) {
        const val = Number(await res.json());
        if (Number.isFinite(val)) return { value: val, source: 'supabase' };
      }
    } catch {}
  }

  try {
    const res = await fetch(`https://countapi.mileshilliard.com/api/v1/hit/${counterKey}`);
    const json = (await res.json()) as { value?: number };
    if (typeof json?.value === 'number') {
      return { value: json.value, source: 'countapi' };
    }
  } catch {}
  return null;
}

export async function getRemoteCounter(counterKey: string): Promise<{ value: number; source: 'supabase' | 'countapi' } | null> {
  const cfg = getSupabaseConfig();
  if (cfg) {
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/hongdam_counters?select=value&counter_key=eq.${encodeURIComponent(counterKey)}&limit=1`,
        {
          headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as { value?: number }[];
        if (Array.isArray(rows) && typeof rows[0]?.value === 'number') {
          return { value: Number(rows[0].value), source: 'supabase' };
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(`https://countapi.mileshilliard.com/api/v1/get/${counterKey}`);
    const json = (await res.json()) as { value?: number };
    if (typeof json?.value === 'number') {
      return { value: json.value, source: 'countapi' };
    }
  } catch {}
  return null;
}

function readLocalFunnel(): Record<FunnelStepId, number> {
  const fallback: Record<FunnelStepId, number> = {
    visit: 1,
    start: 0,
    stage1_clear: 0,
    ending: 0,
    share: 0,
  };
  try {
    const raw = localStorage.getItem(LOCAL_FUNNEL_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Record<FunnelStepId, number>>;
    return {
      visit: Math.max(1, Number(parsed.visit) || 1),
      start: Math.max(0, Number(parsed.start) || 0),
      stage1_clear: Math.max(0, Number(parsed.stage1_clear) || 0),
      ending: Math.max(0, Number(parsed.ending) || 0),
      share: Math.max(0, Number(parsed.share) || 0),
    };
  } catch {
    return fallback;
  }
}

function writeLocalFunnel(data: Record<FunnelStepId, number>): void {
  try {
    localStorage.setItem(LOCAL_FUNNEL_KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Records a conversion funnel step once per scopeKey (session for 'visit', playId for gameplay steps).
 */
export function trackFunnelStep(step: FunnelStepId, scopeId?: string): void {
  if (typeof window === 'undefined') return;

  const dedupeKey = `${DEDUPE_PREFIX}${step}_${scopeId || 'session'}`;
  try {
    const store = step === 'visit' ? sessionStorage : localStorage;
    if (store.getItem(dedupeKey)) return;
    store.setItem(dedupeKey, '1');
  } catch {}

  const local = readLocalFunnel();
  local[step] = (local[step] || 0) + 1;
  writeLocalFunnel(local);

  try {
    window.dispatchEvent(new Event('hcraft_funnel_updated'));
  } catch {}

  void hitRemoteCounter(REMOTE_KEYS[step]).then((res) => {
    if (res) {
      try {
        window.dispatchEvent(new Event('hcraft_funnel_updated'));
      } catch {}
    }
  });
}

export async function fetchGlobalOrLocalFunnel(): Promise<FunnelSnapshot> {
  const local = readLocalFunnel();
  if (typeof window === 'undefined') {
    return { ...local, isRemoteVerified: false, sourceLabel: 'local' };
  }

  try {
    const entries = await Promise.allSettled(
      (Object.keys(REMOTE_KEYS) as FunnelStepId[]).map(async (step) => {
        const hit = await getRemoteCounter(REMOTE_KEYS[step]);
        return { step, hit };
      })
    );

    let anyRemote = false;
    let sourceLabel: FunnelSnapshot['sourceLabel'] = 'local';
    const result: Record<FunnelStepId, number> = { ...local };
    entries.forEach((entry) => {
      if (entry.status === 'fulfilled' && entry.value.hit) {
        anyRemote = true;
        if (entry.value.hit.source === 'supabase') sourceLabel = 'supabase';
        else if (sourceLabel === 'local') sourceLabel = 'countapi';
        result[entry.value.step] = Math.max(local[entry.value.step], entry.value.hit.value);
      }
    });

    result.visit = Math.max(1, result.visit, result.start);
    return { ...result, isRemoteVerified: anyRemote, sourceLabel };
  } catch {
    return { ...local, isRemoteVerified: false, sourceLabel: 'local' };
  }
}
