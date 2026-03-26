# Genesys Cloud Call Center Queue Dashboard

Real-time call center queue monitoring dashboard powered by Genesys Cloud API.

![Dark Mode Dashboard](https://img.shields.io/badge/theme-dark_mode-1a2035?style=flat-square)
![WebSocket](https://img.shields.io/badge/realtime-WebSocket-3b82f6?style=flat-square)
![Node.js](https://img.shields.io/badge/backend-Node.js-43853d?style=flat-square)
![React](https://img.shields.io/badge/frontend-React-61dafb?style=flat-square)

## Features

- **Queue Monitoring** — Waiting calls, active interactions, available agents, avg/longest wait
- **Agent Status Panel** — Real-time agent status with duration tracking
- **WebSocket** — Real-time push updates (HTTP polling fallback)
- **Alerts** — Visual alerts when queues exceed configurable thresholds
- **TV Wall Display** — Large fonts and responsive layout for wall-mounted monitors

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Genesys Cloud credentials:

| Variable | Description |
|---|---|
| `GENESYS_CLIENT_ID` | OAuth Client Credentials ID |
| `GENESYS_CLIENT_SECRET` | OAuth Client Credentials Secret |
| `GENESYS_REGION` | Genesys region (e.g., `mypurecloud.com`, `mypurecloud.de`) |
| `QUEUE_IDS` | Comma-separated queue IDs to monitor |
| `ALERT_THRESHOLD` | Number of waiting calls to trigger alert (default: 5) |
| `PORT` | Backend server port (default: 3001) |

### 2. Start Backend

```bash
cd server
npm install
npm start
```

### 3. Start Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open Dashboard

Open [http://localhost:5173](http://localhost:5173)

## Finding Queue IDs

1. Log in to Genesys Cloud Admin
2. Navigate to **Contact Center > Queues**
3. Click on a queue
4. Copy the Queue ID from the URL or the queue details panel
5. Add to `QUEUE_IDS` in `.env` separated by commas

## Architecture

```
Frontend (React + Vite)
    │
    ├── WebSocket ──► ws://localhost:3001/ws
    │                     │
    └── HTTP Poll ──► GET /api/dashboard/queues
                          │
                    Express Server
                          │
                    ┌─────┴─────┐
                    │   Cache   │ (5s TTL)
                    └─────┬─────┘
                          │
                    Genesys Cloud API
                    ├── Queue Observations
                    └── User Observations
```

## Demo Mode

If `QUEUE_IDS` is empty, the dashboard runs in **demo mode** with randomized sample data, perfect for testing the UI without Genesys credentials.
