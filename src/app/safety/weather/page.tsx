"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function SafetyWeatherPage() {
  const { environment, systemMode } = usePlatformStore();

  const getWorkabilityColor = (status: string) => {
    switch (status) {
      case 'WORKABLE': return '#2ea043';
      case 'RESTRICTED': return '#d29922';
      case 'NO_GO': return '#f85149';
      default: return '#8b949e';
    }
  };

  const renderMetric = (label: string, value: string | number) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px' }}>
      <span style={{ color: '#8b949e' }}>{label}</span>
      <span style={{ color: '#c9d1d9', fontWeight: 600 }}>{value}</span>
    </div>
  );

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Weather & Site Workability</h1>
        <p>Environmental conditions and operational restrictions.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#8b949e', marginBottom: '8px' }}>SITE WORKABILITY STATUS</div>
          <h2 style={{ color: getWorkabilityColor(environment.stormWorkabilityState), fontSize: '2.5rem', margin: 0 }}>
            {environment.stormWorkabilityState.replace('_', ' ')}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {renderMetric('Temperature', `${environment.temperatureC}°C`)}
          {renderMetric('Humidity', `${environment.humidityPercentage}%`)}
          {renderMetric('Wind Speed', `${environment.windSpeedKmh} km/h`)}
          {renderMetric('Atmospheric Pressure', `${environment.atmosphericPressureHpa} hPa`)}
          {renderMetric('Precipitation', environment.rain ? 'Yes' : 'No')}
          {renderMetric('Visibility', environment.visibilityStatus)}
        </div>

        <div style={{ padding: '16px', background: 'rgba(210, 153, 34, 0.1)', border: '1px solid #d29922', borderRadius: '6px', color: '#d29922', fontSize: '0.85rem' }}>
          <strong>Important Disclaimer:</strong> This module provides deterministic decision support data for DEMO purposes based on the simulated platform state. Do not use this as a certified industrial weather safety system. No real weather API is connected.
        </div>
      </main>
    </div>
  );
}
