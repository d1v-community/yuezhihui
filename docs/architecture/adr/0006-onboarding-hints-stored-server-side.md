# ADR 0006: Onboarding hint state is stored server-side (anchorDate, firstCompletedAt)

Status: accepted (2026-01-29)

## Context

The product UX depends on a small amount of "guide state":
- `anchorDate`: where to jump on first entry after onboarding
- `firstCompletedAt`: whether the user has ever successfully submitted a daily record

This state should behave consistently across:
- devices
- web (Taro H5)
- WeChat mini-program

## Decision

Store onboarding hint state server-side and expose via API:
- `GET /api/profile` (or `GET /api/auth/me`) includes:
  - `onboarding.anchorDate` (nullable)
  - `daily.firstCompletedAt` (nullable)
- Server updates:
  - set `anchorDate` when onboarding questionnaire is submitted
  - set `firstCompletedAt` on the first successful daily submission (only if null)

Clients may cache locally for performance, but server is the source of truth.

## Consequences

Positive
- Cross-device consistency (no "why does it jump differently on another phone").
- Easier analytics/debug (server has the state).

Negative / tradeoffs
- Adds a small read dependency on profile state during app boot.
- Requires careful migration for existing users (default nulls).

