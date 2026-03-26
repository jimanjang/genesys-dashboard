const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function findAllQueues() {
  try {
    const token = await getAccessToken();
    let pageNumber = 1;
    let hasMore = true;
    
    while (hasMore) {
      const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues?pageSize=100&pageNumber=${pageNumber}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      response.data.entities.forEach(q => {
        console.log(`${q.name} -> ${q.id}`);
      });
      
      if (pageNumber >= response.data.pageCount) {
        hasMore = false;
      } else {
        pageNumber++;
      }
    }
  } catch (err) {
    console.error('Error fetching queues:', err.message);
  }
}

findAllQueues();
