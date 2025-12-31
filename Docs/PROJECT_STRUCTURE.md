# Project Structure Map

This document provides a detailed breakdown of the `link-wars` meta-repository and its independent services.

## Meta-Repository (Root: `link-wars/`)
The root directory acts as the orchestrator for all services and holds global knowledge.

- `Docs/`: Global architectural documents, diagrams, and cross-service specifications.
- `infra/`: Shared infrastructure configuration.
    - `docker/`: Custom Dockerfiles for services (if not kept inside service repos).
    - `k8s/`: (Future) Kubernetes manifests for deployment.
- `docker-compose.yml`: Local development environment definition.
- `package.json`: (Minimal) Root scripts for managing submodules or running everything.

---

## Services (Directory: `services/`)
Each directory here is an independent Git repository (Submodule).

### 1. Identity (`services/identity/`)
Keycloak instance and configuration.
- `realm-config/`: JSON exports of the Link Wars realm, clients, and roles.
- `themes/`: Custom login/registration UI themes.

### 2. Cashier API (`services/cashier/`)
The authoritative economic center.
- `prisma/`: Database schema (`schema.prisma`) and SQL migrations.
- `src/`:
    - `routes/`: Express/Fastify API definitions.
    - `services/`: Core logic for credits, debits, and balance checks.
    - `middlewares/`: JWT validation and error handling.
- `tests/`: TDD suite (Unit & Integration).

### 3. Game Server (`services/game-server/`)
The real-time authoritative simulation.
- `src/`:
    - `rooms/`: Colyseus room logic (Match, Tournament Hub).
    - `logic/`: Pure game mechanics (Combat, Unit movement).
    - `infrastructure/`: Connectors for Cashier and Keycloak.
- `tests/`: Logic simulation and room lifecycle tests.

### 4. Web Client (`services/client-web/`)
The Phaser-based front-end.
- `src/`:
    - `scenes/`: Phaser scenes (Preload, Menu, Match).
    - `network/`: Websocket client and OIDC login logic.
    - `ui/`: HTML/CSS overlays for non-game elements (Modals, HUD).
- `public/`: Assets (Sprites, Audio, Fonts).
- `tests/`: Unit tests for UI logic and E2E flows (Playwright).

---

## Shared Standards
All services must follow these conventions:
1. **Package Manager**: Use **Yarn** for all dependency management and scripts.
2. **Docker**: Every service must have a `Dockerfile`.
3. **Environment**: Configuration via `.env` files (templates provided as `.env.example`).
4. **Tests**: All services use `Vitest` as the primary test runner for consistency.
5. **Logs**: Standardized JSON logging format.
