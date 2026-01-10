import Keycloak from 'keycloak-js';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'link-wars';
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'link-wars-portal';

const keycloak = new Keycloak({
  url: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
});

export default keycloak;

export interface KeycloakUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export function parseUserFromToken(kc: Keycloak): KeycloakUser | null {
  if (!kc.tokenParsed) return null;

  const token = kc.tokenParsed as {
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
