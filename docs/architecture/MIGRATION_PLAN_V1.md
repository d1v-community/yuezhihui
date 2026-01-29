# Migration Plan v1 (Remix + Taro)

This is a staged plan to migrate from the current codebase to the target architecture defined in `docs/architecture/TARGET_ARCHITECTURE.md`.

Principles
- Keep production usable during migration (ship in slices).
- Preserve existing API shapes where possible to reduce client churn.
- Avoid "big bang" repo moves unless a phase is ready to absorb the fallout.

---

## Phase 0: Align on Contracts and Data Model (Design + Spike)

Deliverables
- Confirm the canonical API shapes for:
  - auth (web + wechat)
  - menstrual daily records
  - product brands/series (if needed)
- Confirm day key rules (YYYY-MM-DD, timezone assumptions).
- Write `packages/contracts` schemas (zod) for the above.
- Write `packages/core` pure utilities for:
  - dateKey formatting/clamping
  - volume calculations / summary derivations

Exit criteria
- All stakeholders agree on request/response JSON (sample payloads included).

---

## Phase 1: Repo Restructure to Monorepo Skeleton (No Feature Changes)

Deliverables
- Introduce pnpm workspace layout:
  - `apps/api` (move existing Remix app; keep `/api/*` + landing)
  - `apps/app` (new Taro app skeleton; builds H5 + WeChat mini-program)
  - `packages/core`, `packages/contracts`, `packages/api-client`
- CI/dev scripts for running web and mp in parallel.

Exit criteria
- `apps/api` runs locally and deploys the same as before.
- `apps/app` builds:
  - H5 page (hello + API ping)
  - mini-program page (hello + API ping)

Risk controls
- Do the move in one PR; keep a temporary compatibility `paths` mapping for imports.

---

## Phase 2: Backend API for Menstrual Daily Records (Remix)

Deliverables
- Implement `/api/menstrual/daily*` in Remix using Drizzle.
- Auth enforcement via `Authorization: Bearer`.
- Server-side validation via `packages/contracts`.
- Minimal seed/migrate for new tables (if needed).

Exit criteria
- Postman/curl tests pass:
  - create/update a day
  - read single day
  - read range
  - auth required (401 without token)

Compatibility goal
- Match the existing mini-program client endpoints (to allow incremental client migration).

---

## Phase 3: Taro Mini-program "Happy Path"

Deliverables
- Implement mini-program auth bootstrap:
  - `wx.login()` -> `POST /api/auth/wechat/login` -> store token
- Implement daily record MVP:
  - select date (<= today)
  - load day
  - add pad/tampon usage event
  - submit day

Exit criteria
- A new user can log in and submit at least one day record successfully.

---

## Phase 4: Onboarding -> AnchorDate -> First Daily Completion UX

Deliverables
- Rewrite onboarding questionnaire as Taro pages:
  - use latest question design (`QUESTIONNAIRE_V2.md`) and user flows
  - submit questionnaire to server; server persists `anchorDate` (if available)
- Implement client boot logic (both H5 + mini-program):
  - call `GET /api/auth/me` (or profile endpoint)
  - if `firstCompletedAt` missing -> default select `anchorDate`
  - else -> default select today
- Implement "confirm edit" UX:
  - detect dirty edits relative to loaded snapshot
  - button label: `提交` vs `确认更改`
  - warn on date switch with unsaved edits

Exit criteria
- Matches the written flow in product docs and passes QA cases for first-time and returning users.

---

## Phase 5: Feature Parity and Cleanup

Deliverables (as needed)
- initData/backfill flow for last period range
- analytics page parity
- settings (visibility/product prefs)
- encyclopedia / education content parity

Cleanup
- Remove legacy code paths and temporary compatibility adapters.
- Lock in ADRs as "accepted" once stable.

Exit criteria
- Old mini-program implementation can be deprecated without losing core capabilities.

---

## De-risk Checklist (Do early)

- DateKey: verify day boundaries around midnight in China timezone and device timezone.
- Token lifecycle: handle 401 globally (re-login, clear token).
- Idempotency: multiple PUTs for same date should not duplicate events unintentionally.
- Concurrency: last-write-wins rules for editing the same day across devices.
- Observability: server logs include request id, user id, dateKey for debugging.
