require('dotenv').config();
const axios = require('axios');

async function main() {
  const tokenUrl = `https://login.apne2.pure.cloud/oauth/token`;
  const clientId = process.env.GENESYS_CLIENT_ID;
  const clientSecret = process.env.GENESYS_CLIENT_SECRET;
  
  const authRes = await axios.post(tokenUrl, 'grant_type=client_credentials', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(clientId + ':' + clientSecret).toString('base64')}`,
    },
  });
  const token = authRes.data.access_token;
  
  const apiClient = axios.create({
    baseURL: 'https://api.apne2.pure.cloud',
    headers: { Authorization: `Bearer ${token}`, 'Accept-Language': 'ko' }
  });

  console.log('=== Fetching Presence Definitions ===');
  const res = await apiClient.get('/api/v2/presencedefinitions');
  for (const d of res.data.entities) {
     console.log(`ID: ${d.id} | System: ${d.systemPresence} | Name: ${d.name} | KO:`, d.languageLabels?.ko);
  }
}
main().catch(console.error);
