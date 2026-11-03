import {
  JournalistAppearance,
  JournalistArchetypeId,
  JournalistCounterSkillDef,
  JournalistCounterSkillId,
} from '../types/game';

export interface StatRange {
  min: number;
  max: number;
}

export interface JournalistArchetypeDef {
  id: JournalistArchetypeId;
  nameKo: string;
  nameEn: string;
  badgeIcon: string;
  personalityKo: string;
  personalityEn: string;
  specialAbilityKo: string;
  specialAbilityEn: string;
  culturalNoteEn: string;
  appearancePreset: JournalistAppearance;
  statRanges: {
    reportingPower: StatRange;
    persistence: StatRange;
    expertise: StatRange;
    sourceNetwork: StatRange;
    deadlineUrgency: StatRange;
    intimacy: StatRange;
    distrust: StatRange;
    evidenceLevel: StatRange;
  };
  preferredCounterSkills: JournalistCounterSkillId[];
  introLinesKo: string[];
  introLinesEn: string[];
  goodResponseLinesKo: string[];
  goodResponseLinesEn: string[];
  badResponseLinesKo: string[];
  badResponseLinesEn: string[];
}

export const JOURNALIST_ARCHETYPES: Record<JournalistArchetypeId, JournalistArchetypeDef> = {
  fact_checker: {
    id: 'fact_checker',
    nameKo: '원칙주의 팩트체커',
    nameEn: 'Principled Fact-Checker',
    badgeIcon: '🔍',
    personalityKo: '청탁과 술자리를 극도로 경계하며 오직 검증된 문서와 공식 데이터만 인정합니다.',
    personalityEn: 'Rejects wining-and-dining or favors; only verified documents and official data move them.',
    specialAbilityKo: '로비·술자리·압박 시 불신도 급증 및 추가 취재 발동 / 팩트체크·정정 시 압박 대폭 감소',
    specialAbilityEn: 'Drinks or lobbying spike distrust & risk; verified facts and honest corrections slash pressure.',
    culturalNoteEn: 'Represents reform-minded Korean beat reporters who strictly adhere to anti-graft laws (Kim Young-ran Act).',
    appearancePreset: {
      skinTone: '#f5d0b5',
      hairStyle: 'neat',
      hairColor: '#1e293b',
      jacketColor: '#334155',
      pantsColor: '#0f172a',
      pressCardColor: '#38bdf8',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 70, max: 88 },
      persistence: { min: 72, max: 90 },
      expertise: { min: 75, max: 92 },
      sourceNetwork: { min: 55, max: 75 },
      deadlineUrgency: { min: 45, max: 68 },
      intimacy: { min: 25, max: 45 },
      distrust: { min: 50, max: 70 },
      evidenceLevel: { min: 55, max: 78 },
    },
    preferredCounterSkills: ['disclosure_analysis', 'official_inquiry', 'archive_search'],
    introLinesKo: [
      '홍보팀장님, 식사는 사양합니다. 제가 보낸 질의서 3번 항목 수치부터 소명해 주시죠.',
      '감정 호소 말고 근거 자료로 말씀해 주세요. 데스크 보고 전까지 교차검증 중입니다.',
    ],
    introLinesEn: [
      'Skip the dinner invite, Chief. Please explain the numbers in item #3 of my questionnaire first.',
      'No spin—just primary documents. I am cross-verifying everything before filing with my desk.',
    ],
    goodResponseLinesKo: [
      '보내주신 원본 데이터 확인했습니다. 반론 문단에 정확히 반영하겠습니다.',
      '오류를 솔직히 인정하고 정정 자료를 주시니 취재원으로서 신뢰가 가는군요.',
    ],
    goodResponseLinesEn: [
      'Raw data verified. I will incorporate your rebuttal accurately in the piece.',
      'Owning the error with transparent figures earns real credibility.',
    ],
    badResponseLinesKo: [
      '지금 술자리나 광고 얘기로 기사를 덮으시려는 겁니까? 이 발언도 취재 수첩에 기록합니다.',
      '해명자료 숫자가 앞뒤가 안 맞잖습니까! 후속 검증 들어가겠습니다.',
    ],
    badResponseLinesEn: [
      'Are you trying to bury this story with drinks or ad spend? That goes into my notebook too.',
      'Your statement numbers don’t add up! Launching deeper verification now.',
    ],
  },

  scoop_hunter: {
    id: 'scoop_hunter',
    nameKo: '특종 사냥꾼',
    nameEn: 'Scoop Hunter',
    badgeIcon: '🦅',
    personalityKo: '[단독] 타이틀에 죽고 사는 승부사. 어설픈 회유보다는 확실한 정보 가치나 정면 승부에 반응합니다.',
    personalityEn: 'Lives for the [Exclusive] tag. Unmoved by vague excuses; respects hard info or decisive action.',
    specialAbilityKo: '증거 수준이 높을수록 단독 기사 작성 확률 상승 / 백그라운드 브리핑·책임 조치에 민감 반응',
    specialAbilityEn: 'High evidence triggers [Exclusive] spikes; responds strongly to deep background briefings or bold accountability.',
    culturalNoteEn: 'In Korean newsrooms, landing a “[단독] (Exclusive)” tag on portal news feeds is a major career trophy.',
    appearancePreset: {
      skinTone: '#eab696',
      hairStyle: 'parted',
      hairColor: '#0f172a',
      jacketColor: '#7c2d12',
      pantsColor: '#1c1917',
      pressCardColor: '#ef4444',
      glasses: false,
    },
    statRanges: {
      reportingPower: { min: 80, max: 95 },
      persistence: { min: 78, max: 92 },
      expertise: { min: 62, max: 82 },
      sourceNetwork: { min: 75, max: 94 },
      deadlineUrgency: { min: 65, max: 85 },
      intimacy: { min: 30, max: 52 },
      distrust: { min: 55, max: 78 },
      evidenceLevel: { min: 60, max: 85 },
    },
    preferredCounterSkills: ['exclusive_draft', 'whistleblower_contact', 'additional_reporting'],
    introLinesKo: [
      '팀장님, 타사는 아직 냄새도 못 맡았습니다. 오늘 밤 단독 달고 나가기 전에 입장 주시죠!',
      '제보자가 넘긴 파일이 꽤 묵직합니다. 뻔한 동문서답이면 바로 1면 톱으로 올립니다.',
    ],
    introLinesEn: [
      'No rival outlet has a whiff of this yet, Chief. Give me your stance before our [Exclusive] drops tonight!',
      'My source handed over a heavy file. Canned PR talk means this goes straight to page one.',
    ],
    goodResponseLinesKo: [
      '오호, 사내 맥락이 그런 거였군요. 단독 결은 살리되 회사 측 해명 비중을 크게 싣겠습니다.',
      '발 빠른 책임 조치네요. 이 정도면 비판 수위를 조절할 명분이 됩니다.',
    ],
    goodResponseLinesEn: [
      'Interesting context. I’ll keep the angle sharp, but give full weight to your corrective stance.',
      'Swift accountability—that gives my desk a solid reason to temper the headline.',
    ],
    badResponseLinesKo: [
      '보도 자제요? 오히려 숨기는 게 있다는 확신만 드네요. 단독 2보까지 준비합니다!',
      '타사에 물타기 하셨다구요? 지금 바로 출고 버튼 누르겠습니다.',
    ],
    badResponseLinesEn: [
      'Asking to hold the story? That just confirms you’re hiding something. Prepping Part 2!',
      'Trying to spin a diversion? Hitting publish right now.',
    ],
  },

  deadline_racer: {
    id: 'deadline_racer',
    nameKo: '마감 임박형',
    nameEn: 'Deadline Sprinter',
    badgeIcon: '⏱️',
    personalityKo: '데스크 독촉에 쫓겨 1분 1초가 급한 기자. 느긋한 식사나 긴 회의보다 즉답과 핵심 요약을 원합니다.',
    personalityEn: 'Hounded by desk editors every minute. Hates slow lunches; craves instant facts and crisp summaries.',
    specialAbilityKo: '커피·식사·술자리 등 시간 소모형 스킬 효율 급감 / 전화·문자·즉각 해명자료 효율 대폭 상승',
    specialAbilityEn: 'Slow meals/drinks waste turns with near-zero effect; instant calls, texts, and crisp statements excel.',
    culturalNoteEn: 'Korean online wire & daily reporters often juggle multiple edition deadlines per hour under intense desk pressure.',
    appearancePreset: {
      skinTone: '#f3cfb3',
      hairStyle: 'short',
      hairColor: '#292524',
      jacketColor: '#1d4ed8',
      pantsColor: '#1e293b',
      pressCardColor: '#facc15',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 60, max: 78 },
      persistence: { min: 55, max: 75 },
      expertise: { min: 52, max: 72 },
      sourceNetwork: { min: 58, max: 76 },
      deadlineUrgency: { min: 85, max: 99 },
      intimacy: { min: 35, max: 58 },
      distrust: { min: 42, max: 64 },
      evidenceLevel: { min: 45, max: 70 },
    },
    preferredCounterSkills: ['desk_report', 'breaking_flash', 'official_inquiry'],
    introLinesKo: [
      '팀장님! 부장님이 30분 내로 송고하래요! 핵심 입장 세 줄로만 빨리 불러주세요!!',
      '지금 밥 먹을 시간 없어요! 맞는지 틀리는지 팩트만 딱 짚어주세요!',
    ],
    introLinesEn: [
      'Chief! My desk editor wants copy in 30 minutes! Give me three tight bullet points right now!!',
      'Zero time for coffee or lunch! Just confirm or refute the core facts!',
    ],
    goodResponseLinesKo: [
      '휴, 딱 마감 5분 전에 깔끔한 팩트 주셔서 살았습니다! 제목 순화해서 올릴게요!',
      '빠른 회신 감사합니다! 회사 반론 제목에 바로 병기했습니다!',
    ],
    goodResponseLinesEn: [
      'Phew, crisp facts five minutes before lock! Toning down the headline now!',
      'Lightning-fast reply—your rebuttal is going right into the subhead!',
    ],
    badResponseLinesKo: [
      '지금 저녁 술자리를 잡자고요?! 저 마감 펑크 납니다! 그냥 무응답으로 송고해요!',
      '답변이 너무 늦어요! 일단 의혹 제기로 1보 나갑니다!',
    ],
    badResponseLinesEn: [
      'Evening drinks?! My deadline is NOW! Filing as “declined to comment”!',
      'Too slow! Sending out the first alert with the allegations as-is!',
    ],
  },

  networker: {
    id: 'networker',
    nameKo: '인맥왕',
    nameEn: 'Master Networker',
    badgeIcon: '🥂',
    personalityKo: '재계·언론계 마당발. 인간적인 예우와 스킨십, 오프더레코드 소통을 중시하지만 무시당하면 무섭습니다.',
    personalityEn: 'Knows everyone in media and business. Values personal rapport and off-the-record trust, but punishes snubs.',
    specialAbilityKo: '커피·식사·술자리·OB 네트워크에 우호적 반응 / 법적 경고·무대응 시 기자단 소문 확산',
    specialAbilityEn: 'Warm to coffee, meals, drinks, and OB networks; legal threats trigger press-corps rumor waves.',
    culturalNoteEn: 'Reflects veteran beat insiders who trade context over informal meals (“스킨십” relationship building).',
    appearancePreset: {
      skinTone: '#e8b89a',
      hairStyle: 'parted',
      hairColor: '#3f3f46',
      jacketColor: '#065f46',
      pantsColor: '#1e293b',
      pressCardColor: '#34d399',
      glasses: false,
    },
    statRanges: {
      reportingPower: { min: 65, max: 82 },
      persistence: { min: 58, max: 76 },
      expertise: { min: 58, max: 76 },
      sourceNetwork: { min: 85, max: 98 },
      deadlineUrgency: { min: 45, max: 65 },
      intimacy: { min: 48, max: 70 },
      distrust: { min: 35, max: 55 },
      evidenceLevel: { min: 50, max: 72 },
    },
    preferredCounterSkills: ['joint_reporting', 'whistleblower_contact', 'desk_report'],
    introLinesKo: [
      '어이 김 팀장~ 요즘 얼굴 보기 힘들다? 기자단 방에 흉흉한 소문 돌던데 솔직히 털어놔 봐.',
      '내가 남이야? 사정 있으면 커피라도 한잔하면서 배경 설명을 해줘야 도와주지.',
    ],
    introLinesEn: [
      'Hey Chief, long time no see! Wild rumors are swirling in the press lounge—give me the real story.',
      'We’re not strangers, right? Walk me through the background over coffee so I can see your side.',
    ],
    goodResponseLinesKo: [
      '역시 팀장이 직접 챙기니 오해가 풀리네. 데스크에 내가 잘 설명해 둘게.',
      '진작 이렇게 터놓고 얘기하지 그랬어! 톤 다운해서 정리해 보자고.',
    ],
    goodResponseLinesEn: [
      'Nothing beats talking it through face-to-face. I’ll brief my desk on the context.',
      'Now that’s straight talk! Let’s dial down the heat and keep this fair.',
    ],
    badResponseLinesKo: [
      '나한테 내용증명 운운했다고? 좋아, 출입기자단 전체가 어떻게 움직이는지 보자고.',
      '사람 무안하게 서면 세 줄로 퉁치네? 섭섭해서 원, 제대로 파봐야겠구만.',
    ],
    badResponseLinesEn: [
      'Threatening me with lawyers? Watch how fast the entire press corps rallies on this.',
      'Brushing me off with a cold three-line email? Guess it’s time to dig deep.',
    ],
  },

  econ_veteran: {
    id: 'econ_veteran',
    nameKo: '경제통 베테랑',
    nameEn: 'Financial Beat Veteran',
    badgeIcon: '📈',
    personalityKo: '재무제표와 공시 행간을 꿰뚫어 보는 15년차 산업·금융통. 허술한 숫자 변명은 단숨에 간파합니다.',
    personalityEn: '15-year markets & industry veteran who reads balance sheets like novels. Spots financial spin instantly.',
    specialAbilityKo: '공시·자료 대조 및 전문 컨설팅·CEO 입장에 높은 신뢰 / 부정확한 해명 시 압박 가중',
    specialAbilityEn: 'Respects disclosure audits, crisis consultants, and CEO statements; punishes sloppy math.',
    culturalNoteEn: 'Economic dailies (경제지) wield huge influence over corporate credit ratings and investor sentiment in Korea.',
    appearancePreset: {
      skinTone: '#eac0a2',
      hairStyle: 'neat',
      hairColor: '#475569',
      jacketColor: '#1e3a8a',
      pantsColor: '#0f172a',
      pressCardColor: '#60a5fa',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 76, max: 90 },
      persistence: { min: 70, max: 86 },
      expertise: { min: 86, max: 98 },
      sourceNetwork: { min: 74, max: 88 },
      deadlineUrgency: { min: 52, max: 72 },
      intimacy: { min: 38, max: 58 },
      distrust: { min: 48, max: 68 },
      evidenceLevel: { min: 65, max: 86 },
    },
    preferredCounterSkills: ['disclosure_analysis', 'archive_search', 'owner_ambush'],
    introLinesKo: [
      '분기보고서 주석 14번이랑 이번 내부 문건 현금흐름표가 180억이나 차이 나더군요. 설명되십니까?',
      '시장 불안을 잠재우려면 뜬구름 잡는 사과 말고 재무적 근거와 지배구조 대책을 가져오세요.',
    ],
    introLinesEn: [
      'Footnote 14 in your quarterly filing and this leaked cash-flow sheet differ by 18 billion won. Care to explain?',
      'Markets want hard numbers and governance fixes, not fluffy PR platitudes.',
    ],
    goodResponseLinesKo: [
      '회계 기준 차이를 주석 단위로 소명하셨군요. 시장 오해가 없도록 정밀하게 쓰겠습니다.',
      '최고경영진이 직접 수치와 로드맵을 밝혔으니 투자자들도 납득할 겁니다.',
    ],
    goodResponseLinesEn: [
      'Solid footnote-level reconciliation of the accounting gap. I’ll reflect that clearly for investors.',
      'With leadership laying out concrete figures and a roadmap, market jitters should subside.',
    ],
    badResponseLinesKo: [
      '제가 재무제표 못 읽는 줄 아십니까? 이 엉터리 해명 자체가 분식 정황 기삿감이네요.',
      '협찬 제안이라니, 경제부 데스크를 뭘로 보시는 겁니까!',
    ],
    badResponseLinesEn: [
      'Do you think I can’t read a balance sheet? This sloppy spin is a story in itself.',
      'Offering event sponsorship to bury a disclosure gap? Insulting!',
    ],
  },

  metro_striker: {
    id: 'metro_striker',
    nameKo: '사회부 돌격대',
    nameEn: 'Metro Desk Striker',
    badgeIcon: '🚨',
    personalityKo: '경찰서·검찰청 밤샘 마와리로 단련된 현장파. 피해자 구제와 책임자 처벌 여부를 집요하게 물고 늘어집니다.',
    personalityEn: 'Hardened on overnight police and prosecution beats. Relentlessly demands victim relief and accountability.',
    specialAbilityKo: '피해자 보상·공식 사과·책임자 교체에 크게 설득됨 / 회피·법적 겁박 시 현장 직격 취재 강행',
    specialAbilityEn: 'Moved by victim compensation, apologies, and accountability; legal threats provoke aggressive ambush reporting.',
    culturalNoteEn: '“마와리 (Mawari)” refers to gritty police-station rounds where Korean metro reporters build relentless stamina.',
    appearancePreset: {
      skinTone: '#d9a482',
      hairStyle: 'short',
      hairColor: '#18181b',
      jacketColor: '#374151',
      pantsColor: '#111827',
      pressCardColor: '#f87171',
      glasses: false,
      hatColor: '#1f2937',
    },
    statRanges: {
      reportingPower: { min: 78, max: 92 },
      persistence: { min: 82, max: 96 },
      expertise: { min: 58, max: 76 },
      sourceNetwork: { min: 72, max: 88 },
      deadlineUrgency: { min: 65, max: 84 },
      intimacy: { min: 28, max: 48 },
      distrust: { min: 58, max: 80 },
      evidenceLevel: { min: 58, max: 82 },
    },
    preferredCounterSkills: ['whistleblower_contact', 'owner_ambush', 'additional_reporting'],
    introLinesKo: [
      '지금 본사 정문 앞입니다! 피해자들이랑 제보자 인터뷰 다 따놨는데 회사 입장은 뭡니까!',
      '법무팀 뒤에 숨지 마시고 피해 보상 어떻게 할 건지부터 답하시죠!',
    ],
    introLinesEn: [
      'I’m standing right outside HQ! I’ve got victim and whistleblower interviews on tape—what’s your answer?!',
      'Don’t hide behind lawyers—tell me how you’re compensating the victims first!',
    ],
    goodResponseLinesKo: [
      '실질적인 피해 보상안과 책임자 문책까지 나왔군요. 피해자 측 반응 확인해서 균형 있게 다루겠습니다.',
      '진정성 있는 사과가 먼저라는 판단, 맞습니다. 기사 논조에 참작하겠습니다.',
    ],
    goodResponseLinesEn: [
      'Real victim compensation and executive accountability—good. I’ll check with the victims and report fairly.',
      'Putting a sincere apology first was the right call. I’ll reflect that in the tone.',
    ],
    badResponseLinesKo: [
      '제보자 색출하고 법적 대응하겠다고요?! 사회부 기자 근성 한번 보시렵니까!',
      '윗선 감싸기 급급하네요. 회장님 출근길 포토라인에서 직접 묻겠습니다!',
    ],
    badResponseLinesEn: [
      'Hunting whistleblowers and threatening lawsuits?! Watch how the metro desk responds!',
      'Still shielding the top brass? Guess I’ll ask your Chairman on the morning sidewalk!',
    ],
  },

  rookie_passion: {
    id: 'rookie_passion',
    nameKo: '신입 열혈 기자',
    nameEn: 'Passionate Rookie',
    badgeIcon: '🔥',
    personalityKo: '정의감과 의욕이 넘치지만 업계 관행과 복잡한 전문 용어에는 아직 서툰 1~2년차 수습·신입 기자.',
    personalityEn: 'Brimming with justice and energy, though still learning complex industry nuances in year 1–2.',
    specialAbilityKo: '친절한 추가 취재자료 제공·백그라운드 브리핑에 크게 감화됨 / 고압적 인맥 동원·외압에 강한 반발',
    specialAbilityEn: 'Appreciates patient background briefings and clear reference docs; rebels fiercely against top-downdesk pressure.',
    culturalNoteEn: 'Pulling rank by calling a rookie’s desk chief (“윗선 동원”) often turns a minor story into a personal crusade.',
    appearancePreset: {
      skinTone: '#f7d7c4',
      hairStyle: 'bob',
      hairColor: '#27272a',
      jacketColor: '#2563eb',
      pantsColor: '#1e293b',
      pressCardColor: '#fde047',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 52, max: 72 },
      persistence: { min: 74, max: 90 },
      expertise: { min: 40, max: 62 },
      sourceNetwork: { min: 42, max: 62 },
      deadlineUrgency: { min: 60, max: 80 },
      intimacy: { min: 38, max: 60 },
      distrust: { min: 45, max: 68 },
      evidenceLevel: { min: 42, max: 66 },
    },
    preferredCounterSkills: ['additional_reporting', 'official_inquiry', 'desk_report'],
    introLinesKo: [
      '안녕하세요 홍보팀장님! 소비자 제보 메일 받고 밤새 취재했습니다! 공식 답변 부탁드립니다!',
      '업계 관행이라는 말 말고, 왜 이런 문제가 생겼는지 원칙대로 설명해 주세요!',
    ],
    introLinesEn: [
      'Hello PR Chief! I stayed up all night investigating consumer tips! Requesting your official comment!',
      'Don’t just call it “industry practice”—please explain on the record why this happened!',
    ],
    goodResponseLinesKo: [
      '아, 기술적인 구조가 그런 거였군요! 보내주신 해설 자료 덕분에 오보를 피했습니다. 감사합니다!',
      '차분하게 팩트를 짚어주셔서 이해가 잘 됐어요. 반론 충분히 담겠습니다!',
    ],
    goodResponseLinesEn: [
      'Oh, so that’s how the technical workflow operates! Your reference packet saved me from an error—thank you!',
      'Thanks for walking through the facts respectfully. I’ll include your full explanation!',
    ],
    badResponseLinesKo: [
      '방금 저희 부장님 통해 제 기사 막으려 하셨죠?! 끝까지 취재해서 기어이 출고하겠습니다!',
      '연차 낮다고 무시하시는 건가요? 팩트 끝까지 파헤치겠습니다!',
    ],
    badResponseLinesEn: [
      'Did you just call my desk editor to kill my story?! Now I’m seeing this investigation through to the end!',
      'Brushing me off because I’m junior? I will dig into every last detail!',
    ],
  },

  sns_star: {
    id: 'sns_star',
    nameKo: 'SNS 스타 기자',
    nameEn: 'Social Media Star Reporter',
    badgeIcon: '📲',
    personalityKo: '구독자 수십만 명을 거느린 뉴미디어·SNS 인플루언서 기자. 여론 파급력과 실시간 바이럴 속도가 무섭습니다.',
    personalityEn: 'Commands hundreds of thousands of followers. Viral speed and public-opinion impact are explosive.',
    specialAbilityKo: '여론 모니터링·신속 사과·보상안에 긍정적 / 물타기·어설픈 변명 시 밈(Meme)화되어 평판 급락',
    specialAbilityEn: 'Rewards sentiment monitoring, swift apologies, and transparent remedies; tone-deaf spin goes viral negatively.',
    culturalNoteEn: 'Modern Korean PR crises often explode simultaneously on portal news, YouTube shorts, and workplace communities.',
    appearancePreset: {
      skinTone: '#f5d0b5',
      hairStyle: 'parted',
      hairColor: '#9333ea',
      jacketColor: '#db2777',
      pantsColor: '#1e1b4b',
      pressCardColor: '#f472b6',
      glasses: false,
    },
    statRanges: {
      reportingPower: { min: 68, max: 85 },
      persistence: { min: 64, max: 82 },
      expertise: { min: 55, max: 75 },
      sourceNetwork: { min: 80, max: 96 },
      deadlineUrgency: { min: 75, max: 94 },
      intimacy: { min: 40, max: 62 },
      distrust: { min: 48, max: 70 },
      evidenceLevel: { min: 50, max: 75 },
    },
    preferredCounterSkills: ['breaking_flash', 'followup_teaser', 'whistleblower_contact'],
    introLinesKo: [
      '팀장님, 이미 커뮤니티 실시간 인기글 올라갔어요! 제 라이브 썰 풀기 전에 공식 입장 주시죠!',
      '요즘 독자들은 사족 긴 해명문 안 읽습니다. 핵심 한 줄로 깔끔하게 답하실 수 있죠?',
    ],
    introLinesEn: [
      'Chief, this is already trending on community boards! Drop your official take before my live stream goes up!',
      'Audiences roast wordy legalese in seconds. Can you give a clean, honest answer?',
    ],
    goodResponseLinesKo: [
      '와, 사과문이 군더더기 없이 깔끔하네요! 댓글 여론도 빠르게 진정되는 분위기입니다.',
      '보상안 대응 속도 대박이네요. 긍정적인 후속 카드뉴스도 같이 다루겠습니다!',
    ],
    goodResponseLinesEn: [
      'Clean, no-excuses apology! Comment sentiment is already cooling down fast.',
      'Super quick compensation plan—I’ll highlight your corrective steps in my follow-up thread!',
    ],
    badResponseLinesKo: [
      '경쟁사 이슈로 물타기 시도하셨네요? 네티즌들이 제일 싫어하는 패턴인데… 역풍 각오하세요!',
      '유체이탈 화법 해명문이 짤방으로 돌기 시작했습니다! 여론 불붙었어요!',
    ],
    badResponseLinesEn: [
      'Trying to distract with a rival scandal? Netizens spot astroturfing instantly—brace for viral backlash!',
      'Your evasive statement just became a meme! Public sentiment is on fire!',
    ],
  },

  followup_obsessed: {
    id: 'followup_obsessed',
    nameKo: '후속 보도 집착형',
    nameEn: 'Follow-Up Hound',
    badgeIcon: '🐕',
    personalityKo: '한번 문 이슈는 1보에서 끝내지 않고 10보까지 파고드는 끈기의 화신. 미봉책은 절대 통하지 않습니다.',
    personalityEn: 'Once they bite, they file Parts 1 through 10. Band-aid fixes never shake them off.',
    specialAbilityKo: '집요함 최상위·과거 기사 아카이브 대조 특화 / 근본적 개선 조치·임원 책임에 비로소 취재 종결',
    specialAbilityEn: 'Ultra-high persistence & archive memory; only substantive structural reform brings true closure.',
    culturalNoteEn: 'Known in Korean PR slang as “시리즈 기획 (Series Hounds)” who track whether corporate promises are actually kept.',
    appearancePreset: {
      skinTone: '#e5b899',
      hairStyle: 'neat',
      hairColor: '#78350f',
      jacketColor: '#4b5563',
      pantsColor: '#1f2937',
      pressCardColor: '#fb923c',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 74, max: 88 },
      persistence: { min: 90, max: 99 },
      expertise: { min: 70, max: 86 },
      sourceNetwork: { min: 68, max: 84 },
      deadlineUrgency: { min: 48, max: 68 },
      intimacy: { min: 30, max: 50 },
      distrust: { min: 56, max: 78 },
      evidenceLevel: { min: 62, max: 84 },
    },
    preferredCounterSkills: ['archive_search', 'followup_teaser', 'additional_reporting'],
    introLinesKo: [
      '3년 전에도 비슷한 재발 방지 약속 하셨죠? 제가 그때 기사 스크랩 다 갖고 있습니다.',
      '오늘 하루만 넘기면 끝날 거라 생각 마세요. 이행 여부까지 끝까지 추적할 겁니다.',
    ],
    introLinesEn: [
      'Didn’t your company pledge the exact same fix three years ago? I still have the clippings.',
      'Don’t think surviving today’s cycle ends this. I track implementation to the finish line.',
    ],
    goodResponseLinesKo: [
      '외부 검증 기구와 구체적인 일정까지 박으셨군요. 이번엔 진정성이 보입니다.',
      '근본 원인을 짚은 개선안이네요. 이행 경과를 지켜보는 선에서 톤을 정리하겠습니다.',
    ],
    goodResponseLinesEn: [
      'Binding timelines and third-party oversight—now that looks like genuine reform.',
      'A root-cause fix at last. I’ll shift from exposé mode to constructive monitoring.',
    ],
    badResponseLinesKo: [
      '보도만 하루 미뤄달라니요? 그사이 증거 인멸하려는 거 아닙니까? 기획 시리즈 5부작 갑니다.',
      '말뿐인 유감 표명은 지겹습니다. 후속 취재 인력 더 붙이겠습니다.',
    ],
    badResponseLinesEn: [
      'Begging for a delay with zero action? Launching a five-part investigative series.',
      'Empty “regrets” won’t cut it anymore. Doubling down on follow-up reporting.',
    ],
  },

  broadcast_pd: {
    id: 'broadcast_pd',
    nameKo: '방송 탐사 PD',
    nameEn: 'Investigative Broadcast PD',
    badgeIcon: '🎥',
    personalityKo: '6개월간 잠복과 영상 취재를 마친 시사교양 PD. 카메라 앞에서의 태도와 시각적 진정성이 결정적입니다.',
    personalityEn: 'Spends six months filming undercover. On-camera sincerity and visual accountability decide everything.',
    specialAbilityKo: '서면 땜질·광고 협찬 카드에 극렬 역풍(방송 박제!) / 공식 기자회견·CEO 입장·피해 구제에 높은 효과',
    specialAbilityEn: 'Flimsy emails or ad-spend offers get aired on prime-time TV! Official pressers, CEO accountability, and reform work best.',
    culturalNoteEn: 'Prime-time investigative TV shows in Korea carry massive reputational impact; refusing an interview while fleeing cameras is notorious.',
    appearancePreset: {
      skinTone: '#e2b496',
      hairStyle: 'short',
      hairColor: '#1e293b',
      jacketColor: '#0f766e',
      pantsColor: '#0f172a',
      pressCardColor: '#ef4444',
      glasses: false,
      hasCamera: true,
    },
    statRanges: {
      reportingPower: { min: 84, max: 96 },
      persistence: { min: 84, max: 96 },
      expertise: { min: 76, max: 90 },
      sourceNetwork: { min: 76, max: 92 },
      deadlineUrgency: { min: 55, max: 75 },
      intimacy: { min: 22, max: 42 },
      distrust: { min: 62, max: 84 },
      evidenceLevel: { min: 72, max: 92 },
    },
    preferredCounterSkills: ['broadcast_slot_lock', 'joint_reporting', 'owner_ambush'],
    introLinesKo: [
      '카메라 돌아가고 있습니다, 팀장님. 6개월간 취재한 제보자 증언에 대해 정식 인터뷰 응하시겠습니까?',
      '서면 두 줄로 때우시면 빈 의자 클로즈업 나가고 자막 처리됩니다. 정면으로 설명하시죠.',
    ],
    introLinesEn: [
      'Cameras are rolling, Chief. Will you sit for an on-camera interview regarding six months of whistleblower testimony?',
      'Send a two-line email and we air an empty chair with subtitles. Address this head-on.',
    ],
    goodResponseLinesKo: [
      '카메라 앞에서 피하지 않고 구체적인 개선책과 반론을 밝히셨으니 방송 후반부에 충분히 담겠습니다.',
      '진정성 있는 공식 입장과 피해 대책이 확인되어 자극적인 연출은 덜어내겠습니다.',
    ],
    goodResponseLinesEn: [
      'Facing the camera directly with concrete reforms earns fair airtime in our final cut.',
      'With genuine remedies confirmed, we will present a balanced broadcast segment.',
    ],
    badResponseLinesKo: [
      '방금 광고국 통해서 편성 흔들려 하셨습니까? 그 녹취까지 예고편에 싣겠습니다!',
      '인터뷰 거부하고 문 잠그시는 장면, 그대로 전파 탑니다!',
    ],
    badResponseLinesEn: [
      'Did you just try pressuring our ad sales desk? That attempt is going into the broadcast teaser!',
      'Slamming the door on our crew—that footage airs untouched this Saturday!',
    ],
  },

  data_journalist: {
    id: 'data_journalist',
    nameKo: '데이터 저널리스트',
    nameEn: 'Data Journalist',
    badgeIcon: '📊',
    personalityKo: '수만 건의 판결문·공시·입찰 API를 파이썬으로 크롤링해 이상 징후를 찾아내는 분석가형 기자.',
    personalityEn: 'Scrapes tens of thousands of filings, bids, and court records with code to uncover statistical anomalies.',
    specialAbilityKo: '인맥·술자리 무효 / 사내 팩트체크 + 공시 대조 + 추가 취재자료 조합 시 가장 큰 폭으로 설득 가능',
    specialAbilityEn: 'Immune to schmoozing; persuaded powerfully by raw datasets, disclosure audits, and factual corrections.',
    culturalNoteEn: 'Data journalism labs inside Korean outlets increasingly expose corporate governance patterns through open data.',
    appearancePreset: {
      skinTone: '#f4d2bc',
      hairStyle: 'bob',
      hairColor: '#0284c7',
      jacketColor: '#312e81',
      pantsColor: '#0f172a',
      pressCardColor: '#22d3ee',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 78, max: 92 },
      persistence: { min: 76, max: 90 },
      expertise: { min: 90, max: 99 },
      sourceNetwork: { min: 60, max: 78 },
      deadlineUrgency: { min: 50, max: 70 },
      intimacy: { min: 28, max: 48 },
      distrust: { min: 52, max: 74 },
      evidenceLevel: { min: 70, max: 90 },
    },
    preferredCounterSkills: ['disclosure_analysis', 'archive_search', 'exclusive_draft'],
    introLinesKo: [
      '최근 5년치 전자공시랑 조달 데이터를 전수 분석했더니 귀사 계열사만 통계적 특이점이 튀더군요.',
      '말로 하는 해명 말고 CSV 로우 데이터나 산식 근거를 제시해 주시면 재검증해 보겠습니다.',
    ],
    introLinesEn: [
      'I ran five years of e-disclosures and procurement records—your affiliate stands out as a 4-sigma anomaly.',
      'Skip verbal assurances; share your raw methodology and denominator data so I can re-run the model.',
    ],
    goodResponseLinesKo: [
      '계절성 변수와 표본 기준을 반영해 모델을 다시 돌려보니 설명이 타당하네요. 기사를 대폭 수정하겠습니다!',
      '정확한 로우 데이터를 공개해 주셔서 오해를 바로잡을 수 있었습니다.',
    ],
    goodResponseLinesEn: [
      'Re-running the script with your seasonal adjustment parameters resolves the anomaly. Revising the draft!',
      'Publishing transparent raw figures cleared up the discrepancy cleanly.',
    ],
    badResponseLinesKo: [
      '전직 언론인 선배 내세워서 데이터 기사를 막겠다고요? 깃허브에 분석 코드까지 공개할 겁니다.',
      '제시하신 반박 수치, 합계부터 틀렸습니다. 신뢰도 제로군요.',
    ],
    badResponseLinesEn: [
      'Sending an ex-journalist lobbyist to argue against math? I’ll publish the open-source notebook alongside the story.',
      'Your rebuttal table doesn’t even sum to 100%. Credibility at zero.',
    ],
  },

  legend_investigative: {
    id: 'legend_investigative',
    nameKo: '전설의 탐사 기자',
    nameEn: 'Legendary Investigative Journalist',
    badgeIcon: '👑',
    personalityKo: '수많은 성역과 재벌 비리를 파헤쳐 언론상을 휩쓴 최종 보스. 과거 플레이어의 모든 정직함과 꼼수를 꿰뚫어 봅니다.',
    personalityEn: 'Grand-prize investigative titan who toppled untouchable conglomerates. Sees right through your entire track record.',
    specialAbilityKo: '누적 RISK가 높으면 매 턴 맹공 / 검증된 팩트 + 최고위급 결단 + 진정성 있는 책임 수습의 정석 콤보만 인정',
    specialAbilityEn: 'Punishes accumulated RISK mercilessly; yields only to verified truth, executive accountability, and genuine reform.',
    culturalNoteEn: 'The ultimate test for any corporate communications chief facing an existential conglomerate scandal.',
    appearancePreset: {
      skinTone: '#dfb18b',
      hairStyle: 'neat',
      hairColor: '#cbd5e1',
      jacketColor: '#18181b',
      pantsColor: '#09090b',
      pressCardColor: '#f59e0b',
      glasses: true,
    },
    statRanges: {
      reportingPower: { min: 92, max: 99 },
      persistence: { min: 92, max: 99 },
      expertise: { min: 90, max: 99 },
      sourceNetwork: { min: 90, max: 99 },
      deadlineUrgency: { min: 68, max: 85 },
      intimacy: { min: 20, max: 40 },
      distrust: { min: 65, max: 88 },
      evidenceLevel: { min: 80, max: 96 },
    },
    preferredCounterSkills: ['owner_ambush', 'exclusive_draft', 'joint_reporting', 'breaking_flash'],
    introLinesKo: [
      '드디어 마주 앉았군요, 홍보팀장님. 지난 사건들에서 귀사가 어떻게 대응했는지도 모두 지켜봤습니다.',
      '그룹의 운명이 걸린 사안입니다. 손바닥으로 하늘을 가릴지, 정면 돌파할지 선택하시죠.',
    ],
    introLinesEn: [
      'So we finally meet across the table, Chief. I have watched every move you made through the previous crises.',
      'The fate of your entire group hangs here. Will you try to cover the sky with your palm, or face the truth?',
    ],
    goodResponseLinesKo: [
      '오너 리스크 앞에서 팩트 검증과 뼈를 깎는 쇄신안을 동시에 내놓다니… 홍보팀장으로서 최선의 정공법이군요.',
      '귀사의 투명한 자료 공개와 책임 있는 조치를 기사 전면에 비중 있게 다루겠습니다.',
    ],
    goodResponseLinesEn: [
      'Pairing unflinching verification with painful structural reform against owner risk—textbook crisis leadership.',
      'Your transparent disclosure and decisive accountability earn prominent placement in our coverage.',
    ],
    badResponseLinesKo: [
      '아직도 돈과 외압으로 탐사보도를 막을 수 있다고 믿으십니까? 오늘 밤 특별판으로 뵙겠습니다.',
      '변명으로 일관하는군요. 확보한 결정적 녹취와 문건 원본을 그대로 공개합니다!',
    ],
    badResponseLinesEn: [
      'Still believing money and backroom strings can silence investigative journalism? See you on tonight’s special edition.',
      'Nothing but evasions. Releasing the full unredacted documents and audio tonight!',
    ],
  },
};

