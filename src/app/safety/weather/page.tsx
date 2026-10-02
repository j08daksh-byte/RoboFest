"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export default function SafetyWeatherPage() {
  const { environment, systemMode } = usePlatformStore();

  const getWorkabilityColorClass = (status: string) => {
    switch (status) {
      case 'WORKABLE': return 'good';
      case 'RESTRICTED': return 'warning';
      case 'NO_GO': return 'critical';
      default: return 'neutral';
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">WEATHER & SITE</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Environmental conditions and operational restrictions.</p>
      </header>
      
      <main className="grid-2-col-asym">
        
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">SITE WORKABILITY STATUS</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'var(--sp-24)' }}>
            <div className={`status-badge ${getWorkabilityColorClass(environment.stormWorkabilityState)}`} style={{ fontSize: '24px', padding: 'var(--sp-12) var(--sp-24)', letterSpacing: '2px' }}>
              {environment.stormWorkabilityState.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">ENVIRONMENTAL METRICS</h2>
          </div>
          <div className="ui-panel-body grid-2-col" style={{ gap: '0 var(--sp-24)' }}>
            <div className="metric-row">
              <span className="metric-label">Temperature</span>
              <span className="metric-value">{environment.temperatureC.toFixed(1)}°C</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Humidity</span>
              <span className="metric-value">{environment.humidityPercentage.toFixed(1)}%</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Wind Speed</span>
              <span className="metric-value">{environment.windSpeedKmh} km/h</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Atmospheric Pressure</span>
              <span className="metric-value">{environment.atmosphericPressureHpa} hPa</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Precipitation</span>
              <span className="metric-value">{environment.rain ? 'YES' : 'NO'}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Visibility</span>
              <span className="metric-value">{environment.visibilityStatus}</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', padding: 'var(--sp-12)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '12px' }}>
          <strong style={{ color: 'var(--warning)' }}>IMPORTANT DISCLAIMER:</strong> This module provides deterministic decision support data for DEMO purposes based on the simulated platform state. Do not use this as a certified industrial weather safety system. No real weather API is connected.
        </div>
      </main>
    </div>
  );
}
