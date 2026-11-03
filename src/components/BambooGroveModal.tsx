import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Cloud,
  Database,
  Flag,
  MessageSquareText,
  Send,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import {
  adminDeletePost,
  createBambooPost,
  fetchBambooPosts,
  getSupabaseConfig,
  getUserVotedReactions,
  reportAndHidePost,
  saveCustomSupabaseConfig,
  toggleBambooReaction,
} from '../community/communityService';
import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { ENDINGS, PR_ARCHETYPES } from '../data/endings';
import { useLanguage } from '../i18n/LanguageContext';
import { BambooCategory, BambooPost, BambooReactionType, GameState } from '../types/game';
import { sound } from '../utils/sound';

interface BambooGroveModalProps {
  state: GameState;
  onClose: () => void;
}

const CATEGORIES: { id: BambooCategory; ko: string; en: string }[] = [
  { id: 'all', ko: '전체', en: 'All' },
  { id: 'defense_win', ko: '오늘 막은 기사', en: 'Saved Headlines' },
  { id: 'survival_log', ko: '홍담 생존기', en: 'PR Survival' },
  { id: 'hangover', ko: '폭탄주 후기', en: 'Bomb-Shot Tales' },
  { id: 'chairman_risk', ko: '회장님 리스크', en: 'Chairman Risk' },
  { id: 'resign_escape', ko: '사표 고민', en: 'Resignation Thoughts' },
];

const REACTIONS: { id: BambooReactionType; icon: string; ko: string; en: string }[] = [
  { id: 'soju', icon: '🍶', ko: '소주 한잔', en: 'Have a Soju' },
  { id: 'summon_reporter', icon: '📰', ko: '기자 소환', en: 'Press Alert' },
  { id: 'call_chairman', icon: '⚡', ko: '회장님 호출', en: 'Chairman Call' },
  { id: 'comfort', icon: '🫂', ko: '위로합니다', en: 'Stay Strong' },
  { id: 'congrats', icon: '🎉', ko: '축하합니다', en: 'Congrats' },
];

