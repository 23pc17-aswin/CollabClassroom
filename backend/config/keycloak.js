/**
 * Keycloak JWKS client configuration.
 * Used by auth middleware to verify Bearer tokens against Keycloak's public keys.
 * @module config/keycloak
 */

import jwksRsa from 'jwks-rsa';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'virtual-classroom';

/**
 * JWKS client that fetches and caches Keycloak's public signing keys.
 * @type {import('jwks-rsa').JwksClient}
 */
const jwksClient = jwksRsa({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 10,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  rateLimit: true,
});

/**
 * Retrieves the signing key for a given key ID (kid) from Keycloak JWKS endpoint.
 * @param {string} kid - The key ID from the JWT header.
 * @returns {Promise<string>} The public key in PEM format.
 */
export async function getSigningKey(kid) {
  const key = await jwksClient.getSigningKey(kid);
  return key.getPublicKey();
}

export default jwksClient;
