# ⚔️ 홍담 크래프트 — 기사 막기 전쟁 (HONGDAM CRAFT: The PR Survival Game)

> **"기사는 쏟아지고, 예산은 바닥나고, 팀장 목숨은 하나다."**  
> *"The headlines keep coming. The budget keeps shrinking. And the PR chief only has one life."*

**CRAFT UNIVERSE** 세계관의 두 번째 작품이자 **데이터저널리즘형 가상 시뮬레이션 인터랙티브 프로젝트 (A Data Journalism-Inspired Interactive Simulation)**입니다.

- **시리즈 자매작 (인사 크래프트)**: https://raspos.github.io/personnel-craft/
- **신규 배포 주소 (홍담 크래프트)**: https://raspos.github.io/hongdam-craft/
- **홍담 데이터랩 바로가기**: https://raspos.github.io/hongdam-craft/?view=datalab

---

## 🎯 프로젝트 핵심 구성

〈홍담 크래프트〉는 단순한 3D 복셀 턴제 RPG를 넘어 다음 네 가지 축을 결합한 인터랙티브 시뮬레이션입니다.

1. **게임 (3D Voxel Turn-Based RPG)**: Three.js 복셀 그래픽 기반 6단계 언론 위기 대응 배틀 (15종 이상 3D 액션 연출 및 6대 스테이지 배경)
2. **가상 시뮬레이션 (Simulation)**: 5대 기업 규모 · 12개 업종 · 12종 기자 NPC(기억 시스템 포함) · 20종 핵심 홍보 스킬(계열별 4종 · 2×2 한 화면 구성) 상성 · 32종 돌발 이벤트
3. **데이터 분석 (Data Analytics)**:
   - **실시간 행동 로그 (`ActionTelemetryRecord`)**: 매 턴의 XP·HP·RISK·평판·신뢰·압박 변화량과 결과 데이터를 구조화 기록
   - **스테이지 위기 대응 분석**: 8대 지표 SVG 시각화 및 인과 설명 요약
   - **반사실 시뮬레이션 (`WHAT IF?`)**: 동일 시드(`StageReplaySnapshot`) 기반으로 단일 행동 교체 효과와 전체 전략 교체 효과를 나란히 대조
   - **홍담 생존 시뮬레이터**: Web Worker 시드 기반 몬테카를로 반복 시뮬레이션 (`1,000`회 / `5,000`회)
   - **홍담 데이터랩 (`HONGDAM DATA LAB`)**: 플레이 전·후 언제든 12종 기자 레이더/히트맵, 20스킬 버블차트, 기업 규모별 생존율, 6대 가상 전략 곡선을 탐색
4. **인터랙티브 스토리텔링 & 커뮤니티**:
   - **10종 멀티 엔딩** (정규 엔딩 8종 + 히든 엔딩 2종) 및 **8종 홍보팀장 유형 판정**
   - **개인 데이터저널리즘 종합 리포트** (`"당신은 어떻게 6번의 언론 위기를 살아남았나"`, 6단계 클릭형 타임라인 + `1200×630` PNG 공유 카드 생성기)
   - **홍담 대나무숲** (`오늘도 기사와 싸웠다`): 6개 말머리, 5종 공감 리액션, 엔딩 배지 자동 첨부, Supabase 공용 DB 연동 및 투명한 `[데모 모드]` 지원

---

## 🏛️ 6개 스테이지 구성

| 스테이지 | 난이도 | 위기 주제 | 특징 |
| :--- | :---: | :--- | :--- |
| **STAGE 1** | ★ | 신제품·서비스 첫 단독 기사 | 업종별 맞춤 이슈, 기본 대응 감각 검증 |
| **STAGE 2** | ★★ | 직장문화·노사 갈등 내부 제보 | 제보 진위·여론 방어(`#07`)와 피해 구제 판단 |
| **STAGE 3** | ★★★ | 내부 문건 유출 · 공시 의혹 | 사실관계·공시 정밀 대조(`#06`) 및 팩트 정합성 싸움 |
| **STAGE 4** | ★★★★ | 방송 탐사보도팀 6개월 취재 | **기자 2명 동시 공동취재**, 카메라 플래시 압박 |
| **STAGE 5** | ★★★★★ | 검찰 압수수색 속보 D-DAY | 짧은 마감 턴, 파란 압수수색 박스와 수사차량 연출 |
| **STAGE 6** | ★★★★★★ | **회장님의 초대형 오너 리스크** | 6종 랜덤 사건 변주 + 1~5단계 누적 평판·RISK·기자 기억 반영 |

---

## 📊 가상 시뮬레이션 투명성 고지

- 본 프로젝트의 모든 확률, 상성 배율, 생존율 분포는 **실제 기업이나 언론인의 현실 행동을 예측하는 것이 아니라**, 게임 내 수학적 규칙과 난수 시드(Mulberry32 PRNG)에 따라 계산된 가상 시뮬레이션 결과입니다.
- 개인 리포트는 오직 실제 플레이에서 기록된 `telemetryLogs`만을 집계하며, 임의 생성 데이터를 실제 플레이 결과나 전체 이용자 통계처럼 표시하지 않습니다.
- 대나무숲 커뮤니티는 외부 Supabase 환경변수 미설정 시 상단에 `[데모 모드]`임을 명확히 표시하고 기본 수록글에 `[예시 글]` 배지를 부여합니다.

---

## 🚀 로컬 실행 및 테스트

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173/hongdam-craft/)
npm run dev

# 린트 검사
npm run lint

# 자동 시뮬레이션 검증 스위트 실행 (전체 20종 핵심 스킬, 엔딩, 밸런스, WHAT-IF 재현성, 다국어 검증)
npm run test:sim

# 프로덕션 빌드
npm run build
```

---

## ☁️ 선택 사항: 공용 Supabase 대나무숲 DB 설정

공용 게시판을 활성화하려면 Supabase SQL Editor에서 아래 테이블을 생성한 뒤 `.env` (또는 GitHub Actions Secrets)에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록하세요.

```sql
create table if not exists public.hongdam_posts (
  id uuid primary key default gen_random_uuid(),
  author_nickname text not null,
  company_label text,
  ending_badge_ko text,
  ending_badge_en text,
  archetype_badge_ko text,
  archetype_badge_en text,
  category text not null default 'survival_log',
  content text not null,
  reactions jsonb not null default '{"soju":0,"summon_reporter":0,"call_chairman":0,"comfort":0,"congrats":0}'::jsonb,
  report_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.hongdam_posts enable row level security;

create policy "Anyone can read non-hidden posts"
  on public.hongdam_posts for select
  using (report_count < 5);

create policy "Anyone can insert posts"
  on public.hongdam_posts for insert
  with check (char_length(content) between 3 and 350);

create policy "Anyone can update reactions and reports"
  on public.hongdam_posts for update
  using (true);
```

---

## 🌐 GitHub Pages 배포 방법

`.github/workflows/deploy.yml` 워크플로가 포함되어 있습니다.
1. GitHub에서 `hongdam-craft` 저장소를 생성하고 `main` 브랜치를 푸시합니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정하면 `https://raspos.github.io/hongdam-craft/`에 자동 배포됩니다.
