/**
 * Official empirical press dispute statistics from the Press Arbitration Commission of Korea
 * (언론중재위원회 공식 연간보고서 및 언론조정중재 통계, 2021–2024, https://www.pac.or.kr).
 *
 * Used strictly as real-world empirical reference alongside HONGDAM CRAFT's virtual rules.
 */

export interface AnnualArbitrationStat {
  year: number;
  totalClaims: number;
  reliefRatePct: number;
  onlineMediaSharePct: number;
}

export interface ClaimTypeBreakdown {
  id: 'correction' | 'damages' | 'rebuttal' | 'followup';
  nameKo: string;
  nameEn: string;
  cases2024: number;
  sharePct: number;
  color: string;
  gameMappingKo: string;
  gameMappingEn: string;
}

export interface MediaTypeShare {
  nameKo: string;
  nameEn: string;
  cases2023: number;
  sharePct: number;
  color: string;
}

export const PAC_ANNUAL_TREND: AnnualArbitrationStat[] = [
  { year: 2021, totalClaims: 3413, reliefRatePct: 75.3, onlineMediaSharePct: 76.4 },
  { year: 2022, totalClaims: 3175, reliefRatePct: 71.9, onlineMediaSharePct: 78.1 },
  { year: 2023, totalClaims: 4085, reliefRatePct: 74.1, onlineMediaSharePct: 78.5 },
  { year: 2024, totalClaims: 3937, reliefRatePct: 72.5, onlineMediaSharePct: 80.9 },
];

export const PAC_2024_CLAIM_TYPES: ClaimTypeBreakdown[] = [
  {
    id: 'correction',
    nameKo: '정정보도청구',
    nameEn: 'Factual Correction Claim',
    cases2024: 1824,
    sharePct: 46.3,
    color: '#38bdf8',
    gameMappingKo: '게임 내 #06 사내 팩트체크 + #18 잘못된 정보 정정 루트에 대응',
    gameMappingEn: 'Maps to #06 Internal Fact-Check + #18 Request Factual Correction',
  },
  {
    id: 'damages',
    nameKo: '손해배상청구',
    nameEn: 'Monetary Damages Claim',
    cases2024: 1231,
    sharePct: 31.3,
    color: '#a855f7',
    gameMappingKo: '게임 내 #10 법무팀 긴급 소집 + #15 법적 대응 경고 루트에 대응',
    gameMappingEn: 'Maps to #10 Mobilize Legal Team + #15 Threaten Legal Action',
  },
  {
    id: 'rebuttal',
    nameKo: '반론보도청구',
    nameEn: 'Right-of-Reply (Rebuttal) Claim',
    cases2024: 825,
    sharePct: 21.0,
    color: '#10b981',
    gameMappingKo: '게임 내 #04 공식 해명자료 배포 및 [반론 충실 반영] 해결 등급에 대응',
    gameMappingEn: 'Maps to #04 Official Press Statement & [Balanced Rebuttal] resolution',
  },
  {
    id: 'followup',
    nameKo: '추후보도청구',
    nameEn: 'Subsequent (Follow-Up) Report Claim',
    cases2024: 57,
    sharePct: 1.4,
    color: '#f59e0b',
    gameMappingKo: '수사·재판 종결 후 무혐의 후속 보도를 구하는 사후 구제 절차',
    gameMappingEn: 'Post-investigation follow-up reporting after legal exoneration',
  },
];

export const PAC_2023_MEDIA_SHARES: MediaTypeShare[] = [
  { nameKo: '인터넷신문', nameEn: 'Online Newspapers', cases2023: 2491, sharePct: 61.0, color: '#f43f5e' },
  { nameKo: '인터넷뉴스서비스(포털 등)', nameEn: 'News Portals / Aggregators', cases2023: 498, sharePct: 12.2, color: '#fb923c' },
  { nameKo: '일간신문(지면)', nameEn: 'Print Dailies', cases2023: 388, sharePct: 9.5, color: '#38bdf8' },
  { nameKo: '방송(지상파·종편·보도)', nameEn: 'Broadcast TV/Radio', cases2023: 345, sharePct: 8.4, color: '#a855f7' },
  { nameKo: '뉴스통신·기타', nameEn: 'Wire Services & Others', cases2023: 363, sharePct: 8.9, color: '#64748b' },
];
