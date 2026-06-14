/**
 * Keycloak Admin REST API client.
 * @module utils/keycloakAdmin
 */

import axios from 'axios';
import logger from './logger.js';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const REALM = process.env.KEYCLOAK_REALM || 'virtual-classroom';
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'virtual-classroom-backend';
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || '';

async function getAdminToken() {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const resp = await axios.post(
    `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return resp.data.access_token;
}

export async function createKeycloakUser({ email, firstName, lastName, temporaryPassword }) {
  const token = await getAdminToken();

  const response = await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
    {
      username: email,
      email,
      firstName,
      lastName,
      enabled: true,
      emailVerified: true,
      credentials: [{ type: 'password', value: temporaryPassword, temporary: true }],
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  let keycloakUserId = response.headers.location?.split('/').pop();

  // Fallback if the Location header is empty or missing
  if (!keycloakUserId) {
      const getResp = await axios.get(`${KEYCLOAK_URL}/admin/realms/${REALM}/users?email=${email}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      keycloakUserId = getResp.data[0]?.id;
  }

  logger.info('Keycloak user created', { email, keycloakUserId });
  
  // FIXED: Return as an object so it can be destructured by the controller
  return { keycloakUserId };
}

export async function assignKeycloakRole(keycloakUserId, role) {
  const token = await getAdminToken();

  const roleResp = await axios.get(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${role}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  await axios.post(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakUserId}/role-mappings/realm`,
    [roleResp.data],
    { headers: { Authorization: `Bearer ${token}` } }
  );

  logger.info('Keycloak role assigned', { keycloakUserId, role });
}

export async function deleteKeycloakUser(keycloakUserId) {
  const token = await getAdminToken();

  await axios.delete(
    `${KEYCLOAK_URL}/admin/realms/${REALM}/users/${keycloakUserId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  logger.info('Keycloak user deleted', { keycloakUserId });
}