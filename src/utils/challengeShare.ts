import { COMPANY_SCALES, INDUSTRIES } from '../data/companies';
import { ENDINGS, PR_ARCHETYPES } from '../data/endings';
import { STAGE_RESOLUTION_META } from '../engine/progressionEngine';
import { CompanyScaleId, GameState, IndustryId, StageNumber } from '../types/game';
import { trackFunnelStep } from './funnelTracker';

export interface IncomingChallengeParams {
  seed: number;
  scale?: CompanyScaleId;
  industry?: IndustryId;
  expYears?: number;
  challengerName?: string;
  challengerRate?: number;
}

const VALID_SCALES: CompanyScaleId[] = ['startup', 'sme', 'midsize', 'large', 'chaebol'];
const VALID_INDUSTRIES: IndustryId[] = [
  'finance',
  'semiconductor',
  'automotive',
  'construction',
  'retail',
  'food',
  'platform',
  'gaming',
  'bio',
  'entertainment',
  'telecom',
  'defense',
];

export function parseChallengeFromUrl(): IncomingChallengeParams | null {
  if (typeof window === 'undefined') return null;
  try {
    const p = new URLSearchParams(window.location.search);
    const rawSeed = p.get('seed');
    if (!rawSeed) return null;
    const seed = Number(rawSeed) >>> 0;
    if (!seed) return null;

    const rawScale = p.get('scale') as CompanyScaleId | null;
    const rawInd = p.get('ind') as IndustryId | null;
    const rawExp = Number(p.get('exp'));
    const rawFrom = p.get('from');
    const rawRate = Number(p.get('rate'));

    return {
      seed,
      scale: rawScale && VALID_SCALES.includes(rawScale) ? rawScale : undefined,
      industry: rawInd && VALID_INDUSTRIES.includes(rawInd) ? rawInd : undefined,
      expYears: Number.isFinite(rawExp) && rawExp >= 1 && rawExp <= 20 ? Math.round(rawExp) : undefined,
      challengerName: rawFrom ? rawFrom.slice(0, 14) : undefined,
      challengerRate: Number.isFinite(rawRate) && rawRate >= 0 && rawRate <= 100 ? Math.round(rawRate) : undefined,
    };
  } catch {
    return null;
  }
}

export function clearChallengeParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    ['seed', 'scale', 'ind', 'exp', 'from', 'rate'].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, '', url.toString());
  } catch {}
}

export function buildChallengeUrl(state: GameState, defenseRatePct?: number): string {
  const base = 'https://raspos.github.io/hongdam-craft/';
  const params = new URLSearchParams();
  params.set('seed', String(state.seed >>> 0));
  params.set('scale', state.company.scale);
  params.set('ind', state.company.industry);
  params.set('exp', String(state.player.experienceYears));
  if (state.player.name) {
    params.set('from', state.player.name.slice(0, 12));
  }
  if (typeof defenseRatePct === 'number') {
    params.set('rate', String(Math.round(defenseRatePct)));
  }
  return `${base}?${params.toString()}`;
}

export interface ViralEndingDiagnosis {
  defenseRatePct: number;
  clearedCount: number;
  attemptedCount: number;
  pressTierKo: string;
  pressTierEn: string;
  repTierKo: string;
  repTierEn: string;
  punchlineKo: string;
  punchlineEn: string;
  challengeUrl: string;
}

