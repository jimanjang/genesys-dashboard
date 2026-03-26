/**
 * Genesys Cloud Call Center Queue Dashboard — Server
 *
 * Express REST API + WebSocket server for real-time dashboard updates.
 * Polls Genesys Cloud every 10 seconds and pushes data to connected clients.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { fetchDashboardData } = require('./genesysApi');

const PORT = process.env.PORT || 3001;
const POLL_INTERVAL = 10000; // 10 seconds
const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD || '5', 10);

const app = express();
app.use(cors());
app.use(express.json());

// ─── HTTP Server ────────────────────────────────────────────
const server = http.createServer(app);

// ─── Latest data store ──────────────────────────────────────
let latestData = null;
let lastError = null;

// ─── REST API Endpoint ──────────────────────────────────────
app.get('/api/dashboard/queues', async (req, res) => {
  try {
    if (latestData) {
      res.json({
        ...latestData,
        alertThreshold: ALERT_THRESHOLD,
      });
    } else {
      // First request, fetch immediately
      const data = await fetchDashboardData();
      latestData = data;
      res.json({
        ...data,
        alertThreshold: ALERT_THRESHOLD,
      });
    }
  } catch (error) {
    console.error('[Server] API error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message,
    });
  }
});

// ─── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    lastUpdate: latestData?.timestamp || null,
    lastError: lastError,
    connectedClients: wss.clients.size,
  });
});

// ─── WebSocket Server ───────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log(`[WS] Client connected. Total: ${wss.clients.size}`);

  // Send latest data immediately on connect
  if (latestData) {
    ws.send(
      JSON.stringify({
        type: 'update',
        data: { ...latestData, alertThreshold: ALERT_THRESHOLD },
      })
    );
  }

  ws.on('close', () => {
    console.log(`[WS] Client disconnected. Total: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });
});

function broadcastToClients(data) {
  const message = JSON.stringify({
    type: 'update',
    data: { ...data, alertThreshold: ALERT_THRESHOLD },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      client.send(message);
    }
  });
}

// ─── Polling Loop ───────────────────────────────────────────
async function pollGenesysData() {
  try {
    const data = await fetchDashboardData();
    latestData = data;
    lastError = null;

    // Check for alerts
    const alerts = [];
    if (data.queues) {
      data.queues.forEach((q) => {
        if (q.waiting >= ALERT_THRESHOLD) {
          alerts.push({
            queueName: q.name,
            waiting: q.waiting,
            threshold: ALERT_THRESHOLD,
          });
        }
      });
    }

    // Broadcast to all WebSocket clients
    broadcastToClients({ ...data, alerts });

    if (alerts.length > 0) {
      console.warn(`[Alert] ${alerts.length} queue(s) exceeding threshold:`,
        alerts.map((a) => `${a.queueName}: ${a.waiting}`).join(', '));
    }
  } catch (error) {
    lastError = error.message;
    console.error('[Poll] Failed to fetch data:', error.message);

    // Broadcast error state to clients
    broadcastToClients({
      queues: latestData?.queues || [],
      agents: latestData?.agents || [],
      alerts: [],
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}

// ─── Start Server ───────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║   Genesys Cloud Dashboard Server                  ║
  ║   REST API:    http://localhost:${PORT}/api/dashboard/queues  ║
  ║   WebSocket:   ws://localhost:${PORT}/ws                ║
  ║   Health:      http://localhost:${PORT}/api/health      ║
  ║   Poll Rate:   ${POLL_INTERVAL / 1000}s                               ║
  ║   Threshold:   ${ALERT_THRESHOLD} waiting calls                   ║
  ╚═══════════════════════════════════════════════════╝
  `);

  // Initial fetch
  pollGenesysData();

  // Start polling loop
  setInterval(pollGenesysData, POLL_INTERVAL);
});
