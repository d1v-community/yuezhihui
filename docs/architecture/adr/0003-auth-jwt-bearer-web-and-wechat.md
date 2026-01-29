# ADR 0003: Unified auth via JWT bearer token (web + WeChat mini-program)

Status: proposed

## Context

We have two clients:
- Web (Remix) can use HTTP-only cookies for SSR friendliness.
- WeChat mini-program cannot reliably use HTTP-only cookies and typically uses a stored token.

We also want one authorization mechanism for all `/api/*` endpoints.

## Decision

Use `Authorization: Bearer <jwt>` as the primary auth mechanism for `/api/*`.

- Web:
  - Keep existing cookie support as a fallback/compat path (SSR loaders can read cookie).
  - Keep the client fetch interceptor that attaches the bearer token for same-origin `/api/*`.
- Mini-program:
  - Store token in `wx.setStorage` (or Taro storage) and attach bearer token on every API request.
  - Implement `POST /api/auth/wechat/login` to exchange `wx.login()` code for a token.

## Consequences

Positive
- Same server-side auth checks for both clients.
- Simple API gateway story (any client with a token can call `/api/*`).
- Cookie usage becomes optional, not required.

Negative / tradeoffs
- Token storage in mini-program is not as strong as HTTP-only cookies; mitigate via short TTL + refresh + logout on 401.

