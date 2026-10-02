"use client";

import React, { useState, useEffect } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';

export default function CommandCenterPage() {
  const { robot, safety, sensor, environment, events } = usePlatformStore();
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>(SimulationScenario.NORMAL_OPERATION);

  useEffect(() => {
    // Keep local state in sync with simulator just in case
    const interval = setInterval(() => {
      setCurrentScenario(telemetrySimulator.getScenario());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newScen = e.target.value as SimulationScenario;
    telemetrySimulator.setScenario(newScen);
    setCurrentScenario(newScen);
  };

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
          <div className="ui-metric"><span className="ui-metric-label">Motor Temps</span><span className="ui-metric-value">{sensor.motors.tempLeft}°C</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Battery</span><span className="ui-metric-value">{robot.batteryPercentage}%</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Vibration</span><span className="ui-metric-value">{sensor.hardware.vibrationLevel.toFixed(2)} m/s²</span></div>
        </div>
        
        <div className="ui-panel">
          <div className="ui-panel-title">SAFETY</div>
          <div className="ui-metric"><span className="ui-metric-label">Level</span><span className="ui-metric-value" style={{color: safety.level === 'NORMAL' ? '#2ea043' : '#f85149'}}>{safety.level}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Movement</span><span className="ui-metric-value" style={{color: safety.movementPermission ? '#2ea043' : '#f85149'}}>{safety.movementPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Torch</span><span className="ui-metric-value" style={{color: safety.torchPermission ? '#2ea043' : '#f85149'}}>{safety.torchPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          {safety.activeHazards.length > 0 && (
            <div style={{ marginTop: '8px', color: '#f85149', fontSize: '0.85rem' }}>
              <strong>ACTIVE HAZARDS:</strong>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                {safety.activeHazards.map(h => <li key={h.id}>{h.description}</li>)}
              </ul>
            </div>
          )}
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
          <div className="ui-metric"><span className="ui-metric-label">Combustible</span><span className="ui-metric-value" style={{color: environment.combustibleGasLel > 5 ? '#f85149' : 'inherit'}}>{environment.combustibleGasLel}% LEL</span></div>
          <div className="ui-metric"><span className="ui-metric-label">O2 Level</span><span className="ui-metric-value" style={{color: environment.o2Percentage < 19.5 ? '#f85149' : 'inherit'}}>{environment.o2Percentage}%</span></div>
          <div className="ui-metric"><span className="ui-metric-label">CO Level</span><span className="ui-metric-value" style={{color: environment.coPpm > 35 ? '#f85149' : 'inherit'}}>{environment.coPpm} ppm</span></div>
        </div>
        
        <div className="ui-panel" style={{ flex: 1.5 }}>
          <div className="ui-panel-title">SIMULATION SCENARIOS (DEMO)</div>
          <select 
            value={currentScenario} 
            onChange={handleScenarioChange}
            style={{ 
              width: '100%', padding: '8px', marginTop: '10px', 
              background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d',
              borderRadius: '4px'
            }}
          >
            {Object.values(SimulationScenario).map(scen => (
              <option key={scen} value={scen}>{scen.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#8b949e', height: '60px', overflowY: 'auto' }}>
            <strong>RECENT EVENTS:</strong>
            {events.slice(0, 3).map(ev => (
              <div key={ev.id} style={{ color: ev.severity === 'CRITICAL' ? '#f85149' : (ev.severity === 'WARNING' ? '#d29922' : 'inherit') }}>
                [{ev.category}] {ev.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
