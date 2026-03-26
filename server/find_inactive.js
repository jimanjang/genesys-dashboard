const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function findInactiveQueues() {
  try {
    const token = await getAccessToken();
    const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues?pageSize=100&active=false`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    response.data.entities.forEach(q => {
      console.log(`[INACTIVE] ${q.name} -> ${q.id}`);
    });
  } catch (err) {
    console.error('Error fetching inactive queues:', err.message);
  }
}

findInactiveQueues();
