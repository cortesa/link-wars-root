# Authentication Implementation Specification

## Level 2 Technical Analysis: Register & Login Flows

This document provides a detailed technical specification for implementing user registration and login flows between the **web-portal** and **Keycloak**. It covers UI components, library selection, token management, and step-by-step implementation guidance.

---

## 1. Executive Summary

### Scope
- **Register Flow**: New user registration via Keycloak's built-in registration form
- **Login Flow**: OAuth 2.0 Authorization Code Flow with PKCE
- **Token Management**: Secure storage, refresh, and logout handling
- **Protected Routes**: Auth guards for game access

### Services Involved
| Service | Role | Changes Required |
|---------|------|------------------|
| **web-portal** | Initiates auth flows, stores tokens, protects routes | Major implementation |
| **Keycloak (identity)** | Handles registration form, login, JWT issuance | Configuration only |

### Key Decisions
- Use **keycloak-js** (official adapter) for browser-based OIDC
- Access tokens stored in **memory** (security best practice)
- Refresh tokens stored in **memory** (with silent refresh iframe)
- PKCE enabled for all flows (public client security)

---

## 2. Keycloak Configuration Requirements

### 2.1 Realm Configuration

```yaml
Realm Name: link-wars

Settings:
  Login:
    User registration: ON
    Email as username: OFF
    Edit username: OFF
    Forgot password: ON
    Remember me: ON
    Verify email: OFF (MVP - enable later)
    Login with email: ON

  Tokens:
    Access Token Lifespan: 5 minutes
    Access Token Lifespan For Implicit Flow: 5 minutes
    Client Session Idle: 30 minutes
    Client Session Max: 10 hours
    SSO Session Idle: 30 minutes
    SSO Session Max: 10 hours
    Refresh Token Max Reuse: 0 (single use - rotation enabled)

  Sessions:
    Revoke Refresh Token: ON (security - token rotation)
```

### 2.2 Client Configuration

```yaml
Client ID: link-wars-portal

Settings:
  Client Protocol: openid-connect
  Access Type: public
  Standard Flow Enabled: true
  Implicit Flow Enabled: false
  Direct Access Grants Enabled: false
  Service Accounts Enabled: false

  Root URL: http://localhost:5173
  Valid Redirect URIs:
    - http://localhost:5173/*
    - https://linkwars.com/*
  Valid Post Logout Redirect URIs:
    - http://localhost:5173/*
    - https://linkwars.com/*
  Web Origins:
    - http://localhost:5173
    - https://linkwars.com
  Admin URL: (empty)

Advanced Settings:
  PKCE Code Challenge Method: S256
  Proof Key for Code Exchange Code Verifier: (auto-generated per flow)

Authentication Flow Overrides:
  Browser Flow: browser
  Direct Grant Flow: (disabled - not applicable)
```

### 2.3 Realm Roles

```yaml
Roles:
  - player:
      Description: Default role for registered users
      Default: true (auto-assigned on registration)
  - vip:
      Description: Premium users with higher limits
      Default: false
  - admin:
      Description: System administrators
      Default: false
```

### 2.4 User Registration Form Fields

Keycloak built-in registration form fields:

| Field | Required | Validation |
|-------|----------|------------|
| Username | Yes | 3-20 chars, alphanumeric + underscore |
| Email | Yes | Valid email format |
| First Name | No | (optional for MVP) |
| Last Name | No | (optional for MVP) |
| Password | Yes | Min 8 chars (configure in Password Policy) |
| Confirm Password | Yes | Must match password |

**Password Policy (Realm Settings > Authentication > Password Policy):**
```
length(8) and notUsername and notEmail
```

---

## 3. Library Selection & Dependencies

### 3.1 Primary Library: keycloak-js

**Why keycloak-js:**
- Official Keycloak adapter maintained by Red Hat
- Built-in PKCE support
- Automatic token refresh
- Silent SSO check (iframe-based)
- TypeScript support
- Well-documented and battle-tested

**Alternative Considered:**
- `oidc-client-ts`: More generic but requires more configuration
- `react-oidc-context`: Good but adds extra abstraction layer

