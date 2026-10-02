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
      <header className="page-header"><div className="page-header-top"><h1 className="page-title">Cut Planner</h1><span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span></div><p className="page-subtitle">Deterministic cut geometry validation and execution planning.</p></header>
      
      <main className="module-content" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ui-panel">
            <h3 className="heading-technical" style={{ marginBottom: '16px' }}>Load Demo Cut</h3>
            <select 
              value={selectedDemoIndex} 
              onChange={e => setSelectedDemoIndex(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
            >
              {DEMO_CUTS.map((c, i) => (
                <option key={c.id} value={i}>{c.name}</option>
              ))}
            </select>
            <button 
              onClick={handleLoadDemo}
              style={{ width: '100%', padding: '8px', background: 'var(--good)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Load into Planner
            </button>
          </div>

          <div className="ui-panel" style={{ flex: 1 }}>
            <h3 className="heading-technical" style={{ marginBottom: '16px' }}>Planned Cuts</h3>
            {plannedCuts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No cuts planned.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plannedCuts.map(cut => (
                  <div 
                    key={cut.id} 
                    onClick={() => setCurrentCut(cut.id)}
                    style={{ 
                      padding: '12px', background: cut.id === currentCutId ? 'rgba(88, 166, 255, 0.1)' : 'var(--bg-dark)', 
                      border: `1px solid ${cut.id === currentCutId ? 'var(--accent)' : 'var(--border-color)'}`, 
                      borderRadius: 'var(--radius-md)', cursor: 'pointer' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{cut.id}</span>
                      <span style={{ fontSize: '0.8rem', color: cut.approvalState === 'APPROVED' ? 'var(--good)' : (cut.approvalState === 'BLOCKED' ? 'var(--critical)' : 'var(--warning)') }}>
                        {cut.approvalState}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{cut.geometry.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        {activeCut ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ui-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 className="heading-technical" style={{ margin: 0, border: 'none', color: 'var(--text-main)', fontSize: '1rem' }}>Cut Details: {activeCut.id}</h2>
                <div style={{ padding: '6px 16px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '20px', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {activeCut.approvalState}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 className="heading-technical" style={{ marginBottom: '12px' }}>Geometry</h4>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <strong>Type:</strong> {activeCut.geometry.type}<br/>
                    <pre style={{ margin: '8px 0 0 0', color: 'var(--accent)', background: 'var(--bg-panel)', padding: '8px', borderRadius: 'var(--radius-sm)', overflowX: 'auto' }}>
                      {JSON.stringify(activeCut.geometry, null, 2)}
                    </pre>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 className="heading-technical" style={{ marginBottom: '12px' }}>Material & Estimates</h4>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <strong>Material:</strong> {activeCut.material.name} ({activeCut.material.thicknessMm}mm)<br/>
                    <strong>Length:</strong> {activeCut.estimate?.cutLengthMeters.toFixed(2)} m<br/>
                    <strong>Duration:</strong> {activeCut.estimate?.estimatedDurationSeconds.toFixed(0)} s<br/>
                    <strong>Gas Est:</strong> {activeCut.estimate?.gasRequirementLiters.toFixed(1)} L<br/>
                    <strong>Energy:</strong> {activeCut.estimate?.energyRequirementKj.toFixed(0)} kJ<br/>
                    <strong>Panel Mass:</strong> {activeCut.estimate?.panelMassKg ? `${activeCut.estimate.panelMassKg.toFixed(1)} kg` : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-dark)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 className="heading-technical" style={{ margin: 0, border: 'none' }}>Validation Results</h4>
                  <button 
                    onClick={() => validateCut(activeCut.id)}
                    style={{ padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Run Validation
                  </button>
                </div>
                
                {!activeCut.validation ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Validation not run.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Geometry:</span>
                      <span style={{ color: activeCut.validation.isValidGeometry ? 'var(--good)' : 'var(--critical)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.isValidGeometry ? 'VALID' : 'INVALID'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reach:</span>
                      <span style={{ color: activeCut.validation.reachStatus === 'REACHABLE' ? 'var(--good)' : 'var(--critical)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.reachStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Structure:</span>
                      <span style={{ color: activeCut.validation.structuralStatus === 'CLEAR' ? 'var(--good)' : 'var(--critical)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.structuralStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Support:</span>
                      <span style={{ color: activeCut.validation.supportStatus === 'CLEAR' ? 'var(--good)' : 'var(--critical)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.supportStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Safety:</span>
                      <span style={{ color: activeCut.validation.safetyStatus === 'SAFE_TO_PLAN' ? 'var(--good)' : 'var(--critical)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.safetyStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>OVERALL RISK:</span>
                      <span style={{ color: activeCut.validation.overallRisk === 'LOW' ? 'var(--good)' : (activeCut.validation.overallRisk === 'BLOCKED' ? 'var(--critical)' : 'var(--warning)'), fontWeight: 'bold' }}>
                        {activeCut.validation.overallRisk}
                      </span>
                    </div>
                    
                    {!activeCut.validation.isValidGeometry && (
                      <div style={{ gridColumn: '1 / -1', color: 'var(--critical)', fontSize: '0.85rem', marginTop: '8px' }}>
                        Errors: {activeCut.validation.geometryErrors.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  onClick={() => approveCut(activeCut.id)}
                  disabled={!activeCut.validation || activeCut.approvalState === 'BLOCKED' || activeCut.approvalState === 'APPROVED'}
                  style={{ 
                    flex: 1, padding: '12px', background: 'var(--good)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 'bold',
                    opacity: (!activeCut.validation || activeCut.approvalState === 'BLOCKED' || activeCut.approvalState === 'APPROVED') ? 0.5 : 1
                  }}
                >
                  APPROVE CUT
                </button>
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