export function buildEndingViralDiagnosis(state: GameState): ViralEndingDiagnosis {
  const endSum = state.endingSummary;
  const clearedCount = state.stageHistory.filter((h) => STAGE_RESOLUTION_META[h.resolution]?.isSuccess).length;
  const attemptedCount = Math.max(1, state.stageHistory.length || state.currentStage);
  const defenseRatePct = Math.round((clearedCount / 6) * 100);

  const avgTrust =
    state.journalistPool.length > 0
      ? state.journalistPool.reduce((s, j) => s + j.stats.intimacy, 0) / state.journalistPool.length
      : 50;
  const rep = state.resources.reputation;
  const risk = state.resources.risk;
  const hp = state.resources.hp;

  const pressTierKo =
    avgTrust >= 66 ? '상위권 (우군 다수)' : avgTrust >= 46 ? '중위권 (팽팽한 긴장)' : '하위권 (적대 감시)';
  const pressTierEn =
    avgTrust >= 66 ? 'Top Tier (Trusted)' : avgTrust >= 46 ? 'Mid Tier (Neutral)' : 'Bottom Tier (Hostile)';

  const repTierKo =
    rep >= 72 ? '최상위권' : rep >= 52 ? '안정권' : rep >= 35 ? '하위권' : '최하위권 (신뢰 추락)';
  const repTierEn =
    rep >= 72 ? 'Top Tier' : rep >= 52 ? 'Solid' : rep >= 35 ? 'Low Tier' : 'Bottom Tier';

  let punchlineKo = '기사는 막아냈지만 다음 마감 시계는 여전히 멈추지 않습니다.';
  let punchlineEn = 'You survived the headlines, though the newsroom clock never stops.';

  if (endSum?.endingId === 'ending_overwork_hospital' || hp <= 0) {
    punchlineKo = '회사의 기사 불길은 잡았지만 정작 홍보팀장 본인이 응급실로 실려 갔습니다.';
    punchlineEn = 'You shielded the company from headlines, only to land in the ER yourself.';
  } else if (endSum?.endingId === 'ending_lobby_exposed' || risk >= 95) {
    punchlineKo = '기사를 힘으로 덮으려다 ‘홍보팀 외압·공작’이 더 큰 메인 특종이 되었습니다.';
    punchlineEn = 'Trying to bury the story turned your own PR spin into the bigger scandal.';
  } else if (endSum?.endingId === 'ending_resignation_escape') {
    punchlineKo = '쏟아지는 단독 속보 앞에서 임원 승진 대신 ‘내 인생의 평화(사표)’를 택했습니다.';
    punchlineEn = 'Faced with endless scoops, you chose inner peace and handed in your badge.';
  } else if (avgTrust >= 62 && rep < 48) {
    punchlineKo = '기자와의 관계는 상위권이지만 기업 평판은 하위권 — 회사는 지켰으나 진실까지 지키진 못했습니다.';
    punchlineEn = 'High reporter rapport, low public trust—you saved the company, not the truth.';
  } else if (rep >= 70 && risk <= 25 && clearedCount === 6) {
    punchlineKo = '폭탄주·외압에 기대지 않고 팩트 검증과 정공법만으로 기사와 기업 신뢰를 모두 살려냈습니다!';
    punchlineEn = 'Zero dark spin—pure facts, accountability, and reform won over both press and public!';
  } else if (
    endSum &&
    STAGE_RESOLUTION_META[state.stageHistory[state.stageHistory.length - 1]?.resolution || 'calm_down'] &&
    clearedCount >= 5 &&
    risk >= 55
  ) {
    punchlineKo = '아슬아슬한 줄타기로 6관문을 넘겼지만 편집국 블랙리스트에 당신의 이름이 남았습니다.';
    punchlineEn = 'You survived all 6 crises on a razor’s edge, leaving dangerous footprints behind.';
  } else if (rep < 42) {
    punchlineKo = '당장의 급한 불은 껐지만 성난 여론과 추락한 평판이라는 더 큰 숙제를 남겼습니다.';
    punchlineEn = 'The immediate fire is out, yet public trust took a heavy hit.';
  } else {
    punchlineKo = '예산과 체력의 한계 속에서도 현실적인 타협점을 찾아 언론 위기를 돌파했습니다.';
    punchlineEn = 'Balancing scarce budget and stamina, you steered the company through the storm.';
  }

  const challengeUrl = buildChallengeUrl(state, defenseRatePct);

  return {
    defenseRatePct,
    clearedCount,
    attemptedCount,
    pressTierKo,
    pressTierEn,
    repTierKo,
    repTierEn,
    punchlineKo,
    punchlineEn,
    challengeUrl,
  };
}

