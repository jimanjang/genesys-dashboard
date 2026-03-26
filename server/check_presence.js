const { getAccessToken, getApiUrl } = require('./genesysAuth');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function checkUserStatus() {
  try {
    const token = await getAccessToken();
    // Test a specific user ID for presence and routing status
    const userId = "4326a927-887f-4c6b-843f-a94ff24b5358"; // Charlotte Oh
    const url = `${getApiUrl().replace(/\/$/, '')}/api/v2/users/${userId}?expand=presence,routingStatus`;
    
    try {
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const u = response.data;
      console.log(`\nUser: ${u.name}`);
      console.log(`Presence: ${JSON.stringify(u.presence, null, 2)}`);
      console.log(`Routing Status: ${JSON.stringify(u.routingStatus, null, 2)}`);
    } catch (err) {
      if (err.response) {
          console.error(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      } else {
          console.error(`Error fetching user:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
checkUserStatus();
