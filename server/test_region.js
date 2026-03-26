const axios = require('axios');
const qs = require('querystring');
require('dotenv').config({ path: '../.env' });

const CLIENT_ID = process.env.GENESYS_CLIENT_ID;
const CLIENT_SECRET = process.env.GENESYS_CLIENT_SECRET;
const QUEUE_ID = 'e63cf277-29b1-46c5-b65e-19c2d0787997';

async function testRegion(region) {
  console.log(`\n--- Testing Region: ${region} ---`);
  try {
    // 1. Get Token
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const loginUrl = `https://login.${region}/oauth/token`;
    console.log(`Fetching token from: ${loginUrl}`);
    
    const tokenRes = await axios({
      method: 'post',
      url: loginUrl,
      data: qs.stringify({ grant_type: 'client_credentials' }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      timeout: 10000
    });
    
    const token = tokenRes.data.access_token;
    console.log(`Success: Token obtained.`);

    // 2. Test API Call
    const apiUrl = `https://api.${region}/api/v2/routing/queues/${QUEUE_ID}`;
    console.log(`Testing API call to: ${apiUrl}`);
    
    const apiRes = await axios({
      method: 'get',
      url: apiUrl,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    console.log(`Success: API returned queue name: ${apiRes.data.name}`);
    return true;
  } catch (err) {
    console.log(`Error: ${err.message}`);
    if (err.response) {
      console.log(`Status: ${err.response.status}`);
      const dataStr = typeof err.response.data === 'string' ? err.response.data.substring(0, 300) : JSON.stringify(err.response.data);
      console.log(`Data (first 300 chars): ${dataStr}...`);
    }
    return false;
  }
}

async function run() {
  const regions = ['apne2.pure.cloud', 'mypurecloud.jp', 'mypurecloud.co.kr', 'mypurecloud.com'];
  for (const r of regions) {
    if (await testRegion(r)) {
      console.log(`\n!!! FOUND CORRECT REGION: ${r} !!!`);
      break;
    }
  }
}

run();
