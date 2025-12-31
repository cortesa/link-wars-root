# Global Data Models

High-level schema definitions for shared entities across the system.

## 1. Player (Identity & Metrics)
Managed by Keycloak, referenced by all services.
- `id`: UUID (Keycloak `sub`).
- `username`: String.
- `balance`: Decimal (managed by Cashier).

---

## 2. Match (Game Server State)
The real-time representation of a single game.
- `matchId`: Unique string.
- `mode`: enum (`1V1`, `FFA`, `TOURNAMENT`).
- `towers`: Map of `TowerId` -> `TowerState`.
- `links`: List of `LinkState`.
- `status`: enum (`WAITING`, `STARTING`, `PLAYING`, `FINISHED`).

---

## 3. Transaction (Cashier Ledger)
The financial record of any balance change.
- `txId`: UUID.
- `playerId`: UUID.
- `amount`: Decimal (Positive for credit, Negative for debit).
- `type`: enum (`BUY_IN`, `PAYOUT`, `REFUND`, `INITIAL_BONUS`).
- `idempotencyKey`: Unique string provided by the caller.
- `timestamp`: UTC DateTime.

---

## 4. Tournament (Management)
The bracket-level entity.
- `tournamentId`: UUID.
- `entryFee`: Decimal.
- `potTotal`: Decimal.
- `bracket`: JSON/Array (winner tree structure).
- `winnerIds`: List of UUIDs (ordered 1st, 2nd, etc.).

---

## Model Consistency Rule
- **Primary Source**: Each field must have a "Source of Truth" service.
    - Balance -> Cashier.
    - Game State -> Game Server.
    - Display Name -> Keycloak.
- **Referential Integrity**: Always use the Keycloak `sub` as the `playerId` across all DBs.
