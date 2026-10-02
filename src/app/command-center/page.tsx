"use client";

import React, { useState, useEffect } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { usePlannerStore } from '@/lib/cutting';
import { DigitalTwin } from '@/components/DigitalTwin';
import { ControlPanel } from '@/components/ControlPanel';
import { MissionControls } from '@/components/MissionControls';
import { TelemetryTrend } from '@/components/TelemetryTrend';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';

export default function CommandCenterPage() {
  const { robot, safety, sensor, environment, events } = usePlatformStore();
  const { plannedCuts, currentCutId } = usePlannerStore();
  const activeCut = plannedCuts.find(c => c.id === currentCutId);
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>(SimulationScenario.NORMAL_OPERATION);

  useEffect(() => {
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
      <div className="cc-twin-panel command-center-twin-host" style={{ position: 'relative', minWidth: 0, minHeight: 0, height: '100%', overflow: 'hidden' }}>
        <div className="twin-viewport-region" style={{ position: 'absolute', inset: 0 }}>
          <div className="twin-wrapper">
            <DigitalTwin />
          </div>
        </div>
        <div className="twin-controls-region" style={{ position: 'absolute', top: '16px', left: '16px', bottom: '16px', width: '280px', overflowY: 'auto', overflowX: 'hidden', background: 'color-mix(in srgb, var(--bg-panel) 80%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
          <ControlPanel mode="compact" />
        </div>
      </div>
      
      {/* Right: Operational Rail */}
      <div className="cc-side-panel ui-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section>
          <div className="heading-technical">MISSION CONTROL</div>
          <MissionControls />
          {activeCut && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
              <div className="ui-metric"><span className="ui-metric-label">Active Cut</span><span className="ui-metric-value">{activeCut.id}</span></div>
              <div className="ui-metric"><span className="ui-metric-label">Validation</span><span className="ui-metric-value" style={{color: activeCut.validation?.isValidGeometry ? 'var(--good)' : (activeCut.validation ? 'var(--critical)' : 'var(--text-muted)')}}>{activeCut.validation?.isValidGeometry ? 'VALID' : (activeCut.validation ? 'INVALID' : 'PENDING')}</span></div>
              <div className="ui-metric"><span className="ui-metric-label">Risk</span><span className="ui-metric-value" style={{color: activeCut.validation?.overallRisk === 'BLOCKED' ? 'var(--critical)' : (activeCut.validation?.overallRisk === 'LOW' ? 'var(--good)' : 'var(--warning)')}}>{activeCut.validation?.overallRisk || 'N/A'}</span></div>
              <div className="ui-metric"><span className="ui-metric-label">Status</span><span className="ui-metric-value" style={{color: 'var(--accent)'}}>{activeCut.approvalState}</span></div>
            </div>
          )}
        </section>

        <section>
          <div className="heading-technical">ROBOT STATUS</div>
          <div className="ui-metric"><span className="ui-metric-label">Motor Temps</span><span className="ui-metric-value">{sensor.motors.tempLeft}°C</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Power Source</span><span className="ui-metric-value">EXTERNAL CABLE</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Power Status</span><span className="ui-metric-value" style={{color: robot.powerConnected ? 'var(--good)' : 'var(--critical)'}}>{robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Vibration</span><span className="ui-metric-value">{sensor.hardware.vibrationLevel.toFixed(2)} m/s²</span></div>
          <TelemetryTrend />
        </section>
        
        <section>
          <div className="heading-technical">SAFETY</div>
          <div className="ui-metric"><span className="ui-metric-label">Level</span><span className="ui-metric-value" style={{color: safety.level === 'NORMAL' ? 'var(--good)' : 'var(--critical)'}}>{safety.level}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Movement</span><span className="ui-metric-value" style={{color: safety.movementPermission ? 'var(--good)' : 'var(--critical)'}}>{safety.movementPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Torch</span><span className="ui-metric-value" style={{color: safety.torchPermission ? 'var(--good)' : 'var(--critical)'}}>{safety.torchPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          {safety.activeHazards.length > 0 && (
            <div style={{ marginTop: '8px', color: 'var(--critical)', fontSize: '0.85rem' }}>
              <strong>ACTIVE HAZARDS:</strong>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                {safety.activeHazards.map(h => <li key={h.id}>{h.description}</li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
      
      {/* Bottom: Compact telemetry / event strip */}
      <div className="cc-bottom-panel ui-panel" style={{ padding: '12px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'start' }}>
        <section>
          <div className="heading-technical">ENVIRONMENT</div>
          <div className="ui-metric"><span className="ui-metric-label">Combustible</span><span className="ui-metric-value" style={{color: environment.combustibleGasLel > 5 ? 'var(--critical)' : 'inherit'}}>{environment.combustibleGasLel}% LEL</span></div>
          <div className="ui-metric"><span className="ui-metric-label">O2 Level</span><span className="ui-metric-value" style={{color: environment.o2Percentage < 19.5 ? 'var(--critical)' : 'inherit'}}>{environment.o2Percentage}%</span></div>
          <div className="ui-metric"><span className="ui-metric-label">CO Level</span><span className="ui-metric-value" style={{color: environment.coPpm > 35 ? 'var(--critical)' : 'inherit'}}>{environment.coPpm} ppm</span></div>
        </section>

        <section>
          <div className="heading-technical">EXTERNAL POWER</div>
          <div className="ui-metric"><span className="ui-metric-label">Status</span><span className="ui-metric-value" style={{color: robot.powerConnected ? 'var(--good)' : 'var(--critical)'}}>{robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Voltage</span><span className="ui-metric-value">{robot.powerVoltage.toFixed(1)} V</span></div>
          <div className="ui-metric"><span className="ui-metric-label">Current</span><span className="ui-metric-value">{robot.powerCurrent.toFixed(1)} A</span></div>
        </section>
        
        <section>
          <div className="heading-technical">SIMULATION SCENARIOS</div>
          <select 
            value={currentScenario} 
            onChange={handleScenarioChange}
            style={{ 
              width: '100%', padding: '8px', marginTop: '10px', 
              background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {Object.values(SimulationScenario).map(scen => (
              <option key={scen} value={scen}>{scen.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </section>

        <section>
          <div className="heading-technical">EVENT TIMELINE</div>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', height: '100px', overflowY: 'auto' }}>
            {events.length === 0 ? 'No events.' : events.slice(0, 15).map(ev => (
              <div key={ev.id} style={{ 
                color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : 'inherit'),
                padding: '2px 0', borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{opacity: 0.7}}>{new Date(ev.timestamp).toLocaleTimeString()}</span> [{ev.category}] {ev.message} 
                {ev.missionId ? <span style={{color: 'var(--accent)', marginLeft: '4px'}}>({ev.missionId})</span> : ''}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
