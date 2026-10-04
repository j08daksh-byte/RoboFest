"use client";

import React, { useState, useEffect } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { usePlannerStore } from '@/lib/cutting/plannerStore';
import { BrainCircuit, Cpu, AlertTriangle, Info, Check } from 'lucide-react';
import { StrategyRecommendation } from '@/lib/cutting/strategy';

export default function OperationsCutStrategyPage() {
  const { systemMode } = usePlatformStore();
  const { plannedCuts } = usePlannerStore();
  
  const [strategies, setStrategies] = useState<Record<string, StrategyRecommendation>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStrategies = async () => {
      if (plannedCuts.length === 0) return;
      setLoading(true);
      
      const results: Record<string, StrategyRecommendation> = {};
      for (const cut of plannedCuts) {
        try {
          const res = await fetch('/api/ai/strategy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cut })
          });
          const data = await res.json();
          if (res.ok) {
            results[cut.id] = data.data;
          }
        } catch (e) {
          // ignore
        }
      }
      setStrategies(results);
      setLoading(false);
    };

    fetchStrategies();
  }, [plannedCuts]);

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
            {loading && <div style={{ color: 'var(--text-muted)' }}>Generating strategies...</div>}
            {!loading && plannedCuts.map((cut) => {
              const strategy = strategies[cut.id];
              if (!strategy) return null;
              
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
                    
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)' }}>
                        <AlertTriangle size={12} /> ADVISORY ONLY
                      </div>
                      <div>
                        AI Confidence: {strategy.confidence} (Deterministic Validation)
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <button style={{ padding: '10px 16px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                        usePlatformStore.getState().addSystemEvent({
                          id: 'EVT-' + Date.now(),
                          category: 'OPERATION' as any,
                          severity: 'INFO',
                          message: `Operator accepted AI Strategy for cut ${cut.id}`,
                          timestamp: new Date().toISOString()
                        });
                        alert('Strategy accepted deterministically.');
                      }}>
                        <Check size={14} /> ACCEPT AS PLAN
                      </button>
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
