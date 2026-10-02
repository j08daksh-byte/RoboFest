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

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">WEATHER & SITE</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Environmental conditions and operational restrictions.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <h2 style={{ color: getWorkabilityColor(environment.stormWorkabilityState), fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '1px' }}>
            {environment.stormWorkabilityState.replace('_', ' ')}
          </h2>
          <div className="heading-technical" style={{ justifyContent: 'center', marginBottom: 0 }}>SITE WORKABILITY STATUS</div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical" style={{ marginBottom: 0 }}>ENVIRONMENTAL METRICS</h2>
          </div>
          <div className="ui-panel-body grid-3-col">
            <div className="metric-group">
              <div className="metric-label">Temperature</div>
              <div className="metric-value">{environment.temperatureC}°C</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Humidity</div>
              <div className="metric-value">{environment.humidityPercentage}%</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Wind Speed</div>
              <div className="metric-value">{environment.windSpeedKmh} km/h</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Atmospheric Pressure</div>
              <div className="metric-value">{environment.atmosphericPressureHpa} hPa</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Precipitation</div>
              <div className="metric-value">{environment.rain ? 'Yes' : 'No'}</div>
            </div>
            <div className="metric-group">
              <div className="metric-label">Visibility</div>
              <div className="metric-value">{environment.visibilityStatus}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'color-mix(in srgb, var(--warning) 10%, transparent)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-md)', color: 'var(--warning)', fontSize: '0.85rem' }}>
          <strong>IMPORTANT DISCLAIMER:</strong> This module provides deterministic decision support data for DEMO purposes based on the simulated platform state. Do not use this as a certified industrial weather safety system. No real weather API is connected.
        </div>
      </main>
    </div>
  );
}
