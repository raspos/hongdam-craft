import { BambooCategory, BambooPost, BambooReactionType } from '../types/game';
import { PRESET_BAMBOO_POSTS } from './presetPosts';

const DEMO_SANDBOX_POSTS_KEY = 'hongdam_demo_sandbox_posts_v2';
const USER_REACTIONS_KEY = 'hongdam_bamboo_reactions_v2';
const HIDDEN_POST_IDS_KEY = 'hongdam_bamboo_hidden_ids_v2';
const REPORTED_POST_IDS_KEY = 'hongdam_bamboo_reported_ids_v2';
const CLIENT_REPORTER_TOKEN_KEY = 'hongdam_bamboo_reporter_token_v1';
const LAST_POST_TIMESTAMP_KEY = 'hongdam_bamboo_last_post_ts_v2';
const CUSTOM_SUPABASE_URL_KEY = 'hongdam_supabase_url';
const CUSTOM_SUPABASE_ANON_KEY = 'hongdam_supabase_anon_key';

const RATE_LIMIT_MS = 20_000; // 20s posting cooldown

export interface SupabaseConfig {
  url: string;
  anonKey: string;
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
  return getSupabaseConfig() !== null;
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

/**
 * Fetches community posts:
 * - When Supabase is configured: queries `hongdam_posts` via REST API.
 * - When in Demo Mode: returns only this browser's explicitly labeled `[내 브라우저 데모 글]` + `[예시 글]` presets.
 */
export async function fetchBambooPosts(includePresets = true): Promise<{
  posts: BambooPost[];
  mode: 'supabase_cloud' | 'demo_sandbox';
}> {
  const hidden = getHiddenPostIds();
  const cfg = getSupabaseConfig();

  if (cfg) {
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/hongdam_posts?select=*&report_count=lt.5&order=created_at.desc&limit=100`,
        {
          headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
            Accept: 'application/json',
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Record<string, unknown>[];
        const cloudPosts: BambooPost[] = rows
          .map((r) => ({
            id: String(r.id),
            authorNickname: String(r.author_nickname || '익명 홍담'),
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

        const combined = includePresets
          ? [...cloudPosts, ...PRESET_BAMBOO_POSTS.filter((p) => !hidden.has(p.id))]
          : cloudPosts;
        return { posts: combined, mode: 'supabase_cloud' };
      }
    } catch (err) {
      console.warn('Supabase connection failed; falling back to explicit Demo Sandbox mode', err);
    }
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

  const cfg = getSupabaseConfig();
  const basePost: BambooPost = {
    id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
    isLocalDemoOnly: !cfg,
    reportCount: 0,
    reactions: {
      soju: 0,
      summon_reporter: 0,
      call_chairman: 0,
      comfort: 0,
      congrats: 0,
    },
  };

  if (cfg) {
    try {
      const res = await fetch(`${cfg.url}/rest/v1/hongdam_posts`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
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
          basePost.isLocalDemoOnly = false;
        }
        try {
          localStorage.setItem(LAST_POST_TIMESTAMP_KEY, String(Date.now()));
        } catch {}
        return { ok: true, post: basePost };
      }
    } catch (err) {
      console.warn('Supabase insert failed, saving in explicit Demo Sandbox', err);
    }
  }

  // Explicit Demo Sandbox save
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

  const nextReactions = {
    ...post.reactions,
    [reaction]: (post.reactions[reaction] || 0) + 1,
  };

  if (post.isLocalDemoOnly) {
    const demo = loadDemoSandboxPosts().map((p) =>
      p.id === post.id ? { ...p, reactions: nextReactions } : p
    );
    saveDemoSandboxPosts(demo);
    return true;
  }

  const cfg = getSupabaseConfig();
  if (cfg && !post.isPresetSample) {
    try {
      await fetch(`${cfg.url}/rest/v1/rpc/increment_hongdam_reaction`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_post_id: post.id,
          p_reaction_key: reaction,
        }),
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

  // Deduplicate reports per browser/client token
  try {
    const raw = JSON.parse(localStorage.getItem(REPORTED_POST_IDS_KEY) || '[]');
    const reportedSet = new Set<string>(Array.isArray(raw) ? raw : []);
    if (reportedSet.has(post.id)) return;
    reportedSet.add(post.id);
    localStorage.setItem(REPORTED_POST_IDS_KEY, JSON.stringify(Array.from(reportedSet)));
  } catch {}

  const cfg = getSupabaseConfig();
  if (cfg && !post.isPresetSample && !post.isLocalDemoOnly) {
    try {
      await fetch(`${cfg.url}/rest/v1/rpc/report_hongdam_post`, {
        method: 'POST',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_post_id: post.id,
          p_reporter_token: getOrCreateReporterToken(),
        }),
      });
    } catch {}
  }
}

export async function adminDeletePost(
  post: BambooPost,
  passcodeInput: string
): Promise<{ ok: boolean; messageKo: string; messageEn: string }> {
  const expectedEnvPass = (import.meta.env.VITE_ADMIN_DELETE_PASSCODE as string | undefined)?.trim();
  const cfg = getSupabaseConfig();

  if (cfg && !post.isLocalDemoOnly && !post.isPresetSample) {
    if (!expectedEnvPass || passcodeInput.trim() !== expectedEnvPass) {
      return {
        ok: false,
        messageKo: '관리자 삭제 인증 코드가 일치하지 않습니다.',
        messageEn: 'Invalid administrator passcode.',
      };
    }
    try {
      const res = await fetch(`${cfg.url}/rest/v1/hongdam_posts?id=eq.${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      });
      if (!res.ok) throw new Error('Delete failed');
      addHiddenPostId(post.id);
      return { ok: true, messageKo: '공용 DB에서 게시글이 삭제되었습니다.', messageEn: 'Post deleted from cloud DB.' };
    } catch {
      return { ok: false, messageKo: 'DB 삭제 요청에 실패했습니다.', messageEn: 'Failed to delete from DB.' };
    }
  }

  // Demo mode: allow deleting local demo posts or hiding presets with demo passcode ('hongdam-admin' or env passcode)
  const validDemoPass = expectedEnvPass || 'hongdam-admin';
  if (passcodeInput.trim() !== validDemoPass) {
    return {
      ok: false,
      messageKo: '데모 관리자 코드(기본값: hongdam-admin)가 일치하지 않습니다.',
      messageEn: 'Invalid demo admin code (default: hongdam-admin).',
    };
  }

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
