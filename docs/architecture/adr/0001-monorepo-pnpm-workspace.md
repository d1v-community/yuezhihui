# ADR 0001: Monorepo via pnpm workspaces

Status: proposed

## Context

We need to ship:
- A Remix web app (also hosting `/api/*`)
- A Taro WeChat mini-program app
- Shared domain + contract code reused by both

Remix and Taro require separate build toolchains and runtime-specific code, but we want one repository and one set of shared packages.

## Decision

Adopt a pnpm-workspace monorepo layout:
- `apps/web` for Remix
- `apps/mp` for Taro
- `packages/*` for shared code (`core`, `contracts`, `api-client`, optional `ui`)

## Consequences

Positive
- Clear separation of runtimes while still enabling code sharing.
- Independent dev workflows (web dev server vs mini-program dev server).
- Shared packages reduce drift in types and business logic.

Negative / tradeoffs
- Requires moving the current Remix app into `apps/web` (one-time churn).
- Tooling/config consolidation work (tsconfig paths, eslint, build).

