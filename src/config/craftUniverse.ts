export interface CraftUniverseNavLink {
  id: 'personnel-craft' | 'hongdam-craft' | 'hongdam-datalab';
  nameKo: string;
  nameEn: string;
  badgeKo?: string;
  badgeEn?: string;
  url: string;
}

export const SHOW_CRAFT_UNIVERSE = false;

export const CRAFT_UNIVERSE_BRAND = {
  title: 'CRAFT UNIVERSE',
  subtitleKo: '언론계 생존 시뮬레이션 유니버스',
  subtitleEn: 'The Media Industry Survival Universe',
  genreBadgeKo: '데이터저널리즘형 가상 시뮬레이션 인터랙티브 프로젝트',
  genreBadgeEn: 'A Data Journalism-Inspired Interactive Simulation',
  langStorageKey: 'craft_universe_lang',
};

export const CRAFT_UNIVERSE_LINKS: CraftUniverseNavLink[] = [
  {
    id: 'personnel-craft',
    nameKo: '인사 크래프트',
    nameEn: 'Personnel Craft',
    badgeKo: '기자편',
    badgeEn: 'Newsroom',
    url: 'https://raspos.github.io/personnel-craft/',
  },
  {
    id: 'hongdam-craft',
    nameKo: '홍담 크래프트',
    nameEn: 'Hongdam Craft',
    badgeKo: '홍보편',
    badgeEn: 'PR Battle',
    url: 'https://raspos.github.io/hongdam-craft/',
  },
  {
    id: 'hongdam-datalab',
    nameKo: '홍담 데이터랩',
    nameEn: 'Hongdam Data Lab',
    badgeKo: '통계학',
    badgeEn: 'Analytics',
    url: 'https://raspos.github.io/hongdam-craft/?view=datalab',
  },
];

export const HONGDAM_SHARE_URL = 'https://raspos.github.io/hongdam-craft/';
