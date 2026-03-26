const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function checkQueueMembers() {
  try {
    const token = await getAccessToken();
    const queues = [
      '2be5498e-e4d5-4c88-898e-b9b057704726',
      '860f3e89-66b3-4913-b3e0-f594ab68bdff',
      'f64e9833-034a-4211-a8e0-43a8b363ef89'
    ];

    for (const q of queues) {
      const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues/${q}/users?pageSize=100`;
      try {
        const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`\nQueue ${q} Members (${response.data.entities?.length || 0}):`);
        if (response.data.entities) {
          response.data.entities.forEach(u => console.log(`- ${u.name} (${u.id})`));
        }
      } catch (err) {
        if (err.response) {
            console.error(`Error ${err.response.status} for Queue ${q}: ${JSON.stringify(err.response.data)}`);
        } else {
            console.error(`Error fetching queue ${q}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
checkQueueMembers();
