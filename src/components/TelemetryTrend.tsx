import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export function TelemetryTrend() {
  const { telemetryHistory } = usePlatformStore();
  
  if (telemetryHistory.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Awaiting telemetry...</div>;
  }

  // Draw simple SVG line chart for Motor Temp & Tilt Trend
  const width = 200;
  const height = 40;
  
  const history = [...telemetryHistory].reverse().slice(-50); // Get oldest to newest, up to 50
  
  const tempPoints = history.map((h, i) => {
    const x = (i / 49) * width;
    const y = height - (Math.min(100, Math.max(20, h.motors.tempLeft)) - 20) / 80 * height;
    return `${x},${y}`;
  }).join(' ');

  const tiltPoints = history.map((h, i) => {
    const x = (i / 49) * width;
    const y = height - (Math.min(90, Math.max(0, Math.abs(h.imu.tiltAngle)))) / 90 * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ marginTop: '10px', width: '100%' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Motor Temp Trend</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
        <polyline points={tempPoints} fill="none" stroke="var(--critical)" strokeWidth="2" />
      </svg>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', marginTop: '8px' }}>Tilt Trend</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
        <polyline points={tiltPoints} fill="none" stroke="var(--warning)" strokeWidth="2" />
      </svg>
    </div>
  );
}