**Installation:**
```bash
cd services/web-portal
yarn add keycloak-js
yarn add -D @types/keycloak-js  # Types included in main package since v20+
```

### 3.2 Package Versions

```json
{
  "dependencies": {
    "keycloak-js": "^26.0.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.x"
  }
}
```

**Note:** keycloak-js version should match or be compatible with Keycloak server version (26.0.0).

---

## 4. Web Portal Implementation

### 4.1 File Structure

```
services/web-portal/src/
├── auth/
│   ├── keycloak.ts              # Keycloak instance configuration
│   ├── AuthProvider.tsx         # React context provider
│   ├── useAuth.ts               # Custom hook for auth state
│   ├── AuthGuard.tsx            # Route protection component
│   └── __tests__/
│       ├── AuthProvider.test.tsx
│       └── AuthGuard.test.tsx
├── components/
│   ├── LoginButton.tsx          # Triggers login flow
│   ├── RegisterButton.tsx       # Triggers registration flow
│   ├── LogoutButton.tsx         # Triggers logout flow
│   └── UserMenu.tsx             # Displays user info (existing)
├── pages/
│   ├── Lobby.tsx                # Public page (existing)
│   └── GamePage.tsx             # Protected page (existing)
└── App.tsx                      # Root with AuthProvider
```

### 4.2 Keycloak Instance Configuration

```typescript
// services/web-portal/src/auth/keycloak.ts

import Keycloak from 'keycloak-js';

// Environment variables (Vite)
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'link-wars';
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'link-wars-portal';

// Singleton instance
const keycloak = new Keycloak({
  url: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
});

export default keycloak;

// Type definitions for user info
export interface KeycloakUser {
  id: string;           // Keycloak sub (subject)
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

// Extract user from token
export function parseUserFromToken(keycloak: Keycloak): KeycloakUser | null {
  if (!keycloak.tokenParsed) return null;

  const token = keycloak.tokenParsed as {
    sub: string;
    preferred_username: string;
    email: string;
    given_name?: string;
    family_name?: string;
    realm_access?: { roles: string[] };
  };

  return {
    id: token.sub,
    username: token.preferred_username,
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    roles: token.realm_access?.roles || [],
  };
}
```

### 4.3 Auth Provider (React Context)

```typescript
// services/web-portal/src/auth/AuthProvider.tsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import keycloak, { KeycloakUser, parseUserFromToken } from './keycloak';

interface AuthContextType {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: KeycloakUser | null;
  accessToken: string | null;

  // Actions
  login: (redirectUri?: string) => void;
  register: () => void;
  logout: () => void;

  // Utilities
  hasRole: (role: string) => boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<KeycloakUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize Keycloak on mount
  useEffect(() => {
    const initKeycloak = async () => {
      try {
        // Check if user is already authenticated (SSO)
        const authenticated = await keycloak.init({
          onLoad: 'check-sso',              // Silent check, no redirect
          pkceMethod: 'S256',               // Enable PKCE
          checkLoginIframe: true,           // Enable silent SSO check
          checkLoginIframeInterval: 30,     // Check every 30 seconds
          silentCheckSsoRedirectUri:
            window.location.origin + '/silent-check-sso.html',
        });

        if (authenticated) {
          setIsAuthenticated(true);
          setUser(parseUserFromToken(keycloak));
          setAccessToken(keycloak.token || null);

          // Setup automatic token refresh
          setupTokenRefresh();
        }
      } catch (error) {
        console.error('Keycloak initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();

    // Cleanup
    return () => {
      // Clear any refresh timers if needed
    };
  }, []);

  // Token refresh handler
  const setupTokenRefresh = useCallback(() => {
    // Refresh token 30 seconds before expiry
    const MIN_VALIDITY_SECONDS = 30;

    keycloak.onTokenExpired = async () => {
      try {
        const refreshed = await keycloak.updateToken(MIN_VALIDITY_SECONDS);
        if (refreshed) {
          setAccessToken(keycloak.token || null);
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Token refresh failed - user needs to re-login
        setIsAuthenticated(false);
        setUser(null);
        setAccessToken(null);
      }
    };
  }, []);

  // Login action
  const login = useCallback((redirectUri?: string) => {
    // Store intended destination
    if (redirectUri) {
      sessionStorage.setItem('redirectAfterLogin', redirectUri);
    }

    keycloak.login({
      redirectUri: window.location.origin + '/callback',
    });
  }, []);

  // Register action
  const register = useCallback(() => {
    keycloak.register({
      redirectUri: window.location.origin + '/callback',
    });
  }, []);

  // Logout action
  const logout = useCallback(() => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  }, []);

  // Check role
  const hasRole = useCallback((role: string): boolean => {
    return keycloak.hasRealmRole(role);
  }, []);

  // Get fresh token (with auto-refresh if needed)
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      await keycloak.updateToken(30); // Refresh if expires in 30s
      return keycloak.token || null;
    } catch {
      return null;
    }
  }, []);

  // Handle callback after login/register
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        // Use router navigation instead of window.location
        // This will be handled by the callback route
      }
    }
  }, [isAuthenticated, isLoading]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    login,
    register,
    logout,
    hasRole,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 4.4 Auth Guard Component

```typescript
// services/web-portal/src/auth/AuthGuard.tsx

