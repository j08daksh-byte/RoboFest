import React from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  min?: number;
  max?: number;
  height?: number;
}

export function Sparkline({ data, color = 'var(--accent)', min, max, height = 24 }: SparklineProps) {
  if (!data || data.length === 0) return <div style={{ height, width: '100%', opacity: 0.1, background: 'var(--bg-panel)' }} />;

  const validData = data.filter(d => typeof d === 'number' && !isNaN(d));
  if (validData.length === 0) return <div style={{ height, width: '100%', opacity: 0.1, background: 'var(--bg-panel)' }} />;

  const dMin = min !== undefined ? min : Math.min(...validData);
  const dMax = max !== undefined ? max : Math.max(...validData);
  
  // Add a small padding to range to avoid dividing by zero or having a flat line right at the edge if all values are identical
  const range = (dMax - dMin) === 0 ? 1 : (dMax - dMin);
  
  // Pad the visual rendering slightly so the line isn't clipped
  const paddedMin = dMin - (range * 0.1);
  const paddedRange = range * 1.2;

  const width = 100; // viewBox scale
  const points = validData.map((val, i) => {
    const x = (i / Math.max(1, validData.length - 1)) * width;
    const y = height - ((val - paddedMin) / paddedRange) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
