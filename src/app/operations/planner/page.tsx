"use client";

import React, { useState } from 'react';
import { usePlannerStore, DEMO_CUTS } from '@/lib/cutting';
import { usePlatformStore } from '@/lib/platformStore';

export default function OperationsPlannerPage() {
  const { systemMode } = usePlatformStore();
  const { plannedCuts, createCut, validateCut, approveCut, currentCutId, setCurrentCut } = usePlannerStore();
  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);

  const activeCut = plannedCuts.find(c => c.id === currentCutId);

  const handleLoadDemo = () => {
    const demo = DEMO_CUTS[selectedDemoIndex];
    const id = createCut(demo.geometry, demo.material);
    setCurrentCut(id);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">CUTTING PLANNER</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic cut geometry validation and execution planning.</p>
      </header>
      
      <main className="grid-2-col-asym">
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h3 className="heading-technical">LOAD DEMO CUT</h3>
            </div>
            <div className="ui-panel-body">
              <select 
                value={selectedDemoIndex} 
                onChange={e => setSelectedDemoIndex(Number(e.target.value))}
                style={{ width: '100%', padding: 'var(--sp-8)', marginBottom: 'var(--sp-12)', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', outline: 'none' }}
              >
                {DEMO_CUTS.map((c, i) => (
                  <option key={c.id} value={i}>{c.name}</option>
                ))}
              </select>
              <button 
                onClick={handleLoadDemo}
                style={{ width: '100%', padding: 'var(--sp-8)', background: 'var(--accent)', color: 'var(--bg-dark)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
              >
                LOAD INTO PLANNER
              </button>
            </div>
          </div>

          <div className="ui-panel" style={{ flex: 1 }}>
            <div className="ui-panel-header">
              <h3 className="heading-technical">PLANNED CUTS</h3>
            </div>
            <div className="ui-panel-body" style={{ padding: 0 }}>
              {plannedCuts.length === 0 ? (
                <div className="empty-state" style={{ margin: 'var(--sp-16)' }}>
                  <div className="empty-state-title">NO CUTS PLANNED</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {plannedCuts.map(cut => (
                    <div 
                      key={cut.id} 
                      onClick={() => setCurrentCut(cut.id)}
                      style={{ 
                        padding: 'var(--sp-12) var(--sp-16)', 
                        background: cut.id === currentCutId ? 'rgba(56, 189, 248, 0.1)' : 'transparent', 
                        borderBottom: '1px solid var(--border-color)', 
                        borderLeft: cut.id === currentCutId ? '3px solid var(--accent)' : '3px solid transparent',
                        cursor: 'pointer' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-4)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>{cut.id}</span>
                        <span className={`status-badge ${cut.approvalState === 'APPROVED' ? 'good' : (cut.approvalState === 'BLOCKED' ? 'critical' : 'warning')}`}>
                          {cut.approvalState}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{cut.geometry.type}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content */}
        {activeCut ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
            <div className="ui-panel">
              <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="heading-technical">CUT DETAILS: {activeCut.id}</h2>
                <div className={`status-badge ${activeCut.approvalState === 'APPROVED' ? 'good' : (activeCut.approvalState === 'BLOCKED' ? 'critical' : 'warning')}`}>
                  {activeCut.approvalState}
                </div>
              </div>

              <div className="ui-panel-body">
                <div className="grid-2-col" style={{ marginBottom: 'var(--sp-24)' }}>
                  <div className="metric-group">
                    <span className="metric-label">Geometry Type</span>
                    <span className="metric-value">{activeCut.geometry.type}</span>
                    <pre style={{ margin: 'var(--sp-8) 0 0 0', color: 'var(--text-secondary)', background: 'var(--bg-dark)', padding: 'var(--sp-8)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '11px' }}>
                      {JSON.stringify(activeCut.geometry, null, 2)}
                    </pre>
                  </div>

                  <div className="metric-group">
                    <span className="metric-label">Material & Estimates</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: 'var(--sp-8)' }}>
                      <div className="metric-row"><span className="metric-label">Material</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.material.name} ({activeCut.material.thicknessMm}mm)</span></div>
                      <div className="metric-row"><span className="metric-label">Length</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.estimate?.cutLengthMeters.toFixed(2)} m</span></div>
                      <div className="metric-row"><span className="metric-label">Duration</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.estimate?.estimatedDurationSeconds.toFixed(0)} s</span></div>
                      <div className="metric-row"><span className="metric-label">Gas Est</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.estimate?.gasRequirementLiters.toFixed(1)} L</span></div>
                      <div className="metric-row"><span className="metric-label">Energy</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.estimate?.energyRequirementKj.toFixed(0)} kJ</span></div>
                      <div className="metric-row"><span className="metric-label">Panel Mass</span><span className="metric-value" style={{ fontSize: '13px' }}>{activeCut.estimate?.panelMassKg ? `${activeCut.estimate.panelMassKg.toFixed(1)} kg` : 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="ui-panel" style={{ background: 'var(--bg-dark)' }}>
                  <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="heading-technical">VALIDATION RESULTS</h4>
                    <button 
                      onClick={() => validateCut(activeCut.id)}
                      style={{ padding: '4px 12px', background: 'var(--accent)', color: 'var(--bg-dark)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      Run Validation
                    </button>
                  </div>
                  
                  <div className="ui-panel-body">
                    {!activeCut.validation ? (
                      <div className="empty-state" style={{ minHeight: '100px' }}>
                        <div className="empty-state-title">VALIDATION NOT RUN</div>
                      </div>
                    ) : (
                      <div className="grid-2-col">
                        <div className="metric-row"><span className="metric-label">Geometry</span><span className={`status-badge ${activeCut.validation.isValidGeometry ? 'good' : 'critical'}`}>{activeCut.validation.isValidGeometry ? 'VALID' : 'INVALID'}</span></div>
                        <div className="metric-row"><span className="metric-label">Reach</span><span className={`status-badge ${activeCut.validation.reachStatus === 'REACHABLE' ? 'good' : 'critical'}`}>{activeCut.validation.reachStatus}</span></div>
                        <div className="metric-row"><span className="metric-label">Structure</span><span className={`status-badge ${activeCut.validation.structuralStatus === 'CLEAR' ? 'good' : 'critical'}`}>{activeCut.validation.structuralStatus}</span></div>
                        <div className="metric-row"><span className="metric-label">Support</span><span className={`status-badge ${activeCut.validation.supportStatus === 'CLEAR' ? 'good' : 'critical'}`}>{activeCut.validation.supportStatus}</span></div>
                        <div className="metric-row"><span className="metric-label">Safety</span><span className={`status-badge ${activeCut.validation.safetyStatus === 'SAFE_TO_PLAN' ? 'good' : 'critical'}`}>{activeCut.validation.safetyStatus}</span></div>
                        
                        <div className="metric-row" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: 'var(--sp-8)' }}>
                          <span className="metric-label">OVERALL RISK</span>
                          <span className={`status-badge ${activeCut.validation.overallRisk === 'LOW' ? 'good' : (activeCut.validation.overallRisk === 'BLOCKED' ? 'critical' : 'warning')}`}>
                            {activeCut.validation.overallRisk}
                          </span>
                        </div>
                        
                        {!activeCut.validation.isValidGeometry && (
                          <div style={{ gridColumn: '1 / -1', color: 'var(--critical)', fontSize: '11px', marginTop: 'var(--sp-8)', padding: 'var(--sp-8)', border: '1px solid var(--critical)', borderRadius: 'var(--radius-sm)' }}>
                            ERRORS: {activeCut.validation.geometryErrors.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 'var(--sp-24)', display: 'flex' }}>
                  <button 
                    onClick={() => approveCut(activeCut.id)}
                    disabled={!activeCut.validation || activeCut.approvalState === 'BLOCKED' || activeCut.approvalState === 'APPROVED'}
                    style={{ 
                      flex: 1, padding: 'var(--sp-12)', background: 'var(--good)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700, letterSpacing: '1px',
                      opacity: (!activeCut.validation || activeCut.approvalState === 'BLOCKED' || activeCut.approvalState === 'APPROVED') ? 0.5 : 1
                    }}
                  >
                    APPROVE CUT
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="ui-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select or create a cut to view details.
          </div>
        )}
      </main>
    </div>
  );
}
