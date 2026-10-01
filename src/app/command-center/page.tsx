"use client";

import React from 'react';
import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';

export default function CommandCenterPage() {
  return (
    <div className="cc-layout">
      {/* Center: The Digital Twin */}
      <div className="cc-twin-panel">
        <div className="twin-wrapper">
          <DigitalTwin />
        </div>
      </div>
      
      {/* Right: Side Panels */}
      <div className="cc-side-panel">
        <div className="ui-panel">
          <div className="ui-panel-title">ROBOT HEALTH</div>
          <div className="ui-metric"><span className="ui-metric-label">Motor Temps</span><span className="ui-metric-value">42°C</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Battery</span><span className="ui-metric-value">84%</span></div>
        </div>
        
        <div className="ui-panel">
          <div className="ui-panel-title">SAFETY</div>
          <div className="ui-metric"><span className="ui-metric-label">Interlocks</span><span className="ui-metric-value" style={{color: '#2ea043'}}>CLEAR</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Inclinometer</span><span className="ui-metric-value">2.4°</span></div>
        </div>

        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">MANUAL OVERRIDE</div>
          <ControlPanel />
        </div>
      </div>
      
      {/* Bottom: Secondary Data */}
      <div className="cc-bottom-panel">
        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">SENSORS</div>
          <div className="ui-metric"><span className="ui-metric-label">Oxy</span><span className="ui-metric-value">124 psi</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Acetylene</span><span className="ui-metric-value">14 psi</span></div>
        </div>
        <div className="ui-panel" style={{ flex: 1 }}>
          <div className="ui-panel-title">ENVIRONMENT</div>
          <div className="ui-metric"><span className="ui-metric-label">Wind</span><span className="ui-metric-value">12 km/h</span></div>
        </div>
        <div className="ui-panel" style={{ flex: 2 }}>
          <div className="ui-panel-title">ROBO-ASSIST</div>
          <div style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '10px' }}>
            Awaiting operator input...
          </div>
        </div>
      </div>
    </div>
  );
}
