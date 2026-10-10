# BidVett

프리랜서가 Upwork 공고에 지원하기 전에, **공고의 위험 신호**와 **내 프로필과의 적합도**를 한 번에 확인하게 해 주는 SaaS 입니다.

**서비스** — https://bidvett.vercel.app

공고를 붙여 넣으면 정량 규칙과 LLM 의 맥락 분석을 함께 돌려, 판단 이유와 원문 근거를 같이 보여 줍니다.

## 흐름

```
Google 로그인 → 프로필 준비(자동 추출 후 직접 수정) → 공고 분석 → 근거 확인 → 분석 이력
```

| 화면 | 내용 |
|---|---|
| 온보딩 | 프로필 글에서 기술 · 경력 · 희망 시급 · 시간대를 추출하고, 사용자가 고쳐서 저장 |
| 대시보드 | 공고 붙여 넣기 → 위험 신호 · 적합도 점수 · 판단 이유 · 원문 인용 |
| 분석 이력 | 공고 제목으로 지난 분석을 다시 보기 |
| 요금 · 계정 | 단건 크레딧과 기간형 구독 결제, 남은 이용량, 다음 결제 시점 취소 예약 |

## 판단 방식

LLM 결과를 그대로 믿지 않고, 숫자로 확인할 수 있는 것은 규칙으로 먼저 거릅니다.

- 고용률 20% 미만, 결제 미인증이면서 지출 0, 평점 3.5 이하 같은 **정량 위험 신호**는 규칙으로 판정한다.
- 각 지표를 **찾았는지 여부**를 따로 넘겨, 정보가 없는 것과 실제로 나쁜 지표를 구분한다.
- 규칙의 위험 판정이나 LLM 의 위험 판정이 있으면 **지원 회피 안내**를 보여 주고 점수는 숨긴다.
- LLM 응답은 Zod 스키마로 검증하고, 결과마다 근거가 된 원문 문장을 함께 보여 준다.

## 구조

```
브라우저 ── Next.js (Vercel) ── API 라우트
                                ├─ Supabase Auth · PostgreSQL  (로그인 · 프로필 · 분석 · 구독 · 크레딧)
                                ├─ LLM API                    (프로필 추출 · 공고 분석)
                                ├─ Vercel KV                  (호출 제한 · 진행 중 잠금 · 짧은 응답 캐시)
                                └─ Dodo Payments              (Checkout · Webhook)
```

설계에서 신경 쓴 경계입니다.

- **결과 기록과 이용량 차감은 한 DB 함수에서** — 분석 결과를 저장하면서 구독 사용량이나 크레딧 원장을 함께 반영한다. 잔액이 부족하면 분석 기록까지 같이 취소되어, 한쪽만 반영되는 일이 없다.
- **영구 데이터는 PostgreSQL, 임시 상태는 KV** — 일관성이 필요한 기록은 DB 처리에, 호출 제한 · 잠금 · 캐시는 KV 에 맡긴다.
- **권한** — 행 단위 접근 정책(RLS)을 두고, 브라우저용 · 쿠키 기반 서버용 · 관리자용 Supabase 클라이언트를 나눴다.
- **결제 Webhook** — 원문 서명을 검증해 위조를 막고, 이벤트 ID 를 저장해 중복 전달을 거른다. 유효한 구독이 있으면 추가 구독 결제를 막는다.

## 폴더

```
src/app/            화면과 API 라우트 (login · onboarding · dashboard · analyses · pricing · account · api)
src/lib/            risk-engine(정량 규칙) · extractors(공고 전처리) · openai · supabase · credits · dodo · rate-limit
supabase/migrations 스키마 · RLS · 트리거와 RPC · 시스템 프롬프트 등 순서대로 적용하는 SQL
tests/              API · Webhook 통합 시험
spec/               기획 · 설계 문서 (PRD · 아키텍처 · API · DB · 화면 · 일정)
```

## 품질

- Vitest 로 정량 규칙 · 전처리 · API · Webhook 을 시험한다.
- GitHub Actions 에서 lint · 타입 검사 · 시험 뒤 빌드를 돌린다.
- 배포된 서비스에서 로그인 → 분석 → 저장 · 조회 → 결제와 구독 흐름을 직접 확인했다.

## 로컬에서 실행

```bash
pnpm install
cp .env.example .env.local   # Supabase · LLM · KV · Dodo 값을 채운다
pnpm dev
pnpm test
```

DB 는 `supabase/migrations` 의 SQL 을 번호 순서대로 적용합니다.

## 기술

Next.js · React · TypeScript · Tailwind CSS · Radix UI · Supabase(Auth · PostgreSQL · RLS · RPC) · Zod · Vercel · Vercel KV · Dodo Payments · Vitest · GitHub Actions