import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface AuthGuardProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallback?: ReactNode;
}

export function AuthGuard({
  children,
  requiredRoles = [],
  fallback = <LoadingSpinner />,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, hasRole, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login, preserving intended destination
      login(location.pathname);
    }
  }, [isAuthenticated, isLoading, location.pathname, login]);

  // Still initializing
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Not authenticated - login redirect in progress
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check required roles
  if (requiredRoles.length > 0) {
    const hasAllRoles = requiredRoles.every((role) => hasRole(role));
    if (!hasAllRoles) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
}

// Simple loading spinner
function LoadingSpinner() {
  return (
    <div className="auth-loading">
      <div className="spinner" />
      <p>Loading...</p>
    </div>
  );
}

// Access denied screen
function AccessDenied() {
  return (
    <div className="access-denied">
      <h1>Access Denied</h1>
      <p>You don't have permission to access this page.</p>
    </div>
  );
}
```

### 4.5 UI Components

#### Login Button

```typescript
// services/web-portal/src/components/LoginButton.tsx

import { useAuth } from '../auth/AuthProvider';

interface LoginButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoginButton({ className, children }: LoginButtonProps) {
  const { login, isLoading } = useAuth();

  const handleClick = () => {
    login();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={isLoading}
      type="button"
    >
      {children || 'Login'}
    </button>
  );
}
```

#### Register Button

```typescript
// services/web-portal/src/components/RegisterButton.tsx

import { useAuth } from '../auth/AuthProvider';

interface RegisterButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function RegisterButton({ className, children }: RegisterButtonProps) {
  const { register, isLoading } = useAuth();

  const handleClick = () => {
    register();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={isLoading}
      type="button"
    >
      {children || 'Register'}
    </button>
  );
}
```

#### Logout Button

```typescript
// services/web-portal/src/components/LogoutButton.tsx

import { useAuth } from '../auth/AuthProvider';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const { logout, isLoading } = useAuth();

  const handleClick = () => {
    logout();
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={isLoading}
      type="button"
    >
      {children || 'Logout'}
    </button>
  );
}
```

### 4.6 Silent SSO Check Page

Create a static HTML file for silent SSO iframe:

```html
<!-- services/web-portal/public/silent-check-sso.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Silent SSO Check</title>
</head>
<body>
  <script>
    parent.postMessage(location.href, location.origin);
  </script>
