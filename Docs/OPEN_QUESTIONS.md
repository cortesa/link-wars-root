# Open Questions and Scenarios Checklist

This document tracks pending decisions and edge-case flows that affect architecture.

---

## 1. Authentication and Session

- [ ] Session token expiration during long matches: renew or allow until match end?
- [ ] Multiple sessions per user (two tabs/devices): allow, replace, or reject?
- [ ] User revoked in Keycloak while in-match: terminate or allow match to finish?
- [ ] Portal down while match runs: how to end session and surface results?

---

## 2. Cashier and Economy

- [ ] Partial failure: withdraw succeeds but payout fails (retry/queue/manual)?
- [ ] Idempotency scope: per operation vs per match?
- [ ] Pool reconciliation audit: verify sum(withdraw) = sum(deposit)?
- [ ] Insufficient funds flow: UX in portal, and server-side behavior?

---

## 3. Game Flow Edge Cases

- [ ] Match cancelled before start: full refund to all players?
- [ ] Voluntary forfeit rules: same as elimination or special handling?
- [ ] Late reconnection after timeout: hard reject or allow spectator?
- [ ] Timeout end: final tie-breaker order (soldiers/towers/etc.)?
- [ ] Draw or all-disconnect: refund all or split pool?

---

## 4. Security

- [ ] Session token replay risk (URL leaks): one-time use or short TTL?
- [ ] Cashier secrets: per-session vs per-service; rotation strategy?
- [ ] postMessage origin validation: strict allowlist for portal/game origins?

---

## 5. Observability and Ops

- [ ] Traceability: map `sessionToken` ↔ `roomId` ↔ `txId` consistently.
- [ ] Minimum metrics: drop rate, cashier errors, average match time.
- [ ] Structured logging and audit trail for payouts/refunds.

---

## 6. Multi-Game Growth

- [ ] Game catalog registry: config source of truth and versioning.
- [ ] Game-server strategy: per-game servers vs shared multi-room stack.
