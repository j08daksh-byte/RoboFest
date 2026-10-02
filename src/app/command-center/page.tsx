"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/platformStore';
import { usePlannerStore } from '@/lib/cutting';
import { DigitalTwin } from '@/components/DigitalTwin';
import { MissionControls } from '@/components/MissionControls';
import { TelemetryTrend } from '@/components/TelemetryTrend';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';
import { Maximize, Target, Ship, RefreshCcw, Eye, Navigation } from 'lucide-react';

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
        
        {/* Supervisory Toolbar - NOT the manual control panel */}
        <div className="twin-controls-region" style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
          <div style={{ background: 'color-mix(in srgb, var(--bg-panel) 90%, transparent)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backdropFilter: 'blur(8px)', display: 'flex', padding: '4px' }}>
            <button className="toolbar-btn" title="Focus Robot"><Target size={16} /></button>
            <button className="toolbar-btn" title="Focus Cut"><CrosshairIcon size={16} /></button>
            <button className="toolbar-btn" title="Focus Ship"><Ship size={16} /></button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }}></div>
            <button className="toolbar-btn" title="Reset View"><RefreshCcw size={16} /></button>
            <button className="toolbar-btn" title="Follow Robot"><Navigation size={16} /></button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 4px' }}></div>
            <button className="toolbar-btn" title="X-Ray Structure"><Eye size={16} /></button>
          </div>
          
          <Link href="/robot/twin" style={{ background: 'color-mix(in srgb, var(--accent) 20%, var(--bg-panel))', border: '1px solid var(--accent)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', fontSize: '11px', fontWeight: 600, textDecoration: 'none', letterSpacing: '0.5px' }}>
            <Maximize size={14} /> MANUAL CONTROL
          </Link>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .toolbar-btn {
            background: transparent; color: var(--text-secondary); border: none; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
          }
          .toolbar-btn:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }
        `}} />
      </div>
      
      {/* Right: Operational Rail */}
      <div className="cc-side-panel ui-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <section>
          <div className="heading-technical">MISSION CONTROL</div>
          <MissionControls />
          {activeCut && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div className="metric-row"><span className="metric-label">Active Cut</span><span className="metric-value">{activeCut.id}</span></div>
              <div className="metric-row"><span className="metric-label">Validation</span><span className="metric-value" style={{color: activeCut.validation?.isValidGeometry ? 'var(--good)' : (activeCut.validation ? 'var(--critical)' : 'var(--text-muted)')}}>{activeCut.validation?.isValidGeometry ? 'VALID' : (activeCut.validation ? 'INVALID' : 'PENDING')}</span></div>
              <div className="metric-row"><span className="metric-label">Risk</span><span className="metric-value" style={{color: activeCut.validation?.overallRisk === 'BLOCKED' ? 'var(--critical)' : (activeCut.validation?.overallRisk === 'LOW' ? 'var(--good)' : 'var(--warning)')}}>{activeCut.validation?.overallRisk || 'N/A'}</span></div>
              <div className="metric-row"><span className="metric-label">Status</span><span className="metric-value" style={{color: 'var(--accent)'}}>{activeCut.approvalState}</span></div>
            </div>
          )}
        </section>

        <section>
          <div className="heading-technical">ROBOT STATUS</div>
          <div className="metric-row"><span className="metric-label">Motor Temps</span><span className="metric-value">{sensor.motors.tempLeft.toFixed(1)}°C</span></div>
          <div className="metric-row"><span className="metric-label">Power Source</span><span className="metric-value">EXTERNAL CABLE</span></div>
          <div className="metric-row"><span className="metric-label">Power Status</span><span className="metric-value" style={{color: robot.powerConnected ? 'var(--good)' : 'var(--critical)'}}>{robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
          <div className="metric-row"><span className="metric-label">Vibration</span><span className="metric-value">{sensor.hardware.vibrationLevel.toFixed(2)} m/s²</span></div>
          <div style={{ marginTop: '16px' }}>
            <TelemetryTrend />
          </div>
        </section>
        
        <section>
          <div className="heading-technical">SAFETY</div>
          <div className="metric-row"><span className="metric-label">Level</span><span className="status-badge" style={{color: safety.level === 'NORMAL' ? 'var(--good)' : 'var(--critical)'}}>{safety.level}</span></div>
          <div className="metric-row"><span className="metric-label">Movement</span><span className="status-badge" style={{color: safety.movementPermission ? 'var(--good)' : 'var(--critical)'}}>{safety.movementPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          <div className="metric-row"><span className="metric-label">Torch</span><span className="status-badge" style={{color: safety.torchPermission ? 'var(--good)' : 'var(--critical)'}}>{safety.torchPermission ? 'ALLOWED' : 'DENIED'}</span></div>
          {safety.activeHazards.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>
              <strong style={{ fontSize: '11px', color: 'var(--critical)', textTransform: 'uppercase' }}>Active Hazards:</strong>
              <ul style={{ paddingLeft: '16px', margin: '4px 0', fontSize: '12px', color: 'var(--text-main)' }}>
                {safety.activeHazards.map(h => <li key={h.id}>{h.description}</li>)}
              </ul>
            </div>
          )}
        </section>
      </div>
      
      {/* Bottom: Compact telemetry / event strip */}
      <div className="cc-bottom-panel ui-panel" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', alignItems: 'start', overflow: 'hidden' }}>
        <section>
          <div className="heading-technical">ENVIRONMENT</div>
          <div className="metric-row"><span className="metric-label">Combustible</span><span className="metric-value" style={{color: environment.combustibleGasLel > 5 ? 'var(--critical)' : 'inherit'}}>{environment.combustibleGasLel}% LEL</span></div>
          <div className="metric-row"><span className="metric-label">O2 Level</span><span className="metric-value" style={{color: environment.o2Percentage < 19.5 ? 'var(--critical)' : 'inherit'}}>{environment.o2Percentage}%</span></div>
          <div className="metric-row"><span className="metric-label">CO Level</span><span className="metric-value" style={{color: environment.coPpm > 35 ? 'var(--critical)' : 'inherit'}}>{environment.coPpm} ppm</span></div>
        </section>

        <section>
          <div className="heading-technical">EXTERNAL POWER</div>
          <div className="metric-row"><span className="metric-label">Status</span><span className="status-badge" style={{color: robot.powerConnected ? 'var(--good)' : 'var(--critical)'}}>{robot.powerConnected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
          <div className="metric-row"><span className="metric-label">Voltage</span><span className="metric-value">{robot.powerVoltage.toFixed(1)} V</span></div>
          <div className="metric-row"><span className="metric-label">Current</span><span className="metric-value">{robot.powerCurrent.toFixed(1)} A</span></div>
        </section>
        
        <section>
          <div className="heading-technical">SIMULATION SCENARIOS</div>
          <select 
            value={currentScenario} 
            onChange={handleScenarioChange}
            style={{ 
              width: '100%', padding: '6px 8px', marginTop: '8px', 
              background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none'
            }}
          >
            {Object.values(SimulationScenario).map(scen => (
              <option key={scen} value={scen}>{scen.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </section>

        <section style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="heading-technical">EVENT TIMELINE</div>
          <div style={{ flex: 1, marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', overflowY: 'auto' }}>
            {events.length === 0 ? 'No events.' : events.slice(0, 15).map(ev => (
              <div key={ev.id} style={{ 
                color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : 'var(--text-secondary)'),
                padding: '4px 0', borderBottom: '1px solid var(--border-color)'
              }}>
                <span style={{opacity: 0.5}}>{new Date(ev.timestamp).toLocaleTimeString()}</span> <strong style={{fontWeight: 600}}>[{ev.category}]</strong> {ev.message} 
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const CrosshairIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="22" y1="12" x2="18" y2="12"></line>
    <line x1="6" y1="12" x2="2" y2="12"></line>
    <line x1="12" y1="6" x2="12" y2="2"></line>
    <line x1="12" y1="22" x2="12" y2="18"></line>
  </svg>
);
