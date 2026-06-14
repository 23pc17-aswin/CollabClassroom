/**
 * Keycloak OIDC client configuration for react-oidc-context.
 * All values are read from Vite environment variables (VITE_ prefix).
 * @module oidc-config
 */

import { WebStorageStateStore } from 'oidc-client-ts';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'virtual-classroom';
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000';

/**
 * OIDC configuration object passed to <AuthProvider>.
 * Uses Authorization Code + PKCE flow (public client — no client secret in browser).
 */
export const oidcConfig = {
  authority: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'virtual-classroom-frontend',
  redirect_uri: `${APP_URL}/callback`,
  post_logout_redirect_uri: APP_URL,
  scope: 'openid profile email',
  response_type: 'code',
  automaticSilentRenew: true,
  loadUserInfo: true,
  // 🔥 FIXED: Use localStorage so login state persists across new tabs/links!
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};