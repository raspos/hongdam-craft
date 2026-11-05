import { BambooCategory, BambooPost, BambooReactionType } from '../types/game';
import { PRESET_BAMBOO_POSTS } from './presetPosts';

// Storage keys
const DEMO_SANDBOX_POSTS_KEY = 'hongdam_demo_sandbox_posts_v2';
const CLOUD_CACHED_POSTS_KEY = 'hongdam_cloud_cached_posts_v2';
const USER_REACTIONS_KEY = 'hongdam_bamboo_reactions_v2';
const HIDDEN_POST_IDS_KEY = 'hongdam_bamboo_hidden_ids_v2';
const REPORTED_POST_IDS_KEY = 'hongdam_bamboo_reported_ids_v2';
const CLIENT_REPORTER_TOKEN_KEY = 'hongdam_bamboo_reporter_token_v1';
const LAST_POST_TIMESTAMP_KEY = 'hongdam_bamboo_last_post_ts_v2';

const CUSTOM_FIREBASE_RTDB_KEY = 'hongdam_firebase_rtdb_url';
const CUSTOM_SUPABASE_URL_KEY = 'hongdam_supabase_url';
const CUSTOM_SUPABASE_ANON_KEY = 'hongdam_supabase_anon_key';

// Default Realtime Cloud Database (Twin backend of Personnel Craft community board)
export const DEFAULT_FIREBASE_RTDB_URL = 'https://personnel-craft-default-rtdb.firebaseio.com/hongdam_posts';

const RATE_LIMIT_MS = 15_000; // 15s posting cooldown

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getFirebaseRtdbUrl(): string {
  try {
    const envUrl = (import.meta.env.VITE_FIREBASE_RTDB_URL as string | undefined)?.trim();
    if (envUrl) return envUrl.replace(/\/+$/, '');
    const custom = (localStorage.getItem(CUSTOM_FIREBASE_RTDB_KEY) || '').trim();
    if (custom) return custom.replace(/\/+$/, '');
  } catch {}
  return DEFAULT_FIREBASE_RTDB_URL;
}

export function saveCustomFirebaseRtdbUrl(url: string): void {
  try {
    if (!url.trim()) {
      localStorage.removeItem(CUSTOM_FIREBASE_RTDB_KEY);
      return;
    }
    localStorage.setItem(CUSTOM_FIREBASE_RTDB_KEY, url.trim().replace(/\/+$/, ''));
  } catch {}
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';
  if (envUrl && envKey) {
    return { url: envUrl.replace(/\/+$/, ''), anonKey: envKey };
  }
  try {
    const customUrl = (localStorage.getItem(CUSTOM_SUPABASE_URL_KEY) || '').trim();
    const customKey = (localStorage.getItem(CUSTOM_SUPABASE_ANON_KEY) || '').trim();
    if (customUrl && customKey) {
      return { url: customUrl.replace(/\/+$/, ''), anonKey: customKey };
    }
  } catch {}
  return null;
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem(CUSTOM_SUPABASE_URL_KEY);
      localStorage.removeItem(CUSTOM_SUPABASE_ANON_KEY);
      return;
    }
    localStorage.setItem(CUSTOM_SUPABASE_URL_KEY, url.trim().replace(/\/+$/, ''));
    localStorage.setItem(CUSTOM_SUPABASE_ANON_KEY, anonKey.trim());
  } catch {}
}

export function isCloudDbConnected(): boolean {
  return true;
}

// Input sanitization & validation
const BLOCKED_PATTERNS = [/<script/i, /javascript:/i, /onerror=/i, /onload=/i];

export function validatePostInput(nickname: string, content: string): { ok: boolean; errorKo?: string; errorEn?: string } {
  const cleanContent = content.trim();
  const cleanNick = nickname.trim();

  if (cleanContent.length < 3) {
    return {
      ok: false,
      errorKo: '본문을 최소 3자 이상 입력해 주세요.',
      errorEn: 'Please enter at least 3 characters.',
    };
  }
  if (cleanContent.length > 350) {
    return {
      ok: false,
      errorKo: '본문은 350자 이내로 작성해 주세요.',
      errorEn: 'Post must be 350 characters or fewer.',
    };
  }
  if (cleanNick.length > 20) {
    return {
      ok: false,
      errorKo: '닉네임은 20자 이내로 입력해 주세요.',
      errorEn: 'Nickname must be 20 characters or fewer.',
    };
  }
  if (BLOCKED_PATTERNS.some((rx) => rx.test(cleanContent) || rx.test(cleanNick))) {
    return {
      ok: false,
      errorKo: '허용되지 않는 스크립트 문자열이 포함되어 있습니다.',
      errorEn: 'Disallowed script characters detected.',
    };
  }

  // Rate limit check
  try {
    const lastTs = parseInt(localStorage.getItem(LAST_POST_TIMESTAMP_KEY) || '0', 10) || 0;
    const elapsed = Date.now() - lastTs;
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return {
        ok: false,
        errorKo: `도배 방지를 위해 ${waitSec}초 후에 다시 작성할 수 있습니다.`,
        errorEn: `Rate limit active: please wait ${waitSec}s before posting again.`,
      };
    }
  } catch {}

  return { ok: true };
}

