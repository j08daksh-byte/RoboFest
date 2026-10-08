import React from 'react';

export const LiveSensorCard = ({ label, value, unit, status = 'NORMAL', sourceMode = 'NOT CONNECTED' }: { label: string, value: any, unit: string, status?: string, sourceMode?: string }) => {
  const isConnected = value !== undefined && value !== null && sourceMode !== 'OFFLINE' && sourceMode !== 'NOT CONNECTED';
  const displayValue = isConnected ? value : '--';
  const displayUnit = isConnected ? unit : '';
  
  let statusColor = 'var(--text-secondary)';
  if (isConnected) {
    if (status === 'CRITICAL') statusColor = 'var(--critical)';
    else if (status === 'WARNING') statusColor = 'var(--warning)';
    else statusColor = 'var(--good)';
  }

  let badgeBg = 'var(--bg-panel)';
  let badgeColor = 'var(--text-muted)';
  
  if (isConnected) {
    if (sourceMode === 'SIMULATED') {
      badgeBg = 'rgba(56, 189, 248, 0.15)';
      badgeColor = 'var(--accent)';
    } else {
      badgeBg = 'rgba(34, 197, 94, 0.15)';
      badgeColor = 'var(--good)';
    }
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: 'var(--sp-12)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '2px', fontWeight: 700, background: badgeBg, color: badgeColor }}>
          {isConnected ? sourceMode : 'NOT CONNECTED'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: statusColor, fontFamily: 'var(--font-mono)' }}>{displayValue}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>{displayUnit}</span>
      </div>
    </div>
  );
};
