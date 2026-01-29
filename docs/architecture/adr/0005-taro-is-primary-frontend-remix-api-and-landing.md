# ADR 0005: Taro is the primary frontend; Remix serves API + landing

Status: accepted (2026-01-29)

## Context

We need one codebase that:
- runs on the web, and
- can be packaged as a WeChat mini-program

Taro is designed for cross-platform apps (H5 + mini-program). Remix is a strong backend/API host for Node with a good route model.

## Decision

- Product frontend is built in Taro:
  - Taro H5 is the primary web application
  - Taro WeChat mini-program is built from the same Taro app
- Remix is used for:
  - `/api/*` backend
  - a minimal landing page (optional)

## Consequences

Positive
- One product UI implementation across web + mini-program.
- Remix can focus on API/DB/auth where it is strongest.

Negative / tradeoffs
- Web and API are no longer same-origin by default; we must implement:
  - API base URL configuration in Taro
  - CORS and cookie strategy (we will use Bearer tokens)

