# Service Communication & Protocols

This document defines how information flows between the different services in the Link Wars ecosystem.

## 1. Authentication Flow (Stateless JWT)
Security is handled centrally by Keycloak and validated locally by services.

1.  **Login**: Client authenticates with Keycloak (OIDC Authorization Code Flow + PKCE).
2.  **Token**: Keycloak issues an `accessToken` (JWT).
3.  **Consumption**:
    -   **Websockets**: Client sends JWT in the initial connection handshake to the Game Server.
    -   **REST**: Client (if needed) or internal services send JWT in the `Authorization: Bearer <token>` header.
4.  **Validation**: Services validate the JWT using the Public Key (JWKS) from Keycloak.

## 2. Internal Communication (Server-to-Server)
Mostly between **Game Server** and **Cashier API**.

### Game Server -> Cashier API (REST)
| Endpoint | Method | Description | Security |
| :--- | :--- | :--- | :--- |
| `/v1/wallets/:playerId/balance` | GET | Check player funds. | Internal Key / JWT |
| `/v1/transactions/buy-in` | POST | Commit tournament entry fee. | Idempotency Key |
| `/v1/transactions/payout` | POST | Distribute prize pot to multiple users. | Idempotency Key |

---

## 3. Real-time Communication (Client-to-Server)
Handled via **WebSockets** using the Colyseus framework.

### State Synchronization
The Game Server broadcasts the `GameState` schema periodically. The client patches its local copy.

### Client Messages (Intentions)
| Type | Data Payload | Responsibility |
| :--- | :--- | :--- |
| `COMMIT_LINK` | `{ from: string, to: string }` | Request to bridge two towers. |
| `CANCEL_LINK` | `{ linkId: string }` | Request to disconnect a bridge. |
| `JOIN_TOURNAMENT` | `{ tournamentId: string }` | Register for an upcoming bracket. |

---

## 4. Event Bus (Optional / Future)
If asynchronous processing is needed (e.g., global notifications), a **Redis Pub/Sub** or **RabbitMQ** will be introduced.
- **Topic**: `user.payout.completed` -> Triggers email or global UI alert.
- **Topic**: `tournament.created` -> Broadcasts to all connected lobby clients.
