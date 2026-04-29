'use client';
import { AgentStatus } from '@/hooks/useDashboard';

interface Props {
  agents: AgentStatus[];
  title?: string;
}

const STATUS_LABEL: Record<string, string> = {
  Available: '대기 가능',
  Idle: '유휴',
  Interacting: '통화 중',
  Communicating: '통화 중',
  Meal: '식사',
  Break: '휴식',
  Meeting: '회의',
  Training: '교육',
  Busy: '다른 작업 중',
  Away: '자리비움',
  Other: '기타',
  Offline: '오프라인',
};

export default function AgentTable({ agents, title = '계정 상태' }: Props) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.625vw 1.04vw', /* 12px 20px */
        background: 'var(--color-daangn)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.94vw', color: '#ffffff' }}>{title}</span>
        <span style={{
          fontSize: '0.73vw',
          background: '#ffffff',
          color: 'var(--color-daangn)',
          borderRadius: '1.04vw',
          padding: '0.1vw 0.52vw',
          fontWeight: 700,
        }}>
          {agents.length}명
        </span>
      </div>
      <div className="scroll-area" style={{ flex: 1 }}>
        <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ fontSize: '0.7vw', width: '45%' }}>상담원</th>
              <th style={{ fontSize: '0.7vw', width: '30%' }}>상태</th>
              <th style={{ fontSize: '0.7vw', width: '25%' }}>유지 시간</th>
            </tr>
          </thead>
          <tbody>
            {agents.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '1.25vw', fontSize: '0.83vw' }}>
                  데이터 없음
                </td>
              </tr>
            ) : agents.map((agent) => {
              const dotClass = `dot-${agent.status.toLowerCase()}`;
              const statusClass = `status-${agent.status.toLowerCase()}`;
              return (
                <tr key={agent.id} style={{ opacity: agent.status === 'Offline' ? 0.5 : 1 }}>
                  <td style={{ fontWeight: 600, fontSize: 'clamp(14px, 0.8vw, 24px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.2vw 0.15vw' }}>{agent.name}</td>
                  <td style={{ whiteSpace: 'nowrap', padding: '0.2vw 0.15vw' }}>
                    <span className="status-badge" style={{ gap: '0.2vw' }}>
                      <span className={`status-dot ${dotClass}`} style={{ width: '0.4vw', height: '0.4vw', minWidth: 6, minHeight: 6 }} />
                      <span className={statusClass} style={{ fontSize: 'clamp(12px, 0.7vw, 20px)', fontWeight: 500 }}>{STATUS_LABEL[agent.status] || agent.status}</span>
                    </span>
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)', fontSize: 'clamp(12px, 0.7vw, 20px)', fontWeight: 500, whiteSpace: 'nowrap', padding: '0.2vw 0.15vw' }}>
                    {agent.duration}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
