# ADR 0002: Shared API contracts via zod + TypeScript

Status: proposed

## Context

We need consistent request/response payload shapes across:
- Remix server handlers
- Remix web client fetch calls
- Taro mini-program request calls

We also need runtime validation at the server boundary to avoid bad data writes.

## Decision

Create `packages/contracts` as the source of truth:
- Define zod schemas for API inputs/outputs (e.g. menstrual daily record).
- Export inferred TS types for clients (`z.infer<typeof Schema>`).
- Server uses schemas to validate/parse incoming data and to shape responses.

## Consequences

Positive
- Single definition used by all runtimes.
- Runtime validation on the server prevents silent contract drift.
- Easier refactors (compiler catches mismatches across apps).

Negative / tradeoffs
- Adds zod dependency to the shared layer (already present in repo).
- Requires discipline: no ad-hoc payloads outside contracts.