export const BambooGroveModal: React.FC<BambooGroveModalProps> = ({ state, onClose }) => {
  const { isEn } = useLanguage();
  const [posts, setPosts] = useState<BambooPost[]>([]);
  const [mode, setMode] = useState<'supabase_cloud' | 'demo_sandbox'>('demo_sandbox');
  const [loading, setLoading] = useState(true);

  const [selectedCat, setSelectedCat] = useState<BambooCategory>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');

  // Form state
  const [nickname, setNickname] = useState(state.player.name || '');
  const [postCat, setPostCat] = useState<Exclude<BambooCategory, 'all'>>('survival_log');
  const [content, setContent] = useState('');
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>(() => getUserVotedReactions());

  // Optional Supabase Cloud Config Drawer
  const [showDbConfig, setShowDbConfig] = useState(false);
  const existingCfg = getSupabaseConfig();
  const [dbUrl, setDbUrl] = useState(existingCfg?.url || '');
  const [dbKey, setDbKey] = useState(existingCfg?.anonKey || '');

  // Admin Delete Prompt
  const [adminTargetPost, setAdminTargetPost] = useState<BambooPost | null>(null);
  const [adminCode, setAdminCode] = useState('');

  const loadPosts = async () => {
    setLoading(true);
    const res = await fetchBambooPosts(true);
    setPosts(res.posts);
    setMode(res.mode);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetchBambooPosts(true).then((res) => {
      if (!active) return;
      setPosts(res.posts);
      setMode(res.mode);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const endSum = state.endingSummary;
  const endingDef = endSum ? ENDINGS[endSum.endingId] : null;
  const archDef = endSum ? PR_ARCHETYPES[endSum.archetypeId] : null;

  const filteredPosts = useMemo(() => {
    const list = posts.filter((p) => selectedCat === 'all' || p.category === selectedCat);
    return [...list].sort((a, b) => {
      if (sortBy === 'popular') {
        const sumA = Object.values(a.reactions).reduce((x, y) => x + y, 0);
        const sumB = Object.values(b.reactions).reduce((x, y) => x + y, 0);
        if (sumB !== sumA) return sumB - sumA;
      }
      return b.createdAt - a.createdAt;
    });
  }, [posts, selectedCat, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scaleDef = COMPANY_SCALES[state.company.scale];
    const indDef = INDUSTRIES[state.company.industry];

    const res = await createBambooPost({
      authorNickname: nickname || (isEn ? 'Anon PR Chief' : '익명의 홍보팀장'),
      companyLabel: `${state.player.companyName} (${isEn ? `${scaleDef.nameEn}·${indDef.nameEn}` : `${scaleDef.nameKo}·${indDef.nameKo}`})`,
      endingBadgeKo: endingDef?.badgeKo,
      endingBadgeEn: endingDef?.badgeEn,
      archetypeBadgeKo: archDef?.nameKo,
      archetypeBadgeEn: archDef?.nameEn,
      category: postCat,
      content,
    });

    if (!res.ok) {
      sound.playWarning();
      setFormMsg({ ok: false, text: (isEn ? res.errorEn : res.errorKo) || 'Error' });
      return;
    }

    sound.playSuccess();
    setContent('');
    setFormMsg({
      ok: true,
      text:
        mode === 'supabase_cloud'
          ? isEn
            ? 'Posted to shared Bamboo Grove!'
            : '공용 대나무숲에 게시글이 등록되었습니다!'
          : isEn
            ? 'Saved in local Demo Sandbox mode (visible in this browser).'
            : '데모 모드: 현재 브라우저 데모 게시글로 등록되었습니다.',
    });
    loadPosts();
  };

  const handleReact = async (post: BambooPost, rType: BambooReactionType) => {
    const ok = await toggleBambooReaction(post, rType);
    if (!ok) return;
    sound.playBlip();
    setVotedMap(getUserVotedReactions());
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, reactions: { ...p.reactions, [rType]: (p.reactions[rType] || 0) + 1 } }
          : p
      )
    );
  };

  const handleReport = async (post: BambooPost) => {
    await reportAndHidePost(post);
    sound.playClick();
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  };

  const handleAdminDeleteConfirm = async () => {
    if (!adminTargetPost) return;
    const res = await adminDeletePost(adminTargetPost, adminCode);
    if (res.ok) {
      sound.playSuccess();
      setPosts((prev) => prev.filter((p) => p.id !== adminTargetPost.id));
      setAdminTargetPost(null);
      setAdminCode('');
    } else {
      sound.playWarning();
      setFormMsg({ ok: false, text: isEn ? res.messageEn : res.messageKo });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="pixel-card max-w-4xl w-full p-4 sm:p-6 border-emerald-500 my-auto max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <MessageSquareText className="w-5 h-5 text-emerald-400" />
              <h2 className="font-pixel text-base sm:text-xl text-white font-extrabold">
                {isEn
                  ? 'HONGDAM BAMBOO GROVE — Fought Headlines Today Too'
                  : '홍담 대나무숲 — 오늘도 기사와 싸웠다'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isEn
                ? 'Anonymous community lounge for PR chiefs to share crisis war stories and ending badges.'
                : '전국의 홍보팀장들이 오늘 막아낸(혹은 못 막은) 기사 무용담과 엔딩 배지를 나누는 익명 게시판입니다.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDbConfig(!showDbConfig)}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-emerald-300"
              title={isEn ? 'Configure Supabase Cloud DB' : '공용 Supabase DB 연결 설정'}
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explicit DB / Demo Mode Honesty Banner (Section 27 Mandatory Rule!) */}
        {mode === 'supabase_cloud' ? (
          <div className="bg-emerald-950/50 border border-emerald-500/70 rounded p-2.5 text-xs font-pixel text-emerald-200 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isEn
                ? '[CLOUD CONNECTED] Connected to shared Supabase database (hongdam_posts).'
                : '[실시간 공용 DB 연결됨] 외부 Supabase 데이터베이스와 연동되어 다른 사용자들과 게시글이 공유됩니다.'}
            </span>
          </div>
        ) : (
          <div className="bg-amber-950/60 border border-amber-500/80 rounded p-2.5 text-xs font-pixel text-amber-100 flex items-start gap-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">
                {isEn ? '[DEMO MODE — LOCAL SANDBOX] ' : '[데모 모드 안내] '}
              </span>
              <span>
                {isEn
                  ? 'No external Supabase key is currently configured. Preset stories are labeled [SAMPLE], and new posts are stored in this browser’s Demo Sandbox (never disguised as global user posts). Click ⚙️ to connect a Supabase project anytime.'
                  : '현재 공용 클라우드 DB 환경변수가 연결되지 않아 [데모 모드]로 동작 중입니다. 기본 수록글은 [예시 글]로 구분 표시되며, 작성하시는 글은 현재 브라우저 데모 저장소에 보관됩니다 (⚙️ 버튼에서 Supabase URL/Key 연결 가능).'}
              </span>
            </div>
          </div>
        )}

        {/* Optional Supabase Connection Panel */}
        {showDbConfig && (
          <div className="bg-slate-950 border border-emerald-500/60 rounded p-3 space-y-2 text-xs">
            <div className="font-pixel text-emerald-300 font-bold">
              🔌 {isEn ? 'Optional Supabase REST Connection' : '공용 Supabase DB 직접 연결 (선택)'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                className="voxel-input text-xs"
              />
              <input
                type="password"
                value={dbKey}
                onChange={(e) => setDbKey(e.target.value)}
                placeholder="Supabase anon public key"
                className="voxel-input text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  saveCustomSupabaseConfig(dbUrl, dbKey);
                  setShowDbConfig(false);
                  loadPosts();
                }}
                className="pixel-btn-mc pixel-btn-mc-primary px-3 py-1.5 text-xs"
              >
                {isEn ? 'Save & Reconnect' : '저장 및 재연결'}
              </button>
            </div>
          </div>
        )}

        {/* Write Post Form */}
        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={isEn ? 'Anonymous Nickname' : '익명 닉네임'}
                className="voxel-input py-1.5 text-xs font-pixel w-40"
              />
              <select
                value={postCat}
                onChange={(e) => setPostCat(e.target.value as Exclude<BambooCategory, 'all'>)}
                className="voxel-input py-1.5 text-xs font-pixel"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>
                    {isEn ? c.en : c.ko}
                  </option>
                ))}
              </select>
            </div>

            {endingDef && (
              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-pixel text-[11px]">
                🏅 {isEn ? `Auto-Badge: ${endingDef.badgeEn}` : `엔딩 배지 자동 첨부: ${endingDef.badgeKo}`}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              maxLength={350}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isEn
                  ? 'Share how you handled the press today (3–350 chars)...'
                  : '오늘 기자 대응 후기, 폭탄주 무용담, 엔딩 소감을 남겨보세요 (3~350자)...'
              }
              className="voxel-input flex-1 text-xs resize-none"
            />
            <button
              type="submit"
              className="pixel-btn-mc pixel-btn-mc-primary px-4 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isEn ? 'Post' : '글 남기기'}</span>
            </button>
          </div>

          {formMsg && (
            <div
              className={`text-[11px] font-pixel flex items-center gap-1.5 ${
                formMsg.ok ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{formMsg.text}</span>
            </div>
          )}
        </form>

        {/* Category Tabs & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  sound.playBlip();
                  setSelectedCat(c.id);
                }}
                className={`px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap border ${
                  selectedCat === c.id
                    ? 'bg-emerald-700 text-white border-emerald-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isEn ? c.en : c.ko}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs font-pixel">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-2 py-1 rounded border ${
                sortBy === 'latest'
                  ? 'bg-slate-800 text-amber-300 border-amber-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isEn ? 'Latest' : '최신순'}
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-2 py-1 rounded border ${
                sortBy === 'popular'
                  ? 'bg-slate-800 text-amber-300 border-amber-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isEn ? 'Top Reacted' : '공감순'}
            </button>
          </div>
        </div>

        {/* Admin Delete Inline Modal */}
        {adminTargetPost && (
          <div className="bg-rose-950/80 border border-rose-500 rounded p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-pixel">
            <div className="flex items-center gap-2 text-rose-200">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>
                {isEn
                  ? `Admin Delete [${adminTargetPost.authorNickname}]: Enter passcode`
                  : `[${adminTargetPost.authorNickname}] 게시글 관리자 삭제 코드 입력:`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder={mode === 'demo_sandbox' ? 'hongdam-admin' : 'Passcode'}
                className="voxel-input py-1 px-2 text-xs w-36"
              />
              <button
                onClick={handleAdminDeleteConfirm}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold"
              >
                {isEn ? 'Delete' : '삭제'}
              </button>
              <button
                onClick={() => setAdminTargetPost(null)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 font-pixel text-xs text-slate-400">
              {isEn ? 'Loading Bamboo Grove...' : '대나무숲 글을 불러오는 중...'}
            </div>
          ) : (
            filteredPosts.map((post) => {
              const catObj = CATEGORIES.find((c) => c.id === post.category);
              return (
                <div
                  key={post.id}
                  className="pixel-slot p-3 space-y-2 border-slate-800 hover:border-slate-700"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap font-pixel text-xs">
                      {post.isPresetSample && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 text-[10px] text-slate-300">
                          {isEn ? '[SAMPLE]' : '[예시 글]'}
                        </span>
                      )}
                      {post.isLocalDemoOnly && !post.isPresetSample && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500 text-[10px] text-indigo-200">
                          {isEn ? '[My Browser Demo]' : '[내 브라우저 데모 글]'}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-[10px] text-emerald-300">
                        {catObj ? (isEn ? catObj.en : catObj.ko) : post.category}
                      </span>
                      <span className="text-white font-bold">{post.authorNickname}</span>
                      {post.companyLabel && (
                        <span className="text-[11px] text-slate-400">· {post.companyLabel}</span>
                      )}
                      {(post.endingBadgeKo || post.endingBadgeEn) && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-600 text-[10px] text-amber-300">
                          🏆 {isEn ? post.endingBadgeEn || post.endingBadgeKo : post.endingBadgeKo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-pixel">
                      <button
                        onClick={() => handleReport(post)}
                        className="hover:text-amber-400 flex items-center gap-0.5"
                        title={isEn ? 'Report & Hide Post' : '신고 및 숨기기'}
                      >
                        <Flag className="w-3 h-3" />
                        <span>{isEn ? 'Hide' : '신고·숨김'}</span>
                      </button>
                      <button
                        onClick={() => setAdminTargetPost(post)}
                        className="hover:text-rose-400 flex items-center gap-0.5"
                        title={isEn ? 'Admin Delete' : '관리자 삭제'}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                    {isEn && post.contentEn ? post.contentEn : post.content}
                  </p>

                  {/* 5 Reaction Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {REACTIONS.map((rx) => {
                      const voted = Boolean(votedMap[`${post.id}_${rx.id}`]);
                      const count = post.reactions[rx.id] || 0;
                      return (
                        <button
                          key={rx.id}
                          onClick={() => handleReact(post, rx.id)}
                          className={`px-2 py-1 rounded text-[11px] font-pixel border transition-all flex items-center gap-1 ${
                            voted
                              ? 'bg-amber-950/80 border-amber-400 text-amber-200 font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <span>{rx.icon}</span>
                          <span>{isEn ? rx.en : rx.ko}</span>
                          <span className="text-amber-300 font-bold ml-0.5">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