export const JOURNALIST_ARCHETYPE_LIST: JournalistArchetypeDef[] = Object.values(JOURNALIST_ARCHETYPES);

export const FICTIONAL_JOURNALIST_NAMES: { ko: string; en: string; titleKo: string; titleEn: string }[] = [
  { ko: '강태성', en: 'Taeseong Kang', titleKo: '차장대우 기자', titleEn: 'Deputy Desk Reporter' },
  { ko: '윤서연', en: 'Seoyeon Yoon', titleKo: '선임기자', titleEn: 'Senior Correspondent' },
  { ko: '박준혁', en: 'Junhyuk Park', titleKo: '기동취재팀 기자', titleEn: 'Mobile Squad Reporter' },
  { ko: '정하늘', en: 'Haneul Jung', titleKo: '산업부 기자', titleEn: 'Industry Beat Reporter' },
  { ko: '최도현', en: 'Dohyun Choi', titleKo: '탐사기획팀장', titleEn: 'Investigative Desk Lead' },
  { ko: '한지민', en: 'Jimin Han', titleKo: '증권금융부 기자', titleEn: 'Markets & Finance Reporter' },
  { ko: '서민재', en: 'Minjae Seo', titleKo: '사회부 법조팀 기자', titleEn: 'Legal Affairs Reporter' },
  { ko: '이수빈', en: 'Subin Lee', titleKo: '데이터저널리즘팀 기자', titleEn: 'Data Journalism Specialist' },
  { ko: '오현우', en: 'Hyunwoo Oh', titleKo: '경제부 차장', titleEn: 'Deputy Economics Editor' },
  { ko: '송유진', en: 'Yujin Song', titleKo: '시사탐사국 PD', titleEn: 'Investigative Broadcast PD' },
  { ko: '남궁진', en: 'Jin Namgoong', titleKo: '특별취재본부 대기자', titleEn: 'Editor-at-Large' },
  { ko: '배소희', en: 'Sohee Bae', titleKo: '뉴미디어랩 기자', titleEn: 'Digital Lab Reporter' },
  { ko: '류승호', en: 'Seungho Ryu', titleKo: '재계팀 반장', titleEn: 'Corporate Cap Reporter' },
  { ko: '문채원', en: 'Chaewon Moon', titleKo: '소비자경제팀 기자', titleEn: 'Consumer Desk Reporter' },
  { ko: '장석훈', en: 'Seokhoon Jang', titleKo: '특수부 출입기자', titleEn: 'Prosecution Beat Reporter' },
  { ko: '고은별', en: 'Eunbyul Ko', titleKo: '사건팀 기자', titleEn: 'Metro Incident Reporter' },
];

