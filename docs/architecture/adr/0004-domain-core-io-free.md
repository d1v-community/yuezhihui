# ADR 0004: Domain core package is IO-free

Status: proposed

## Context

We want to reuse menstrual-domain logic across:
- Remix server
- Remix web client
- Taro mini-program

IO APIs differ per runtime (`fetch`, `wx`, DB access, environment variables).

## Decision

Create `packages/core` with a strict rule: no IO.
- Allowed: pure functions, types, constants, date/number formatting, calculation utilities.
- Disallowed: DB, network calls, reading `process.env`, using `window`, using `wx`.

## Consequences

Positive
- Safe reuse across all runtimes without bundling issues.
- Easier unit testing (pure functions).

Negative / tradeoffs
- Some convenience helpers must live in adapter layers (`api-client`, server services).

