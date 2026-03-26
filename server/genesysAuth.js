/**
 * Genesys Cloud OAuth Client Credentials authentication.
 * Caches the access token and auto-refreshes 60 seconds before expiry.
 */

const axios = require('axios');

let cachedToken = null;
let tokenExpiry = 0;

function getLoginUrl() {
  const region = process.env.GENESYS_REGION || 'mypurecloud.com';
  return `https://login.${region}`;
}

function getApiUrl() {
  const region = process.env.GENESYS_REGION || 'mypurecloud.com';
  return `https://api.${region}`;
}

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60000) {
    return cachedToken;
  }

  const clientId = process.env.GENESYS_CLIENT_ID;
  const clientSecret = process.env.GENESYS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GENESYS_CLIENT_ID and GENESYS_CLIENT_SECRET must be set');
  }

  try {
    const response = await axios.post(
      `${getLoginUrl()}/oauth/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        auth: {
          username: clientId,
          password: clientSecret,
        },
      }
    );

    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;

    console.log('[Auth] Access token obtained, expires in', response.data.expires_in, 'seconds');
    return cachedToken;
  } catch (error) {
    cachedToken = null;
    tokenExpiry = 0;

    if (error.response) {
      console.error('[Auth] Token request failed:', error.response.status, error.response.data);
      throw new Error(`Authentication failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

function clearToken() {
  cachedToken = null;
  tokenExpiry = 0;
}

module.exports = {
  getAccessToken,
  getApiUrl,
  clearToken,
};
