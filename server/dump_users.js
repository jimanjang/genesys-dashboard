const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function dumpAllQueueUsers() {
  try {
    const token = await getAccessToken();
    const queues = [
      '2be5498e-e4d5-4c88-898e-b9b057704726',
      '860f3e89-66b3-4913-b3e0-f594ab68bdff',
      'f64e9833-034a-4211-a8e0-43a8b363ef89'
    ];

    let userIds = new Set();
    for (const q of queues) {
      const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues/${q}/users?pageSize=100`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.entities) {
        response.data.entities.forEach(u => userIds.add(u.id));
      }
    }

    const mUrl = `${getApiUrl().replace(/\/$/, '')}/api/v2/users?id=${Array.from(userIds).join(',')}&expand=presence,routingStatus`;
    const mRes = await axios.get(mUrl, { headers: { Authorization: `Bearer ${token}` } });
    
    console.log(`Total Unique Queue Members: ${mRes.data.entities.length}`);
    mRes.data.entities.forEach(u => {
      const presence = u.presence?.presenceDefinition?.systemPresence || 'OFFLINE';
      const routing = u.routingStatus?.status || 'OFF_QUEUE';
      console.log(`- ${u.name}: Presence(${presence}), Routing(${routing})`);
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}
dumpAllQueueUsers();
