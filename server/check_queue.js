const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function checkQueue() {
  try {
    const token = await getAccessToken();
    const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/routing/queues/2be5498e-e4d5-4c88-898e-b9b057704726`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    console.log('User provided Queue:', response.data.name, '->', response.data.id);
  } catch (err) {
    if (err.response) {
      console.error(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
    } else {
      console.error('Error fetching specific queue:', err.message);
    }
  }
}
checkQueue();