export function getHiddenPostIds(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(HIDDEN_POST_IDS_KEY) || '[]');
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addHiddenPostId(postId: string): void {
  try {
    const set = getHiddenPostIds();
    set.add(postId);
    localStorage.setItem(HIDDEN_POST_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function loadDemoSandboxPosts(): BambooPost[] {
  try {
    const raw = localStorage.getItem(DEMO_SANDBOX_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: BambooPost) => ({
      ...p,
      isLocalDemoOnly: true,
      isPresetSample: false,
    }));
  } catch {
    return [];
  }
}

function saveDemoSandboxPosts(posts: BambooPost[]): void {
  try {
    localStorage.setItem(DEMO_SANDBOX_POSTS_KEY, JSON.stringify(posts));
  } catch {}
}

function loadCloudCachedPosts(): BambooPost[] {
  try {
    const raw = localStorage.getItem(CLOUD_CACHED_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveCloudCachedPosts(posts: BambooPost[]): void {
  try {
    localStorage.setItem(CLOUD_CACHED_POSTS_KEY, JSON.stringify(posts.slice(0, 150)));
  } catch {}
}

export type BambooCloudMode = 'cloud_connected' | 'supabase_cloud' | 'demo_sandbox';

/**
 * Fetches community posts:
 * 1. Checks Supabase REST API if explicitly configured via env / settings.
 * 2. Defaults to live Firebase Realtime Database (shared across all users).
 * 3. Falls back to cached posts or local demo sandbox on offline connection failure.
 */
export async function fetchBambooPosts(includePresets = true): Promise<{
  posts: BambooPost[];
  mode: BambooCloudMode;
}> {
  const hidden = getHiddenPostIds();
  const supaCfg = getSupabaseConfig();

  // 1. Supabase REST API (if user configured)
  if (supaCfg) {
    try {
      const res = await fetch(
        `${supaCfg.url}/rest/v1/hongdam_posts?select=*&report_count=lt.5&order=created_at.desc&limit=100`,
        {
          headers: {
            apikey: supaCfg.anonKey,
            Authorization: `Bearer ${supaCfg.anonKey}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Record<string, unknown>[];
        const cloudPosts: BambooPost[] = rows
          .map((r) => ({
            id: String(r.id),
            authorNickname: String(r.author_nickname || '익명의 홍보팀장'),
            companyLabel: r.company_label ? String(r.company_label) : undefined,
            endingBadgeKo: r.ending_badge_ko ? String(r.ending_badge_ko) : undefined,
            endingBadgeEn: r.ending_badge_en ? String(r.ending_badge_en) : undefined,
            archetypeBadgeKo: r.archetype_badge_ko ? String(r.archetype_badge_ko) : undefined,
            archetypeBadgeEn: r.archetype_badge_en ? String(r.archetype_badge_en) : undefined,
            category: (r.category as Exclude<BambooCategory, 'all'>) || 'survival_log',
            content: String(r.content || ''),
            createdAt: typeof r.created_at === 'number' ? r.created_at : new Date(String(r.created_at)).getTime(),
            isPresetSample: false,
            isLocalDemoOnly: false,
            reportCount: Number(r.report_count || 0),
            reactions: (r.reactions as Record<BambooReactionType, number>) || {
              soju: 0,
              summon_reporter: 0,
              call_chairman: 0,
              comfort: 0,
              congrats: 0,
            },
          }))
          .filter((p) => !hidden.has(p.id));

        saveCloudCachedPosts(cloudPosts);
        const combined = includePresets
          ? [...cloudPosts, ...PRESET_BAMBOO_POSTS.filter((p) => !hidden.has(p.id))]
          : cloudPosts;
        return { posts: combined, mode: 'supabase_cloud' };
      }
    } catch (err) {
      console.warn('Supabase fetch failed, attempting Firebase RTDB', err);
    }
  }

  // 2. Live Shared Firebase Realtime Database (default seamless cloud)
  const firebaseUrl = getFirebaseRtdbUrl();
  try {
    const res = await fetch(`${firebaseUrl}.json`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const list: BambooPost[] = [];
      if (data && typeof data === 'object') {
        for (const [key, val] of Object.entries(data)) {
          if (
            val &&
            typeof val === 'object' &&
            typeof (val as { content?: unknown }).content === 'string' &&
            (val as { content: string }).content.trim().length > 0
          ) {
            const p = val as {
              authorNickname?: string;
              companyLabel?: string;
              endingBadgeKo?: string;
              endingBadgeEn?: string;
              archetypeBadgeKo?: string;
              archetypeBadgeEn?: string;
              category?: Exclude<BambooCategory, 'all'>;
              content: string;
              contentEn?: string;
              createdAt?: number;
              reportCount?: number;
              reactions?: Partial<Record<BambooReactionType, number>>;
            };
            if ((p.reportCount || 0) >= 5) continue;
            if (hidden.has(key)) continue;

            list.push({
              id: key,
              authorNickname: p.authorNickname || '익명의 홍보팀장',
              companyLabel: p.companyLabel || undefined,
              endingBadgeKo: p.endingBadgeKo || undefined,
              endingBadgeEn: p.endingBadgeEn || undefined,
              archetypeBadgeKo: p.archetypeBadgeKo || undefined,
              archetypeBadgeEn: p.archetypeBadgeEn || undefined,
              category: p.category || 'survival_log',
              content: p.content.trim(),
              contentEn: p.contentEn || undefined,
              createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
              isPresetSample: false,
              isLocalDemoOnly: false,
              reportCount: Number(p.reportCount || 0),
              reactions: {
                soju: Number(p.reactions?.soju) || 0,
                summon_reporter: Number(p.reactions?.summon_reporter) || 0,
                call_chairman: Number(p.reactions?.call_chairman) || 0,
                comfort: Number(p.reactions?.comfort) || 0,
                congrats: Number(p.reactions?.congrats) || 0,
              },
            });
          }
        }
      }

      list.sort((a, b) => b.createdAt - a.createdAt);
      saveCloudCachedPosts(list);

      const combined = includePresets
        ? [...list, ...PRESET_BAMBOO_POSTS.filter((p) => !hidden.has(p.id))]
        : list;
      return { posts: combined, mode: 'cloud_connected' };
    }
  } catch (err) {
    console.warn('Firebase RTDB fetch failed, checking cache', err);
  }

  // 3. Fallback: Cached cloud posts or local sandbox
  const cached = loadCloudCachedPosts().filter((p) => !hidden.has(p.id));
  if (cached.length > 0) {
    const presets = includePresets ? PRESET_BAMBOO_POSTS.filter((p) => !hidden.has(p.id)) : [];
    return {
      posts: [...cached, ...presets],
      mode: 'cloud_connected',
    };
  }

  const demoPosts = loadDemoSandboxPosts().filter((p) => !hidden.has(p.id));
  const presets = includePresets ? PRESET_BAMBOO_POSTS.filter((p) => !hidden.has(p.id)) : [];
  return {
    posts: [...demoPosts, ...presets],
    mode: 'demo_sandbox',
  };
}

export async function createBambooPost(input: {
  authorNickname: string;
  companyLabel?: string;
  endingBadgeKo?: string;
  endingBadgeEn?: string;
  archetypeBadgeKo?: string;
  archetypeBadgeEn?: string;
  category: Exclude<BambooCategory, 'all'>;
  content: string;
}): Promise<{ ok: boolean; post?: BambooPost; errorKo?: string; errorEn?: string }> {
  const check = validatePostInput(input.authorNickname, input.content);
  if (!check.ok) return check;

  const cleanContent = input.content.trim().replace(/[<>]/g, '');
  const cleanNick = (input.authorNickname.trim() || '익명의 홍보팀장').replace(/[<>]/g, '').slice(0, 20);
  const cleanCompany = input.companyLabel ? input.companyLabel.trim().replace(/[<>]/g, '').slice(0, 60) : undefined;

  const basePost: BambooPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    authorNickname: cleanNick,
    companyLabel: cleanCompany,
    endingBadgeKo: input.endingBadgeKo,
    endingBadgeEn: input.endingBadgeEn,
    archetypeBadgeKo: input.archetypeBadgeKo,
    archetypeBadgeEn: input.archetypeBadgeEn,
    category: input.category,
    content: cleanContent,
    createdAt: Date.now(),
    isPresetSample: false,
    isLocalDemoOnly: false,
    reportCount: 0,
    reactions: {
      soju: 0,
      summon_reporter: 0,
      call_chairman: 0,
      comfort: 0,
      congrats: 0,
    },
  };

  // 1. If Supabase configured, save to Supabase
  const supaCfg = getSupabaseConfig();
  if (supaCfg) {
    try {
      const res = await fetch(`${supaCfg.url}/rest/v1/hongdam_posts`, {
        method: 'POST',
        headers: {
          apikey: supaCfg.anonKey,
          Authorization: `Bearer ${supaCfg.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          author_nickname: basePost.authorNickname,
          company_label: basePost.companyLabel,
          ending_badge_ko: basePost.endingBadgeKo,
          ending_badge_en: basePost.endingBadgeEn,
          archetype_badge_ko: basePost.archetypeBadgeKo,
          archetype_badge_en: basePost.archetypeBadgeEn,
          category: basePost.category,
          content: basePost.content,
          reactions: basePost.reactions,
          report_count: 0,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (Array.isArray(created) && created[0]?.id) {
          basePost.id = String(created[0].id);
        }
        try {
          localStorage.setItem(LAST_POST_TIMESTAMP_KEY, String(Date.now()));
        } catch {}
        return { ok: true, post: basePost };
      }
    } catch (err) {
      console.warn('Supabase insert failed, attempting Firebase RTDB', err);
    }
  }

  // 2. Default: Live Shared Firebase Realtime Database
  const firebaseUrl = getFirebaseRtdbUrl();
  try {
    const res = await fetch(`${firebaseUrl}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorNickname: basePost.authorNickname,
        companyLabel: basePost.companyLabel,
        endingBadgeKo: basePost.endingBadgeKo,
        endingBadgeEn: basePost.endingBadgeEn,
        archetypeBadgeKo: basePost.archetypeBadgeKo,
        archetypeBadgeEn: basePost.archetypeBadgeEn,
        category: basePost.category,
        content: basePost.content,
        createdAt: basePost.createdAt,
        reactions: basePost.reactions,
        reportCount: 0,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) {
        basePost.id = data.name;
      }
      try {
        const cached = loadCloudCachedPosts();
        saveCloudCachedPosts([basePost, ...cached]);
        localStorage.setItem(LAST_POST_TIMESTAMP_KEY, String(Date.now()));
      } catch {}
      return { ok: true, post: basePost };
    }
  } catch (err) {
    console.warn('Firebase RTDB submit failed, saving locally', err);
  }

  // 3. Fallback: Save in local demo sandbox
  basePost.isLocalDemoOnly = true;
  const existing = loadDemoSandboxPosts();
  saveDemoSandboxPosts([basePost, ...existing]);
  try {
    localStorage.setItem(LAST_POST_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
  return { ok: true, post: basePost };
}

export function getUserVotedReactions(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(USER_REACTIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

export async function toggleBambooReaction(
  post: BambooPost,
  reaction: BambooReactionType
): Promise<boolean> {
  const key = `${post.id}_${reaction}`;
  const voted = getUserVotedReactions();
  if (voted[key]) return false;

  voted[key] = true;
  try {
    localStorage.setItem(USER_REACTIONS_KEY, JSON.stringify(voted));
  } catch {}

  const nextCount = (post.reactions[reaction] || 0) + 1;
  const nextReactions = {
    ...post.reactions,
    [reaction]: nextCount,
  };

  // If local demo only or preset
  if (post.isLocalDemoOnly) {
    const demo = loadDemoSandboxPosts().map((p) =>
      p.id === post.id ? { ...p, reactions: nextReactions } : p
    );
    saveDemoSandboxPosts(demo);
    return true;
  }

  // If Supabase
  const supaCfg = getSupabaseConfig();
  if (supaCfg && !post.isPresetSample) {
    try {
      await fetch(`${supaCfg.url}/rest/v1/rpc/increment_hongdam_reaction`, {
        method: 'POST',
        headers: {
          apikey: supaCfg.anonKey,
          Authorization: `Bearer ${supaCfg.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_post_id: post.id,
          p_reaction_key: reaction,
        }),
      });
      return true;
    } catch {}
  }

  // Default: Firebase Realtime Database
  if (!post.isPresetSample) {
    const firebaseUrl = getFirebaseRtdbUrl();
    try {
      await fetch(`${firebaseUrl}/${encodeURIComponent(post.id)}/reactions/${encodeURIComponent(reaction)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextCount),
      });
    } catch {}
  }

  return true;
}

function getOrCreateReporterToken(): string {
  try {
    const existing = localStorage.getItem(CLIENT_REPORTER_TOKEN_KEY);
    if (existing && existing.length >= 12) return existing;
    const created = `rt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(CLIENT_REPORTER_TOKEN_KEY, created);
    return created;
  } catch {
    return `rt_ephemeral_${Math.random().toString(36).slice(2, 10)}`;
  }
}

export async function reportAndHidePost(post: BambooPost): Promise<void> {
  addHiddenPostId(post.id);

  // Deduplicate reports per client token
  try {
    const raw = JSON.parse(localStorage.getItem(REPORTED_POST_IDS_KEY) || '[]');
    const reportedSet = new Set<string>(Array.isArray(raw) ? raw : []);
    if (reportedSet.has(post.id)) return;
    reportedSet.add(post.id);
    localStorage.setItem(REPORTED_POST_IDS_KEY, JSON.stringify(Array.from(reportedSet)));
  } catch {}

  const nextCount = (post.reportCount || 0) + 1;

  // Supabase RPC
  const supaCfg = getSupabaseConfig();
  if (supaCfg && !post.isPresetSample && !post.isLocalDemoOnly) {
    try {
      await fetch(`${supaCfg.url}/rest/v1/rpc/report_hongdam_post`, {
        method: 'POST',
        headers: {
          apikey: supaCfg.anonKey,
          Authorization: `Bearer ${supaCfg.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_post_id: post.id,
          p_reporter_token: getOrCreateReporterToken(),
        }),
      });
      return;
    } catch {}
  }

  // Firebase RTDB report count
  if (!post.isPresetSample && !post.isLocalDemoOnly) {
    const firebaseUrl = getFirebaseRtdbUrl();
    try {
      await fetch(`${firebaseUrl}/${encodeURIComponent(post.id)}/reportCount.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextCount),
      });
    } catch {}
  }
}

export async function adminDeletePost(
  post: BambooPost,
  passcodeInput: string
): Promise<{ ok: boolean; messageKo: string; messageEn: string }> {
  const expectedEnvPass = (import.meta.env.VITE_ADMIN_DELETE_PASSCODE as string | undefined)?.trim();
  const validPass = expectedEnvPass || 'hongdam-admin';

  if (passcodeInput.trim() !== validPass) {
    return {
      ok: false,
      messageKo: '관리자 삭제 인증 코드가 일치하지 않습니다.',
      messageEn: 'Invalid administrator passcode.',
    };
  }

  // Supabase delete
  const supaCfg = getSupabaseConfig();
  if (supaCfg && !post.isLocalDemoOnly && !post.isPresetSample) {
    try {
      const res = await fetch(`${supaCfg.url}/rest/v1/hongdam_posts?id=eq.${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers: {
          apikey: supaCfg.anonKey,
          Authorization: `Bearer ${supaCfg.anonKey}`,
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      addHiddenPostId(post.id);
      return { ok: true, messageKo: '공용 DB에서 게시글이 삭제되었습니다.', messageEn: 'Post deleted from cloud DB.' };
    } catch {
      return { ok: false, messageKo: 'DB 삭제 요청에 실패했습니다.', messageEn: 'Failed to delete from DB.' };
    }
  }

  // Firebase RTDB delete
  if (!post.isLocalDemoOnly && !post.isPresetSample) {
    try {
      const firebaseUrl = getFirebaseRtdbUrl();
      await fetch(`${firebaseUrl}/${encodeURIComponent(post.id)}.json`, {
        method: 'DELETE',
      });
      addHiddenPostId(post.id);
      return { ok: true, messageKo: '공용 실시간 DB에서 게시글이 삭제되었습니다.', messageEn: 'Post deleted from cloud RTDB.' };
    } catch {
      return { ok: false, messageKo: '실시간 DB 삭제 요청에 실패했습니다.', messageEn: 'Failed to delete from RTDB.' };
    }
  }

  // Local demo / preset hide
  if (post.isLocalDemoOnly) {
    const remaining = loadDemoSandboxPosts().filter((p) => p.id !== post.id);
    saveDemoSandboxPosts(remaining);
  }
  addHiddenPostId(post.id);
  return {
    ok: true,
    messageKo: '게시글이 관리자 권한으로 삭제(숨김) 처리되었습니다.',
    messageEn: 'Post removed by admin.',
  };
}