export const FICTIONAL_MEDIA_OUTLETS: { ko: string; en: string; type: 'general' | 'econ' | 'broadcast' | 'data' | 'newmedia' }[] = [
  { ko: '한빛일보', en: 'Hanbit Daily', type: 'general' },
  { ko: '정론타임즈', en: 'Junglon Times', type: 'general' },
  { ko: '서울팩트신문', en: 'Seoul Fact Post', type: 'general' },
  { ko: '대한경제신문', en: 'Daehan Economic Daily', type: 'econ' },
  { ko: '미래비즈경제', en: 'Mirae Biz Financial', type: 'econ' },
  { ko: '마켓인사이트', en: 'Market Insight Wire', type: 'econ' },
  { ko: 'MBS 탐사보도 〈추적60〉', en: 'MBS TV 〈Probe 60〉', type: 'broadcast' },
  { ko: 'KBN 보도본부 〈심층취재〉', en: 'KBN News 〈Deep Dive〉', type: 'broadcast' },
  { ko: '데이터워치랩', en: 'DataWatch Lab', type: 'data' },
  { ko: '오픈팩트체크센터', en: 'Open FactCheck Center', type: 'data' },
  { ko: '바이트뉴스24', en: 'ByteNews 24', type: 'newmedia' },
  { ko: '프리즘탐사', en: 'Prism Investigative', type: 'general' },
];