export function buildStageSharePayload(state: GameState, stage: StageNumber, isEn: boolean) {
  const summary = state.lastStageSummary;
  const scaleDef = COMPANY_SCALES[state.company.scale];
  const indDef = INDUSTRIES[state.company.industry];
  const resMeta = summary ? STAGE_RESOLUTION_META[summary.resolution] : null;
  const url = buildChallengeUrl(state);

  if (isEn) {
    return {
      title: 'HONGDAM CRAFT — Media Crisis Challenge',
      text: `[HONGDAM CRAFT] STAGE ${stage}/6 (${scaleDef.nameEn} · ${indDef.nameEn})\nResult: Grade ${summary?.grade || 'B'} [${resMeta?.nameEn || 'Defended'}] (Final Pressure ${summary?.finalPressure ?? 50}%)\nCan you handle this exact same reporter & crisis better?`,
      url,
    };
  }

  return {
    title: '홍담 크래프트 — 같은 사건 위기대응 도전장',
    text: `[홍담 크래프트] STAGE ${stage} 위기 대응 완료! (${scaleDef.nameKo} · ${indDef.nameKo})\n▶ 결과: ${summary?.grade || 'B'}등급 [${resMeta?.nameKo || '방어 성공'}] (최종 보도압박 ${summary?.finalPressure ?? 50}%)\n같은 회사·같은 기자 조건에서 당신이라면 어떻게 막으시겠습니까?`,
    url,
  };
}

export function buildEndingSharePayload(state: GameState, isEn: boolean) {
  const endSum = state.endingSummary;
  const diag = buildEndingViralDiagnosis(state);
  const arch = endSum ? PR_ARCHETYPES[endSum.archetypeId] : null;
  const endDef = endSum ? ENDINGS[endSum.endingId] : null;
  const scaleDef = COMPANY_SCALES[state.company.scale];
  const indDef = INDUSTRIES[state.company.industry];

  if (isEn) {
    return {
      title: 'HONGDAM CRAFT — My PR Chief Report Card',
      text: `[HONGDAM CRAFT] PR Style: ‘${arch?.nameEn || 'PR Chief'}’ ${arch?.icon || '⚔️'}\n• Ending: ${endDef?.titleEn || ''}\n• Crisis Defense Rate: ${diag.defenseRatePct}% (${diag.clearedCount}/6) | Press: ${diag.pressTierEn} | Rep: ${diag.repTierEn}\n“${diag.punchlineEn}”\n👉 Try the exact same company & reporters (${scaleDef.nameEn} · ${indDef.nameEn}):`,
      url: diag.challengeUrl,
    };
  }

  return {
    title: '홍담 크래프트 — 나의 홍보팀장 성적표',
    text: `[홍담 크래프트] 당신은 8가지 홍보팀장 중 ‘${arch?.nameKo || '홍보팀장'}’ ${arch?.icon || '⚔️'} 입니다.\n• 최종 결과: ${endDef?.titleKo || ''}\n• 언론 방어율 ${diag.defenseRatePct}% (${diag.clearedCount}/6관문) · 기자 관계 ${diag.pressTierKo} · 기업 평판 ${diag.repTierKo}\n“${diag.punchlineKo}”\n👉 같은 기업(${scaleDef.nameKo}·${indDef.nameKo})·같은 기자 조건으로 도전하기:`,
    url: diag.challengeUrl,
  };
}

export async function shareOrCopyChallenge(
  payload: { title: string; text: string; url: string },
  playId?: string
): Promise<'shared' | 'copied'> {
  trackFunnelStep('share', playId);
  const fullText = `${payload.text}\n${payload.url}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return 'shared';
    } catch {
      // User cancelled or Web Share unsupported for payload; fall back to clipboard
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(fullText);
  }
  return 'copied';
}
