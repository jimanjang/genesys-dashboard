/**
 * Genesys Cloud API integration.
 * Fetches queue observations and agent observations, transforms into dashboard-friendly format.
 */

const axios = require('axios');
const { getAccessToken, getApiUrl, clearToken } = require('./genesysAuth');
const cache = require('./cache');

const RATE_LIMIT_DELAY = 2000;
let isRateLimited = false;

async function apiRequest(method, path, data = null) {
  if (isRateLimited) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
    isRateLimited = false;
  }

  const token = await getAccessToken();
  const url = `${getApiUrl().replace(/\/$/, '')}${path}`;

  const commonHeaders = {
    Authorization: `Bearer ${token}`,
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  if (data) {
    commonHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    method,
    url,
    headers: commonHeaders,
    timeout: 10000,
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      const status = error.response.status;

      if (status === 429) {
        isRateLimited = true;
        const retryAfter = error.response.headers['retry-after'] || 2;
        console.warn(`[API] Rate limited. Retrying after ${retryAfter}s`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return apiRequest(method, path, data);
      }

      if (status === 401) {
        console.warn('[API] Token expired, clearing and retrying...');
        clearToken();
        return apiRequest(method, path, data);
      }

      console.error(`[API] Request failed: ${status}`);
      console.error(`[API] URL: ${url}`);
      console.error(`[API] Response Header:`, JSON.stringify(error.response.headers));
      throw new Error(`Genesys API error: ${status}`);
    }
    throw error;
  }
}

/**
 * Fetch queue names from routing API
 */
async function fetchQueueNames(queueIds) {
  const cacheKey = 'queue_names';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const names = {};
  for (const id of queueIds) {
    try {
      const data = await apiRequest('GET', `/api/v2/routing/queues/${id}`);
      names[id] = data.name;
    } catch (err) {
      console.warn(`[API] Could not fetch name for queue ${id}:`, err.message);
      names[id] = id; // Fallback to ID
    }
  }

  cache.set(cacheKey, names);
  return names;
}

/**
 * Fetch queue observation metrics.
 * Uses POST /api/v2/analytics/queues/observations/query
 */
async function fetchQueueObservations(queueIds) {
  const cacheKey = 'queue_observations';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const body = {
    filter: {
      type: 'or',
      predicates: queueIds.map((id) => ({
        type: 'dimension',
        dimension: 'queueId',
        operator: 'matches',
        value: id,
      })),
    },
    metrics: ['oWaiting', 'oInteracting', 'oOnQueueUsers'],
    detailMetrics: ['oWaiting'],
  };

  try {
    const data = await apiRequest('POST', '/api/v2/analytics/queues/observations/query', body);
    cache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[API] Queue observations query failed:', err.message);
    return { results: [] };
  }
}

/**
 * Fetch daily aggregate metrics (Answer Rate, Abandoned, Offered).
 * Uses POST /api/v2/analytics/conversations/aggregates/query
 */
async function fetchDailyAggregates(queueIds) {
  const cacheKey = 'daily_aggregates';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (queueIds.length === 0) return { results: [] };

  // Set interval from midnight local time to end of day today
  // Converting local bounds to ISO strings for API request
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const interval = `${start.toISOString()}/${end.toISOString()}`;

  const body = {
    interval: interval,
    groupBy: ["queueId"],
    filter: {
      type: "or",
      predicates: queueIds.map(id => ({
        type: "dimension",
        dimension: "queueId",
        operator: "matches",
        value: id
      }))
    },
    metrics: ["tAnswered", "tAbandon", "nOffered"]
  };

  try {
    const data = await apiRequest('POST', '/api/v2/analytics/conversations/aggregates/query', body);
    cache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[API] Daily aggregates query failed:', err.message);
    return { results: [] };
  }
}

/**
 * Fetch users and their real-time statuses.
 * Falls back to all users if queue membership is empty.
 */
async function fetchAgentObservations(queueIds) {
  const cacheKey = 'agent_status_list';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let userIds = [];
  try {
    // Try to get members from the queue first
    for (const id of queueIds) {
      const data = await apiRequest('GET', `/api/v2/routing/queues/${id}/users?pageSize=100`);
      if (data.entities) {
        data.entities.forEach(u => userIds.push(u.id));
      }
    }
  } catch (err) {
    console.warn('[API] Failed to fetch queue members:', err.message);
  }

  // If no members found, or for better visibility, fetch all active users
  // (Limiting to 100 for performance/simplicity in this environment)
  const url = userIds.length > 0 && userIds.length <= 100
    ? `/api/v2/users?id=${userIds.join(',')}&expand=presence,routingStatus`
    : `/api/v2/users?pageSize=100&expand=presence,routingStatus`;

  try {
    const data = await apiRequest('GET', url);
    cache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[API] Failed to fetch agent statuses:', err.message);
    return { entities: [] };
  }
}

