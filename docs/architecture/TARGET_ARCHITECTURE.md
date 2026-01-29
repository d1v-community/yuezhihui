# Target Architecture (Remix + Taro)

This document defines the target architecture for refactoring to:
- Remix: backend API (`/api/*`) + a minimal web surface (landing page)
- Taro: primary frontend (builds H5 for web + builds WeChat mini-program)
- Shared packages: domain logic + API contracts reused by all runtimes

Scope: architecture only (repo layout, boundaries, data flow, auth, routing conventions). Not an implementation plan.

---

## 1. Goals / Non-goals

Goals
- One backend API surface that both Taro H5 and Taro mini-program can call.
- One set of shared domain types/schemas/calculations to avoid divergence (bleeding/day events/volume logic).
- Clear runtime separation: SSR/server-only code never bundles into mini-program; mini-program-only APIs never leak into Remix server.
- Gradual migration possible (keep existing mini-program running while new stack lands).

Non-goals (for v1)
- A shared UI layer between Taro and Remix (Remix only hosts landing; product UI lives in Taro).
- Offline-first sync engine (we will support basic retry + local draft caching only).

---

## 2. High-level System Diagram

```mermaid
flowchart LR
  subgraph ClientH5[Web (Taro H5)]
    H5UI[Pages + UI]
    H5UI -->|HTTPS API (CORS)| WebAPI
  end

  subgraph ClientMP[WeChat Mini-Program (Taro React)]
    MPUI[Pages + UI]
    MPUI -->|HTTPS API| WebAPI
  end

  subgraph Server[Remix Server]
    WebAPI[/API Routes\n/api/*/]
    Landing[Landing Page\n(optional)]
    WebAPI --> Auth[Auth service\n(JWT/session)]
    WebAPI --> Domain[Domain services\n(use-cases)]
    Domain --> DB[(PostgreSQL\nDrizzle)]
  end

  subgraph Shared[Shared Packages]
    Contracts[API contracts\n(zod/types)]
    Core[Domain core\n(calcs, models)]
    H5UI -. uses .-> Contracts
    MPUI -. uses .-> Contracts
    Domain -. uses .-> Core
    WebAPI -. uses .-> Contracts
  end
```

Key rule: Only the Remix server talks to the database. Both clients talk to `/api/*`.

---

## 3. Repo Layout (Proposed Monorepo)

We recommend turning this repository into a pnpm-workspace monorepo:

```
female_menstrual_record_819e28/
  apps/
    app/                # Taro (builds H5 + WeChat mini-program)
  packages/
    core/               # Pure domain logic (no IO): date utils, volume calc, etc.
    contracts/          # Shared zod schemas + TypeScript types for API payloads
    api-client/         # Typed client (H5 + mini-program)
    ui/                 # Optional: shared presentational components (keep minimal)
  tooling/
    eslint/ tsconfig/   # Shared configs (optional)
  docs/
    architecture/
      TARGET_ARCHITECTURE.md
      ...
```

Current implementation note (so Vercel stays simple):
- Remix stays at the repo root for now (API + landing).
- Taro lives at `apps/app` and builds H5 assets into Remix `public/app`.

Rationale
- Remix and Taro have different build pipelines and runtime constraints; keeping them as separate apps avoids brittle conditional builds.
- Shared packages enforce consistent payload shapes and reduce duplicated business logic.

---

## 4. Runtime Boundaries (Must-follow)

### 4.1 Server-only code (Remix)
- Database access (Drizzle, migrations, seeds)
- Secret handling (JWT secret, WeChat app secret, email keys)
- All write operations that need authorization enforcement

### 4.2 Mini-program-only code (Taro)
- `wx.*` APIs (login, storage, navigation, request if not using Taro wrapper)
- Page lifecycle and page route config

### 4.3 Shared code rules
- `packages/core` must be IO-free (no `fetch`, no `wx`, no `process.env`).
- `packages/contracts` may depend on `zod` (or types only), but must not import Remix/Taro.

---

## 5. API Surface (Target)

We keep the existing convention: `/api/...` with token-based auth.

### 5.1 Auth
Web (Taro H5)
- Same as mini-program: bearer token stored in web storage.
- Login can be WeChat-based or email-based depending on product decision; for v1, WeChat login is the main path.

Mini-program (WeChat)
- Add `POST /api/auth/wechat/login`:
  - input: `{ code: string }` from `wx.login()`
  - output: `{ token: string, user: {...} }`
  - token stored by the mini-program client and sent via `Authorization: Bearer <token>`

### 5.2 Menstrual Daily Records
Align with existing mini-program client contract:
- `GET /api/menstrual/daily?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /api/menstrual/daily/:date`
- `PUT /api/menstrual/daily/:date`

Payload shape comes from `packages/contracts` and is validated server-side with zod.

### 5.3 Products
If product brands/series are required by UI:
- `GET /api/products/brands`
- `GET /api/products/series?brandId=...`
Keep responses cached aggressively (public) unless user-specific.

---

## 6. Data Model (Conceptual)

We model "a day" as a summary + a list of events.

Core concepts
- DailyRecord:
  - `dateKey` (YYYY-MM-DD, user-local day)
  - `hasBleeding` boolean
  - derived fields: `totalVolumeMl`, `dayColor`, `clotCounts`
- Event:
  - common: `eventTime` ISO string, `eventType` ('pad' | 'tampon' | 'symptom')
  - usage fields: productType/model/absorbency/brand/series/lengthMm/color/volumeMl
  - symptom fields: symptomName

DB tables (suggested)
- `users`
- `menstrual_daily` (userId, dateKey, hasBleeding, createdAt, updatedAt)
- `menstrual_event` (dailyId, eventTime, eventType, payload columns, createdAt)

---

## 7. Date/Timezone Rules (Hard requirements)

- All day addressing uses `YYYY-MM-DD` (not timestamps) to avoid timezone drift.
- v1: The server treats `dateKey` as Asia/Shanghai day (single canonical timezone).
- Clients must prevent selecting future dates; server also enforces `dateKey <= today` (based on configured timezone).

---

## 8. UX-driven State (Onboarding -> Daily)

From the existing flow requirement:
- After onboarding success, first-time users jump to an `anchorDate` (e.g. last period start).
- After first successful daily submission, default selection becomes today.

Architecture recommendation
- Persist `daily.firstCompletedAt` on the server (cross-device consistent), with a client fallback cache for speed.
- Persist `onboarding.anchorDate` server-side (derived from questionnaire answers), with client cache for routing.

---

## 9. Routing Strategy

### 9.1 Remix (API + landing)
- File-based routes under `apps/api/app/routes`.
- `/api/*` routes in Remix for shared API.
- Web UI routes are minimal (landing page; optional admin/debug).

### 9.2 Taro app (H5 + mini-program)
- Page list in `apps/app/src/pages/*`
- Key pages (suggested):
  - `pages/home` (daily record + date selection)
  - `pages/initData` (backfill last period range)
  - `pages/login` (WeChat login bootstrap)
  - `pages/onboarding/*` (questionnaire rewritten in Taro, using latest flow)
  - `pages/setting` (visibility/product preferences)
  - `pages/analyze` (analytics)

---

## 10. Testing Strategy (Minimum)

- Shared packages:
  - unit tests for `packages/core` (volume calc, date math)
  - contract tests for `packages/contracts` (zod parse)
- Server:
  - request-level tests for `/api/menstrual/daily/*` (auth, date bounds, update semantics)
- Mini-program:
  - smoke tests/manual scripts for login + record flow (automated E2E can be added later)
