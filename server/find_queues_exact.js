const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function findQueues() {
  try {
    const token = await getAccessToken();
    const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues?pageSize=100`;
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    response.data.entities.forEach(q => {
      if (q.name.includes('광고 호전환') || q.name.includes('당근 비즈니스센터')) {
        console.log(`${q.name} -> ${q.id}`);
      }
    });
  } catch (err) {
    console.error('Error fetching queues:', err.message);
  }
}

findQueues();