</body>
</html>
```

### 4.7 Updated App.tsx

```typescript
// services/web-portal/src/App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { AuthGuard } from './auth/AuthGuard';
import Layout from './components/Layout';
import Lobby from './pages/Lobby';
import GamePage from './pages/GamePage';
import Callback from './pages/Callback';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route path="/" element={<Lobby />} />
            <Route path="/callback" element={<Callback />} />

            {/* Protected routes */}
            <Route
              path="/game/:gameSlug"
              element={
                <AuthGuard>
                  <GamePage />
                </AuthGuard>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### 4.8 Callback Page

```typescript
// services/web-portal/src/pages/Callback.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export default function Callback() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      // Get stored redirect URL or default to home
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/';
      sessionStorage.removeItem('redirectAfterLogin');

      if (isAuthenticated) {
        navigate(redirectUrl, { replace: true });
      } else {
        // Auth failed, go to home
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="callback-page">
      <div className="spinner" />
      <p>Completing login...</p>
    </div>
  );
}
```

### 4.9 Environment Variables

```env
# services/web-portal/.env.example

# Keycloak Configuration
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=link-wars
VITE_KEYCLOAK_CLIENT_ID=link-wars-portal

# Game Server (for session creation - future)
VITE_GAME_SERVER_API_URL=http://localhost:2567/api
```

---

## 5. Authentication Flow Diagrams

### 5.1 Registration Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION FLOW (DETAILED)                          │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐                    ┌─────────────────┐
  │  web-portal  │                    │    Keycloak     │
  │   (React)    │                    │ (localhost:8080)│
  └──────┬───────┘                    └────────┬────────┘
         │                                     │
    1. User clicks                             │
       <RegisterButton/>                       │
         │                                     │
    2. keycloak.register()                     │
       Generates PKCE:                         │
       - code_verifier (43-128 chars)          │
       - code_challenge = BASE64URL(           │
           SHA256(code_verifier))              │
       Store code_verifier in sessionStorage   │
         │                                     │
    3. Browser redirect (302)                  │
         │ GET /realms/link-wars/protocol/     │
         │     openid-connect/registrations    │
         │   ?client_id=link-wars-portal       │
         │   &redirect_uri=http://localhost:   │
         │       5173/callback                 │
         │   &response_type=code               │
         │   &scope=openid profile email       │
         │   &code_challenge=<challenge>       │
         │   &code_challenge_method=S256       │
         │   &state=<random-uuid>              │
         │─────────────────────────────────────▶│
         │                                     │
         │                                     │  4. Display registration form
         │                                     │     (Keycloak theme)
         │                                     │
         │          ┌──────────────────────────┤
         │          │   Registration Form      │
         │          │   ──────────────────     │
         │          │   Username: [________]   │
         │          │   Email:    [________]   │
         │          │   Password: [________]   │
         │          │   Confirm:  [________]   │
         │          │                          │
         │          │   [  Register  ]         │
         │          └──────────────────────────┤
         │                                     │
         │                                     │  5. User submits form
         │                                     │  6. Keycloak validates:
         │                                     │     - Username unique
         │                                     │     - Email unique
         │                                     │     - Password policy
         │                                     │  7. Creates user in DB
         │                                     │  8. Assigns 'player' role
         │                                     │  9. Creates user session
         │                                     │
    10. Redirect with authorization code       │
         │ GET /callback                       │
         │   ?code=<authorization_code>        │
         │   &state=<same-state>               │
         │   &session_state=<session-id>       │
         │◀─────────────────────────────────────│
         │                                     │
   11. Verify state matches                    │
       (CSRF protection)                       │
         │                                     │
   12. Exchange code for tokens                │
         │ POST /realms/link-wars/protocol/    │
         │      openid-connect/token           │
         │ Content-Type: application/x-www-    │
         │   form-urlencoded                   │
         │                                     │
         │ grant_type=authorization_code       │
         │ &code=<authorization_code>          │
         │ &redirect_uri=http://localhost:     │
         │     5173/callback                   │
         │ &client_id=link-wars-portal         │
         │ &code_verifier=<stored_verifier>    │
         │─────────────────────────────────────▶│
         │                                     │
         │                                     │ 13. Validate PKCE:
         │                                     │     BASE64URL(SHA256(verifier))
         │                                     │     == code_challenge
         │                                     │
         │  {                                  │
         │    "access_token": "<JWT>",         │
         │    "refresh_token": "<JWT>",        │
         │    "id_token": "<JWT>",             │
         │    "token_type": "Bearer",          │
         │    "expires_in": 300,               │
         │    "refresh_expires_in": 1800,      │
         │    "scope": "openid profile email"  │
         │  }                                  │
         │◀─────────────────────────────────────│
         │                                     │
   14. Store tokens:                           │
       - access_token → memory (JS variable)   │
       - refresh_token → memory                │
       - id_token → memory                     │
       Clear code_verifier from sessionStorage │
         │                                     │
   15. Parse access_token (JWT):               │
       - sub (user ID)                         │
       - preferred_username                    │
       - email                                 │
       - realm_access.roles                    │
         │                                     │
   16. Update React state:                     │
       - isAuthenticated = true                │
       - user = { id, username, email, roles } │
         │                                     │
   17. Navigate to stored redirect URL         │
       or default to "/" (Lobby)               │
         │                                     │
```

### 5.2 Login Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOGIN FLOW (DETAILED)                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐                    ┌─────────────────┐
  │  web-portal  │                    │    Keycloak     │
  └──────┬───────┘                    └────────┬────────┘
         │                                     │
    1. User clicks                             │
       <LoginButton/>                          │
         │                                     │
    2. keycloak.login()                        │
       Generates PKCE (same as register)       │
       Store state in sessionStorage           │
         │                                     │
    3. Browser redirect                        │
         │ GET /realms/link-wars/protocol/     │
         │     openid-connect/auth             │
         │   ?client_id=link-wars-portal       │
         │   &redirect_uri=...                 │
         │   &response_type=code               │
         │   &scope=openid profile email       │
         │   &code_challenge=<challenge>       │
         │   &code_challenge_method=S256       │
         │   &state=<random-uuid>              │
         │─────────────────────────────────────▶│
         │                                     │
         │                                     │  4. Display login form
         │                                     │
         │          ┌──────────────────────────┤
         │          │   Login                  │
         │          │   ─────                  │
         │          │   Username: [________]   │
         │          │   Password: [________]   │
         │          │                          │
         │          │   [ ] Remember me        │
         │          │                          │
         │          │   [  Sign In  ]          │
         │          │                          │
         │          │   Forgot password?       │
         │          │   New user? Register     │
         │          └──────────────────────────┤
         │                                     │
         │                                     │  5. User submits credentials
         │                                     │  6. Keycloak validates
         │                                     │  7. Creates session
         │                                     │
    8. Redirect with auth code                 │
         │◀─────────────────────────────────────│
         │                                     │
    9-17. Same as registration flow            │
       (token exchange, storage, state update) │
         │                                     │
```

### 5.3 Token Refresh Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TOKEN REFRESH FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐                    ┌─────────────────┐
  │  web-portal  │                    │    Keycloak     │
  └──────┬───────┘                    └────────┬────────┘
         │                                     │
    1. Timer fires: token expires              │
       in < 30 seconds                         │
       OR                                      │
       getToken() called with                  │
       near-expired token                      │
         │                                     │
    2. keycloak.updateToken(30)                │
         │                                     │
         │ POST /realms/link-wars/protocol/    │
         │      openid-connect/token           │
         │                                     │
         │ grant_type=refresh_token            │
         │ &refresh_token=<current_refresh>    │
         │ &client_id=link-wars-portal         │
         │─────────────────────────────────────▶│
         │                                     │
         │                                     │  3. Validate refresh token
         │                                     │  4. Check session still valid
         │                                     │  5. Issue new tokens
         │                                     │  6. Rotate refresh token
         │                                     │     (old one invalidated)
         │                                     │
         │  {                                  │
         │    "access_token": "<new_JWT>",     │
         │    "refresh_token": "<new_refresh>",│
         │    "expires_in": 300                │
         │  }                                  │
         │◀─────────────────────────────────────│
         │                                     │
    7. Update tokens in memory                 │
    8. Continue with original request          │
         │                                     │
```

### 5.4 Logout Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LOGOUT FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐                    ┌─────────────────┐
  │  web-portal  │                    │    Keycloak     │
  └──────┬───────┘                    └────────┬────────┘
         │                                     │
    1. User clicks                             │
       <LogoutButton/>                         │
         │                                     │
    2. Clear local state:                      │
       - isAuthenticated = false               │
       - user = null                           │
       - accessToken = null                    │
         │                                     │
    3. keycloak.logout()                       │
       Browser redirect:                       │
         │                                     │
         │ GET /realms/link-wars/protocol/     │
         │     openid-connect/logout           │
         │   ?post_logout_redirect_uri=        │
         │       http://localhost:5173         │
         │   &id_token_hint=<id_token>         │
         │─────────────────────────────────────▶│
         │                                     │
         │                                     │  4. Validate id_token_hint
         │                                     │  5. End Keycloak session
         │                                     │  6. Invalidate all tokens
         │                                     │
    7. Redirect to portal                      │
         │ GET http://localhost:5173           │
         │◀─────────────────────────────────────│
         │                                     │
    8. User is logged out                      │
       Show public lobby                       │
         │                                     │
```

---

## 6. Token Structure & Claims

### 6.1 Access Token (JWT)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "<key-id>"
  },
  "payload": {
    "exp": 1704330300,
    "iat": 1704330000,
    "jti": "<token-id>",
    "iss": "http://localhost:8080/realms/link-wars",
    "aud": "account",
    "sub": "12345678-1234-1234-1234-123456789abc",
    "typ": "Bearer",
    "azp": "link-wars-portal",
    "session_state": "<session-id>",
    "acr": "1",
    "scope": "openid profile email",
    "sid": "<session-id>",
    "email_verified": false,
    "preferred_username": "player123",
    "email": "player123@example.com",
    "realm_access": {
      "roles": ["player", "default-roles-link-wars"]
    }
  }
}
```

### 6.2 ID Token (JWT)

```json
{
  "payload": {
    "exp": 1704330300,
    "iat": 1704330000,
    "iss": "http://localhost:8080/realms/link-wars",
    "sub": "12345678-1234-1234-1234-123456789abc",
    "typ": "ID",
    "azp": "link-wars-portal",
    "session_state": "<session-id>",
    "at_hash": "<access-token-hash>",
    "sid": "<session-id>",
    "email_verified": false,
    "preferred_username": "player123",
    "given_name": "Player",
    "family_name": "One",
    "email": "player123@example.com"
  }
}
```

### 6.3 Refresh Token (Opaque)

The refresh token is opaque (not a JWT that can be decoded client-side). It's only used for token refresh requests.

---

## 7. Security Considerations

### 7.1 PKCE (Proof Key for Code Exchange)

PKCE protects against authorization code interception attacks:

1. **code_verifier**: Random string (43-128 chars) generated by client
2. **code_challenge**: SHA256 hash of verifier, base64url encoded
3. **Flow**:
   - Send `code_challenge` with authorization request
   - Send `code_verifier` with token exchange
   - Server validates: `SHA256(verifier) == challenge`

### 7.2 Token Storage

| Token | Storage Location | Justification |
|-------|-----------------|---------------|
| Access Token | Memory (JS variable) | Short-lived (5min), needed for API calls |
| Refresh Token | Memory (JS variable) | Silent refresh via iframe, no XSS exposure |
| ID Token | Memory (JS variable) | Only used for logout hint |

**Why NOT localStorage/sessionStorage:**
- Vulnerable to XSS attacks
- Any JS code can read stored tokens
- Memory storage clears on page reload (acceptable trade-off)

### 7.3 Silent SSO

The `silent-check-sso.html` page enables checking SSO status without redirect:
- Loaded in hidden iframe
- Checks if Keycloak session exists
- Returns result via postMessage
- No full-page redirect needed

### 7.4 State Parameter (CSRF Protection)

- Random UUID generated for each auth request
- Stored in sessionStorage before redirect
- Verified on callback
- Prevents cross-site request forgery

---

## 8. Error Handling

### 8.1 Error Scenarios

| Scenario | Detection | User Action |
|----------|-----------|-------------|
| Keycloak unavailable | `keycloak.init()` fails | Show error message, retry button |
| Invalid credentials | Handled by Keycloak login page | Keycloak shows error |
| Token refresh fails | `updateToken()` rejects | Force re-login |
| Session expired | `401` from API / refresh fails | Redirect to login |
| Network error | Fetch fails | Show error, retry option |

### 8.2 Error Handling in AuthProvider

```typescript
// Error states to track
const [authError, setAuthError] = useState<string | null>(null);

