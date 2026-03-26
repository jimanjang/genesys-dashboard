const api = require('./genesysApi');
require('dotenv').config({ path: '../.env' });

async function debug() {
  const queueIds = (process.env.QUEUE_IDS || '').split(',').map(id => id.trim()).filter(Boolean);
  console.log('Queue IDs:', queueIds);

  try {
    console.log('\n--- Fetching Queue Members ---');
    const members = await api.fetchQueueMembers(queueIds);
    console.log('Members found:', members.length);
    console.log('Member IDs:', JSON.stringify(members, null, 2));

    if (members.length > 0) {
      console.log('\n--- Fetching Agent Observations ---');
      const obs = await api.fetchAgentObservations(members);
      console.log('Observation Results count:', obs.results?.length || 0);
      console.log('Raw Observations:', JSON.stringify(obs, null, 2));
    } else {
      console.log('\n!!! NO MEMBERS FOUND IN QUEUE !!!');
    }
  } catch (err) {
    console.error('Debug failed:', err);
  }
}

// In genesysApi.js, we need to export these functions for testing
// Let me check if they are exported... 
// Ah, only fetchDashboardData is exported. I'll need to update the exports first or just test fetchDashboardData.
// Actually, I'll update genesysApi.js to export them for easier debugging.

debug();
