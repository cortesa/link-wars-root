# Infrastructure & Deployment

## Overview
This directory contains the orchestration and environment configuration for the entire Link Wars stack.

## Docker Strategy
We use `docker-compose.yml` to spin up the following services for local development:
- `keycloak-db` (Postgres)
- `keycloak`
- `cashier-db` (Postgres)
- `cashier-api` (Local build)
- `game-server` (Local build)
- `redis` (Optional)

## Local Development Workflow
1. `docker-compose up -d`: Start shared infrastructure (databases, keycloak).
2. Run services locally:
    - Cashier: `cd services/cashier && yarn dev`
    - Game Server: `cd services/game-server && yarn dev`
    - Client: `cd services/client-web && yarn dev`

This "hybrid" approach (infra in Docker, services local) allows for faster TDD cycles and better debugging.