// In init
try {
  await keycloak.init({ /* ... */ });
} catch (error) {
  setAuthError('Authentication service unavailable');
  console.error('Keycloak init failed:', error);
}

// In token refresh
keycloak.onTokenExpired = async () => {
  try {
    await keycloak.updateToken(30);
  } catch {
    setAuthError('Session expired. Please log in again.');
    // Clear auth state, show login prompt
  }
};
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// services/web-portal/src/auth/__tests__/AuthProvider.test.tsx

import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';

// Mock keycloak-js
vi.mock('../keycloak', () => ({
  default: {
    init: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateToken: vi.fn(),
    hasRealmRole: vi.fn(),
    tokenParsed: null,
    token: null,
  },
  parseUserFromToken: vi.fn(),
}));

describe('AuthProvider', () => {
  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should call keycloak.login on login()', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    act(() => {
      result.current.login();
    });

    expect(keycloak.login).toHaveBeenCalled();
  });

  // ... more tests
});
```

### 9.2 Integration Tests

Integration tests should use a test Keycloak realm or mock server:

```typescript
// Test with real Keycloak (E2E)
describe('Auth E2E', () => {
  it('should complete registration flow', async () => {
    // 1. Navigate to app
    // 2. Click register button
    // 3. Fill Keycloak form
    // 4. Verify redirect and auth state
  });
});
```

---

## 10. Implementation Checklist

### Phase 1: Keycloak Setup
- [ ] Create `link-wars` realm in Keycloak
- [ ] Create `link-wars-portal` client with PKCE
- [ ] Configure realm roles (`player`, `vip`, `admin`)
- [ ] Set password policy
- [ ] Enable user registration
- [ ] Test registration form manually

### Phase 2: Core Auth Implementation
- [ ] Install `keycloak-js` package
- [ ] Create environment variables (`.env`, `.env.example`)
- [ ] Implement `keycloak.ts` configuration
- [ ] Implement `AuthProvider.tsx`
- [ ] Implement `useAuth.ts` hook
- [ ] Add `silent-check-sso.html`
- [ ] Write unit tests for AuthProvider

### Phase 3: UI Components
- [ ] Implement `LoginButton.tsx`
- [ ] Implement `RegisterButton.tsx`
- [ ] Implement `LogoutButton.tsx`
- [ ] Update `UserMenu.tsx` to show auth state
- [ ] Update `Header.tsx` with auth buttons
- [ ] Write component tests

### Phase 4: Route Protection
- [ ] Implement `AuthGuard.tsx`
- [ ] Implement `Callback.tsx` page
- [ ] Update `App.tsx` with protected routes
- [ ] Test redirect after login flow
- [ ] Write AuthGuard tests

### Phase 5: Integration Testing
- [ ] Test full registration flow
- [ ] Test full login flow
- [ ] Test token refresh
- [ ] Test logout flow
- [ ] Test protected route access
- [ ] Test SSO across tabs

---

## 11. Open Questions & Decisions

### Resolved
1. **Library choice**: keycloak-js (official adapter)
2. **Token storage**: Memory only (security best practice)
3. **PKCE**: Enabled (required for public clients)

### For Future Consideration
1. **Email verification**: Disabled for MVP, enable later
2. **Social login**: Not in MVP scope
3. **Custom Keycloak theme**: Default theme for MVP
4. **Remember me**: Uses Keycloak default (session cookie)

---

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OAuth 2.0 for Browser-Based Apps (RFC)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [keycloak-js GitHub](https://github.com/keycloak/keycloak/tree/main/js/libs/keycloak-js)
