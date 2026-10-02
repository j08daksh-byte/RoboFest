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
    <div className="module-container">
      <header className="module-header">
        <h1>Cut Planner</h1>
        <p>Deterministic cut geometry validation and execution planning.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        
        {/* Left Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ui-panel" style={{ background: '#161b22', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#c9d1d9', marginBottom: '16px' }}>Load Demo Cut</h3>
            <select 
              value={selectedDemoIndex} 
              onChange={e => setSelectedDemoIndex(Number(e.target.value))}
              style={{ width: '100%', padding: '8px', marginBottom: '12px', background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px' }}
            >
              {DEMO_CUTS.map((c, i) => (
                <option key={c.id} value={i}>{c.name}</option>
              ))}
            </select>
            <button 
              onClick={handleLoadDemo}
              style={{ width: '100%', padding: '8px', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Load into Planner
            </button>
          </div>

          <div className="ui-panel" style={{ background: '#161b22', padding: '20px', borderRadius: '8px', flex: 1 }}>
            <h3 style={{ color: '#c9d1d9', marginBottom: '16px' }}>Planned Cuts</h3>
            {plannedCuts.length === 0 ? (
              <div style={{ color: '#8b949e', fontSize: '0.9rem' }}>No cuts planned.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plannedCuts.map(cut => (
                  <div 
                    key={cut.id} 
                    onClick={() => setCurrentCut(cut.id)}
                    style={{ 
                      padding: '12px', background: cut.id === currentCutId ? '#1f6feb20' : '#0d1117', 
                      border: `1px solid ${cut.id === currentCutId ? '#58a6ff' : '#30363d'}`, 
                      borderRadius: '6px', cursor: 'pointer' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', color: '#c9d1d9', fontSize: '0.9rem' }}>{cut.id}</span>
                      <span style={{ fontSize: '0.8rem', color: cut.approvalState === 'APPROVED' ? '#2ea043' : (cut.approvalState === 'BLOCKED' ? '#f85149' : '#d29922') }}>
                        {cut.approvalState}
                      </span>
                    </div>
                    <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>{cut.geometry.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        {activeCut ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#c9d1d9', margin: 0 }}>Cut Details: {activeCut.id}</h2>
                <div style={{ padding: '6px 16px', background: '#0d1117', border: '1px solid #30363d', borderRadius: '20px', fontWeight: 'bold', color: '#58a6ff' }}>
                  {activeCut.approvalState}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
                  <h4 style={{ color: '#8b949e', marginBottom: '12px' }}>Geometry</h4>
                  <div style={{ color: '#c9d1d9', fontSize: '0.9rem' }}>
                    <strong>Type:</strong> {activeCut.geometry.type}<br/>
                    <pre style={{ margin: '8px 0 0 0', color: '#58a6ff', background: '#161b22', padding: '8px', borderRadius: '4px', overflowX: 'auto' }}>
                      {JSON.stringify(activeCut.geometry, null, 2)}
                    </pre>
                  </div>
                </div>

                <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d' }}>
                  <h4 style={{ color: '#8b949e', marginBottom: '12px' }}>Material & Estimates</h4>
                  <div style={{ color: '#c9d1d9', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    <strong>Material:</strong> {activeCut.material.name} ({activeCut.material.thicknessMm}mm)<br/>
                    <strong>Length:</strong> {activeCut.estimate?.cutLengthMeters.toFixed(2)} m<br/>
                    <strong>Duration:</strong> {activeCut.estimate?.estimatedDurationSeconds.toFixed(0)} s<br/>
                    <strong>Gas Est:</strong> {activeCut.estimate?.gasRequirementLiters.toFixed(1)} L<br/>
                    <strong>Energy:</strong> {activeCut.estimate?.energyRequirementKj.toFixed(0)} kJ<br/>
                    <strong>Panel Mass:</strong> {activeCut.estimate?.panelMassKg ? `${activeCut.estimate.panelMassKg.toFixed(1)} kg` : 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ background: '#0d1117', padding: '16px', borderRadius: '6px', border: '1px solid #30363d', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ color: '#8b949e', margin: 0 }}>Validation Results</h4>
                  <button 
                    onClick={() => validateCut(activeCut.id)}
                    style={{ padding: '6px 12px', background: '#1f6feb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Run Validation
                  </button>
                </div>
                
                {!activeCut.validation ? (
                  <div style={{ color: '#8b949e', fontSize: '0.9rem', fontStyle: 'italic' }}>Validation not run.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Geometry:</span>
                      <span style={{ color: activeCut.validation.isValidGeometry ? '#2ea043' : '#f85149', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.isValidGeometry ? 'VALID' : 'INVALID'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Reach:</span>
                      <span style={{ color: activeCut.validation.reachStatus === 'REACHABLE' ? '#2ea043' : '#f85149', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.reachStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Structure:</span>
                      <span style={{ color: activeCut.validation.structuralStatus === 'CLEAR' ? '#2ea043' : '#f85149', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.structuralStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Support:</span>
                      <span style={{ color: activeCut.validation.supportStatus === 'CLEAR' ? '#2ea043' : '#f85149', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.supportStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Safety:</span>
                      <span style={{ color: activeCut.validation.safetyStatus === 'SAFE_TO_PLAN' ? '#2ea043' : '#f85149', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {activeCut.validation.safetyStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #30363d', paddingTop: '12px', marginTop: '4px', gridColumn: '1 / -1' }}>
                      <span style={{ color: '#c9d1d9', fontWeight: 'bold' }}>OVERALL RISK:</span>
                      <span style={{ color: activeCut.validation.overallRisk === 'LOW' ? '#2ea043' : (activeCut.validation.overallRisk === 'BLOCKED' ? '#f85149' : '#d29922'), fontWeight: 'bold' }}>
                        {activeCut.validation.overallRisk}
                      </span>
                    </div>
                    
                    {!activeCut.validation.isValidGeometry && (
                      <div style={{ gridColumn: '1 / -1', color: '#f85149', fontSize: '0.85rem', marginTop: '8px' }}>
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
                    flex: 1, padding: '12px', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                    opacity: (!activeCut.validation || activeCut.approvalState === 'BLOCKED' || activeCut.approvalState === 'APPROVED') ? 0.5 : 1
                  }}
                >
                  APPROVE CUT
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="ui-panel" style={{ background: '#161b22', padding: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b949e' }}>
            Select or create a cut to view details.
          </div>
        )}
      </main>
    </div>
  );
}
