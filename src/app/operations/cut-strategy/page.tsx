"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { usePlannerStore } from '@/lib/cutting/plannerStore';
import { generateDeterministicStrategy } from '@/lib/cutting/strategy';
import { BrainCircuit, Cpu, AlertTriangle, Info } from 'lucide-react';

export default function OperationsCutStrategyPage() {
  const { systemMode } = usePlatformStore();
  const { plannedCuts } = usePlannerStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">CUT STRATEGY</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Deterministic geometry & material optimization.</p>
      </header>
      
      <main className="grid-1-col">
        {plannedCuts.length === 0 ? (
          <div className="ui-panel">
            <div className="ui-panel-body" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state" style={{ border: 'none' }}>
                <BrainCircuit size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
                <div className="empty-state-title">STRATEGY ENGINE IDLE</div>
                <div style={{ color: 'var(--text-muted)', marginTop: '8px' }}>No cuts planned. Engine awaits geometry data.</div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
            {plannedCuts.map((cut) => {
              const strategy = generateDeterministicStrategy(cut);
              return (
                <div key={cut.id} className="ui-panel">
                  <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="heading-technical">RECOMMENDATION: {cut.id}</h2>
                    <span className={`status-badge ${strategy.isOptimal ? 'good' : 'warning'}`}>
                      {strategy.isOptimal ? 'OPTIMAL' : 'SUB-OPTIMAL'}
                    </span>
                  </div>
                  <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)' }}>
                    <div className="metric-row">
                      <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={14} /> Sequence
                      </span>
                      <span className="metric-value">{strategy.recommendedSequence}</span>
                    </div>
                    
                    <div className="metric-row">
                      <span className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} /> Gas Profile
                      </span>
                      <span className="metric-value">{strategy.gasOptimization}</span>
                    </div>
                    
                    {strategy.structuralWarning && (
                      <div style={{ padding: '12px', background: 'rgba(235,87,87,0.1)', borderLeft: '3px solid var(--critical)', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--critical)', fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>
                          <AlertTriangle size={16} /> STRUCTURAL WARNING
                        </div>
                        <div style={{ color: 'var(--text-main)', fontSize: '13px' }}>
                          {strategy.structuralWarning}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '8px' }}>
                      AI Confidence: {strategy.confidence} (Deterministic Validation)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