export const JOURNALIST_COUNTER_SKILLS: Record<JournalistCounterSkillId, JournalistCounterSkillDef> = {
  additional_reporting: {
    id: 'additional_reporting',
    nameKo: '추가 현장 취재',
    nameEn: 'Follow-Up Field Reporting',
    descKo: '기자가 현장 관계자와 업계 주변을 탐문해 추가 정황을 확보합니다.',
    descEn: 'The reporter canvases industry insiders to gather corroborating details.',
    pressureGain: 8,
    evidenceGain: 6,
    reputationDrop: 1,
    deadlineShift: 0,
    action3D: 'notebook_out',
  },
  whistleblower_contact: {
    id: 'whistleblower_contact',
    nameKo: '내부 제보자 추가 접촉',
    nameEn: 'Second Whistleblower Contact',
    descKo: '사내 익명 제보자와 비밀리에 재접촉해 내부 증언의 수위를 높입니다.',
    descEn: 'Meets an anonymous insider again to sharpen internal testimony.',
    pressureGain: 11,
    evidenceGain: 10,
    reputationDrop: 2,
    deadlineShift: 0,
    action3D: 'phone_call',
  },
  disclosure_analysis: {
    id: 'disclosure_analysis',
    nameKo: '전자공시·재무자료 정밀 대조',
    nameEn: 'Deep Disclosure Cross-Check',
    descKo: '공시 주석과 유출 수치를 조목조목 비교하며 빈틈을 파고듭니다.',
    descEn: 'Cross-references footnotes and filings to expose numerical discrepancies.',
    pressureGain: 10,
    evidenceGain: 9,
    reputationDrop: 2,
    deadlineShift: 0,
    action3D: 'laptop_typing',
  },
  archive_search: {
    id: 'archive_search',
    nameKo: '과거 유사 사건 기사 발굴',
    nameEn: 'Past Scandal Archive Dig',
    descKo: '과거 기업의 사과문과 재발 논란 전력을 검색해 상습성 프레임을 짭니다.',
    descEn: 'Pulls past corporate pledges from archives to frame a repeat-offender narrative.',
    pressureGain: 9,
    evidenceGain: 7,
    reputationDrop: 3,
    deadlineShift: 0,
    action3D: 'laptop_typing',
  },
  desk_report: {
    id: 'desk_report',
    nameKo: '편집국 데스크 중간 보고',
    nameEn: 'Mid-Cycle Desk Pitch',
    descKo: '부장·데스크에 취재 현황을 보고하여 지면·포털 배치 중요도를 격상시킵니다.',
    descEn: 'Pitches progress to the desk editor, elevating story placement priority.',
    pressureGain: 9,
    evidenceGain: 4,
    reputationDrop: 1,
    deadlineShift: 0,
    action3D: 'phone_call',
  },
  exclusive_draft: {
    id: 'exclusive_draft',
    nameKo: '[단독] 기사 초안 작성',
    nameEn: 'Draft [Exclusive] Copy',
    descKo: '노트북을 열고 자극적인 [단독] 헤드라인 초안을 빠르게 타이핑합니다!',
    descEn: 'Opens laptop and hammers out a hard-hitting [Exclusive] draft!',
    pressureGain: 13,
    evidenceGain: 5,
    reputationDrop: 3,
    deadlineShift: 0,
    action3D: 'laptop_typing',
  },
  joint_reporting: {
    id: 'joint_reporting',
    nameKo: '타 부서·동료 기자 합동 취재',
    nameEn: 'Cross-Desk Joint Probe',
    descKo: '법조팀·산업부 동료 기자들과 정보를 공유하며 포위망을 좁힙니다.',
    descEn: 'Pools tips with legal and industry desk colleagues to tighten scrutiny.',
    pressureGain: 12,
    evidenceGain: 8,
    reputationDrop: 3,
    deadlineShift: 0,
    action3D: 'notebook_out',
  },
  broadcast_slot_lock: {
    id: 'broadcast_slot_lock',
    nameKo: '메인 뉴스·시사프로 편성 확정',
    nameEn: 'Lock Prime-Time Broadcast Slot',
    descKo: '예고편 송출과 함께 프라임타임 방송 편성표를 확정 짓습니다!',
    descEn: 'Locks a prime-time broadcast slot and queues the promotional teaser!',
    pressureGain: 14,
    evidenceGain: 6,
    reputationDrop: 4,
    deadlineShift: 0,
    action3D: 'news_publish',
  },
  followup_teaser: {
    id: 'followup_teaser',
    nameKo: '후속 연속보도 예고',
    nameEn: 'Tease Multi-Part Series',
    descKo: '단발성 보도가 아닌 기획 시리즈물 예고를 띄워 여론의 관심을 증폭시킵니다.',
    descEn: 'Signals an ongoing investigative series, amplifying public attention.',
    pressureGain: 11,
    evidenceGain: 6,
    reputationDrop: 4,
    deadlineShift: 0,
    action3D: 'news_publish',
  },
  owner_ambush: {
    id: 'owner_ambush',
    nameKo: '최고경영진·오너 자택/출근길 직격 취재',
    nameEn: 'Executive Doorstep Ambush',
    descKo: '경영진 동선을 파악해 마이크를 들이대며 최고위층의 긴장감을 극대화합니다!',
    descEn: 'Ambushes top executives on their morning commute with microphones raised!',
    pressureGain: 15,
    evidenceGain: 7,
    reputationDrop: 5,
    deadlineShift: 0,
    action3D: 'angry_point',
  },
  official_inquiry: {
    id: 'official_inquiry',
    nameKo: '항목별 공식 질의서 발송',
    nameEn: 'Send Formal 10-Point Questionnaire',
    descKo: '답변 시한이 명시된 공식 서면 질의서를 보내 회피 불가능한 답변을 요구합니다.',
    descEn: 'Delivers a timestamped written questionnaire demanding on-the-record answers.',
    pressureGain: 8,
    evidenceGain: 5,
    reputationDrop: 1,
    deadlineShift: 0,
    action3D: 'submit_doc',
  },
  breaking_flash: {
    id: 'breaking_flash',
    nameKo: '모바일 온라인 속보 타전',
    nameEn: 'Push Mobile Breaking Alert',
    descKo: '온라인 속보 알림을 먼저 띄워 마감 시한과 여론 압박을 동시에 조입니다!',
    descEn: 'Fires an instant mobile alert, tightening public pressure immediately!',
    pressureGain: 13,
    evidenceGain: 4,
    reputationDrop: 5,
    deadlineShift: 0,
    action3D: 'news_publish',
  },
};
