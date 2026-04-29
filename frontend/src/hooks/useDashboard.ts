'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface DashboardData {
  queues: QueueMetric[];
  agents: AgentStatus[];
  timestamp: string;
}

export interface QueueMetric {
  id: string;
  name: string;
  waiting: number;
  interacting: number;
  agents: number;
  longestWait: string;
  daily: { offered: number; answered: number; abandon: number; waiting: number };
  answerRate?: number;
  avgHandleTime?: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  status: 'Available' | 'Idle' | 'Interacting' | 'Communicating' | 'Other' | 'Offline';
  duration: string;
  team?: string;
}

export interface BannerMessage {
  type: 'excellent_comment' | 'five_star' | 'cheer';
  text: string;
  agentName?: string;
  priority: 1 | 2 | 3;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useDashboard(teamId: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('subscribe_team', teamId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('dashboard_update', (payload: { teamId: string; data: DashboardData }) => {
      if (payload.teamId === teamId) {
        setData(payload.data);
      }
    });

    // Also load initial snapshot via REST
    fetch(`${BACKEND_URL}/api/genesys/teams/${teamId}/dashboard`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});

    return () => { socket.disconnect(); };
  }, [teamId]);

  return { data, connected };
}

export function useBanner() {
  const [banner, setBanner] = useState<BannerMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('banner_update', (msg: BannerMessage) => setBanner(msg));

    fetch(`${BACKEND_URL}/api/banner/current`)
      .then((r) => r.json())
      .then((d) => setBanner(d))
      .catch(() => {});

    return () => { socket.disconnect(); };
  }, []);

  return { banner };
}
