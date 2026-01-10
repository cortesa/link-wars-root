# Identity Service - Keycloak Configuration

## Overview

Keycloak 26.0.0 serves as the central identity provider for Link Wars, handling user registration, authentication, and authorization via OpenID Connect (OIDC).

## Quick Start

### Development

```bash
# From project root
docker compose up identity postgres_identity
```

Keycloak will start at `http://localhost:8080` with the `link-wars` realm auto-imported.

### Admin Console Access

- URL: http://localhost:8080/admin
- Username: `admin`
- Password: Set via `IDENTITY_ADMIN_PASSWORD` env var (default: `admin`)

## Configuration

### Realm: link-wars

The realm is configured via JSON export file at `realm-config/link-wars-realm.json`.

#### Key Settings

| Setting | Value |
|---------|-------|
| User Registration | Enabled |
| Login with Email | Enabled |
| Forgot Password | Enabled |
| Remember Me | Enabled |
| Email Verification | Disabled (MVP) |
| Access Token Lifespan | 5 minutes |
| SSO Session Idle | 30 minutes |
| SSO Session Max | 10 hours |
| Refresh Token Rotation | Enabled |

#### Password Policy

- Minimum 8 characters
- Cannot be username
- Cannot be email

### Clients

| Client ID | Type | Purpose |
|-----------|------|---------|
| `link-wars-portal` | Public (PKCE S256) | Web portal React app |
| `game-server` | Bearer-only | Game server token validation |
| `cashier-api` | Bearer-only | Cashier service token validation |

### Roles

| Role | Description | Auto-Assigned |
|------|-------------|---------------|
| `player` | Default user role | Yes |
| `vip` | Premium users with higher limits | No |
| `admin` | System administrators | No |

## Test Users (Development Only)

| Username | Password | Roles |
|----------|----------|-------|
| testplayer | testpass123 | player |
| testvip | testpass123 | player, vip |
| testadmin | testpass123 | player, admin |

## File Structure

```
services/identity/
├── Dockerfile                    # Multi-stage build with realm import
├── README.md                     # This file
└── realm-config/
    └── link-wars-realm.json      # Complete realm configuration
```

## Making Changes

### Updating Realm Configuration

1. Edit `realm-config/link-wars-realm.json`
2. Delete the existing realm via Admin Console (or reset the database)
3. Restart the identity service: `docker compose restart identity`

**Note:** Keycloak only imports realms that don't exist. To re-import after changes:

```bash
docker compose down -v  # Removes volumes (database data)
docker compose up identity postgres_identity
```

### Adding New Clients

Add to the `clients` array in `link-wars-realm.json`:

```json
{
  "clientId": "new-client-id",
  "name": "New Client Name",
  "enabled": true,
  "publicClient": true,
  "standardFlowEnabled": true,
  ...
}
```

### Exporting Current Configuration

To export the current realm state (useful for capturing manual changes):

```bash
docker exec link-wars-identity-1 /opt/keycloak/bin/kc.sh export \
  --dir /tmp/export \
  --realm link-wars

docker cp link-wars-identity-1:/tmp/export/link-wars-realm.json ./realm-config/
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KC_DB` | postgres | Database type |
| `KC_DB_URL` | (set in compose) | JDBC connection URL |
| `KC_DB_USERNAME` | keycloak | Database user |
| `KC_DB_PASSWORD` | (from env) | Database password |
| `KEYCLOAK_ADMIN` | admin | Admin console username |
| `KEYCLOAK_ADMIN_PASSWORD` | admin | Admin console password |

## URLs

| Purpose | URL |
|---------|-----|
| Admin Console | http://localhost:8080/admin |
| Realm Account | http://localhost:8080/realms/link-wars/account |
| OIDC Discovery | http://localhost:8080/realms/link-wars/.well-known/openid-configuration |
| Login Page | http://localhost:8080/realms/link-wars/protocol/openid-connect/auth |
| Registration | http://localhost:8080/realms/link-wars/protocol/openid-connect/registrations |

## References

- [Keycloak 26.0 Documentation](https://www.keycloak.org/documentation)
- [AUTH_IMPLEMENTATION_SPEC.md](../../Docs/AUTH_IMPLEMENTATION_SPEC.md)