/**
 * Format duration from milliseconds to HH:MM:SS
 */
function formatDuration(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Transform raw queue observations into dashboard format
 */
function transformQueueData(observationData, queueNames, dailyAggregates) {
  if (!observationData || !observationData.results) return [];

  const queueMap = new Map();

  observationData.results.forEach((result) => {
    const queueId = result.group?.queueId || 'unknown';
    
    if (!queueMap.has(queueId)) {
      queueMap.set(queueId, {
        id: queueId,
        name: queueNames[queueId] || queueId,
        waiting: 0,
        interacting: 0,
        agents: 0,
        longestWaitMs: 0,
        daily: { answered: 0, abandon: 0, offered: 0 }
      });
    }

    const q = queueMap.get(queueId);

    if (result.data) {
      result.data.forEach((d) => {
        if (d.metric === 'oWaiting') q.waiting += d.stats?.count || 0;
        if (d.metric === 'oInteracting') q.interacting += d.stats?.count || 0;
        if (d.metric === 'oOnQueueUsers') q.agents += d.stats?.count || 0;

        // Longest wait
        if (d.metric === 'oWaiting' && d.observations) {
          d.observations.forEach((obs) => {
            const waitTime = Date.now() - new Date(obs.observationDate).getTime();
            if (waitTime > q.longestWaitMs) q.longestWaitMs = waitTime;
          });
        }
      });
    }
  });

  // Merge daily aggregates
  if (dailyAggregates && dailyAggregates.results) {
    dailyAggregates.results.forEach(result => {
      const queueId = result.group?.queueId;
      if (!queueId) return;

      let q = queueMap.get(queueId);
      if (!q) {
        q = {
          id: queueId,
          name: queueNames[queueId] || queueId,
          waiting: 0,
          interacting: 0,
          agents: 0,
          longestWaitMs: 0,
          daily: { answered: 0, abandon: 0, offered: 0 }
        };
        queueMap.set(queueId, q);
      }

      if (result.data) {
        result.data.forEach(d => {
          if (d.metrics) {
            d.metrics.forEach(m => {
              if (m.metric === 'tAnswered') q.daily.answered += m.stats?.count || 0;
              if (m.metric === 'tAbandon') q.daily.abandon += m.stats?.count || 0;
              if (m.metric === 'nOffered') q.daily.offered += m.stats?.count || 0;
            });
          }
        });
      }
    });
  }

  return Array.from(queueMap.values()).map(q => ({
    ...q,
    avgWait: 0,
    longestWait: formatDuration(q.longestWaitMs),
  }));
}

/**
 * Transform raw agent observations into dashboard format
 */
function transformAgentData(userData) {
  if (!userData || !userData.entities) return [];

  return userData.entities
    .map((u) => {
      const presence = u.presence?.presenceDefinition?.systemPresence || 'OFFLINE';
      const routing = u.routingStatus?.status || 'OFF_QUEUE';

      let status = 'Offline';
      let durationDateStr = u.presence?.modifiedDate;

      if (routing === 'INTERACTING') {
          status = 'Interacting';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
      } else if (routing === 'COMMUNICATING') {
          status = 'Communicating';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
      } else if (routing === 'IDLE' && presence === 'On Queue') {
          status = 'Idle';
          durationDateStr = u.routingStatus?.startTime || durationDateStr;
      } else if (presence === 'Available' || presence === 'On Queue') {
          status = 'Available';
      } else if (presence !== 'Offline') {
          status = 'Other';
      }

      // Calculate duration since the status last changed
      let durationStr = '0초';
      if (durationDateStr) {
        const diffMs = Date.now() - new Date(durationDateStr).getTime();
        durationStr = formatDuration(diffMs);
      }

      return {
        id: u.id,
        name: u.name,
        status: status,
        duration: durationStr,
        interaction: routing === 'INTERACTING' ? '상호 작용 중' : null,
      };
    })
    .filter(a => {
        // Only show active agents OR specifically requested agents (Offline or not)
        const requestedAgents = ['Binny Byeon', 'Charlotte Oh', 'Flora Kim', 'Kelly cha', 'Mason Park', 'Winnie Go', 'Ray Seong'];
        return a.status !== 'Offline' || requestedAgents.includes(a.name);
    })
    .sort((a, b) => {
      // First sort by status (Available first, then Idle, Interacting, Other, Offline)
      const statusOrder = { Available: 0, Idle: 1, Interacting: 2, Communicating: 3, Other: 4, Offline: 5 };
      const statusDiff = (statusOrder[a.status] || 6) - (statusOrder[b.status] || 6);
      if (statusDiff !== 0) return statusDiff;
      
      // Then sort alphabetically by name (like the screenshot)
      return a.name.localeCompare(b.name);
    });
}

/**
 * Fetch all dashboard data (combines queue + agent data)
 */
async function fetchDashboardData() {
  const queueIdsStr = process.env.QUEUE_IDS || '';
  const queueIds = queueIdsStr
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  if (queueIds.length === 0) {
    console.warn('[API] No QUEUE_IDS configured. Returning demo data.');
    return getDemoData();
  }

  try {
    const [queueNames, queueObs, agentData, dailyAggregates] = await Promise.all([
      fetchQueueNames(queueIds),
      fetchQueueObservations(queueIds),
      fetchAgentObservations(queueIds),
      fetchDailyAggregates(queueIds),
    ]);

    return {
      queues: transformQueueData(queueObs, queueNames, dailyAggregates),
      agents: transformAgentData(agentData),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[API] Failed to fetch dashboard data:', error.message);
    throw error;
  }
}

/**
 * Demo data for when no queue IDs are configured
 */
function getDemoData() {
  const names = [
    { name: 'Binny Byeon', statusWeight: 0.1 },
    { name: 'Charlotte Oh', statusWeight: 0.1 },
    { name: 'Flora Kim', statusWeight: 0.1 },
    { name: 'Kelly cha', statusWeight: 0.1 },
    { name: 'Mason Park', statusWeight: 0.1 },
    { name: 'Winnie Go', statusWeight: 0.1 },
  ];

  const pickStatus = (weight) => {
    const r = Math.random();
    if (r < weight) return 'Available';
    if (r < weight + 0.25) return 'Busy';
    return 'Offline';
  };

  return {
    queues: [
      {
        id: 'demo-1',
        name: '광고 호전환',
        waiting: 2,
        interacting: 5,
        agents: 5,
        avgWait: Math.floor(Math.random() * 120) + 10,
        longestWait: formatDuration(Math.floor(Math.random() * 300000) + 30000),
        daily: { answered: 145, abandon: 21, offered: 167 }
      },
      {
        id: 'demo-2',
        name: '당근 비즈니스센터_광고 노출/성과',
        waiting: 0,
        interacting: 3,
        agents: 3,
        avgWait: Math.floor(Math.random() * 180) + 20,
        longestWait: formatDuration(Math.floor(Math.random() * 400000) + 20000),
        daily: { answered: 89, abandon: 4, offered: 95 }
      },
      {
        id: 'demo-3',
        name: '당근 비즈니스센터_신규 광고 신청',
        waiting: 0,
        interacting: 2,
        agents: 4,
        avgWait: Math.floor(Math.random() * 90) + 15,
        longestWait: formatDuration(Math.floor(Math.random() * 250000) + 10000),
        daily: { answered: 210, abandon: 15, offered: 228 }
      },
    ],
    agents: [
      {
        id: 'demo-agent-0',
        name: 'Binny Byeon',
        status: 'Offline',
        duration: formatDuration(172800000), // 2일
        interaction: null,
      },
      {
        id: 'demo-agent-1',
        name: 'Charlotte Oh',
        status: 'Offline',
        duration: formatDuration(172800000), // 2일
        interaction: null,
      },
      {
        id: 'demo-agent-2',
        name: 'Flora Kim',
        status: 'Offline',
        duration: formatDuration(259200000), // 3일
        interaction: null,
      },
      {
        id: 'demo-agent-3',
        name: 'Kelly cha',
        status: 'Offline',
        duration: formatDuration(172800000), // 2일
        interaction: null,
      },
      {
        id: 'demo-agent-4',
        name: 'Mason Park',
        status: 'Offline',
        duration: formatDuration(172800000), // 2일
        interaction: null,
      },
      {
        id: 'demo-agent-5',
        name: 'Winnie Go',
        status: 'Offline',
        duration: formatDuration(172800000), // 2일
        interaction: null,
      },
    ],
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  fetchDashboardData,
  fetchAgentObservations,
  apiRequest,
};
