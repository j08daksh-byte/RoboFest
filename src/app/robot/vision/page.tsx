"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { usePlatformStore } from '@/lib/platformStore';
import { Camera, Scan, AlertTriangle, Check } from 'lucide-react';
import { VisionCandidate } from '@/lib/ai/types';

export default function RobotVisionPage() {
  const { systemMode } = usePlatformStore();
  const { token } = useAuthStore();
  
  const [candidate, setCandidate] = useState<VisionCandidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [converted, setConverted] = useState(false);

  const scanHull = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setConverted(false);
    try {
      const res = await fetch('/api/ai/vision', { method: 'POST' });
      const data = await res.json();
      if (res.ok) setCandidate(data.data);
      else setError(data.error);
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const convertToCut = () => {
    // In a full implementation, this would send a POST to /api/missions/[id]/cuts
    // For now, we simulate operator conversion flow.
    if (!candidate) return;
    setConverted(true);
    usePlatformStore.getState().addSystemEvent({
      id: 'EVT-' + Date.now(),
      category: 'OPERATION' as any,
      severity: 'INFO',
      message: `Vision candidate ${candidate.id} approved by operator as DRAFT cut.`,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">Robot Vision</h1>
          <span className="status-badge simulated">[{systemMode}] SIMULATED CAMERA</span>
        </div>
        <p className="page-subtitle">Visual Hull Inspection & Candidate Detection. AI Vision is ADVISORY ONLY.</p>
      </header>
      
      <main className="grid-2-col">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">LIVE FEED</h2>
          </div>
          <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: '300px', borderRadius: 'var(--radius-md)', position: 'relative' }}>
            <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <div style={{ color: 'var(--text-muted)' }}>NO PHYSICAL CAMERA CONNECTED</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>Simulated injection active</div>
            
            <button onClick={scanHull} disabled={loading} style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scan size={14} /> {loading ? 'SCANNING...' : 'SIMULATE SCAN'}
            </button>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">ANALYSIS RESULTS</h2>
          </div>
          <div className="ui-panel-body">
            {error && <div style={{ color: 'var(--critical)', marginBottom: '16px' }}>{error}</div>}
            
            {!candidate ? (
              <div className="empty-state" style={{ border: 'none' }}>
                <div>Awaiting scan initiation.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ color: 'var(--good)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} /> CANDIDATE DETECTED
                  </div>
                  <div className="metric-row"><span className="metric-label">ID</span><span className="metric-value">{candidate.id}</span></div>
                  <div className="metric-row"><span className="metric-label">Region</span><span className="metric-value">{candidate.detectedRegion}</span></div>
                  <div className="metric-row"><span className="metric-label">Confidence</span><span className="metric-value">{(candidate.confidence * 100).toFixed(1)}%</span></div>
                  <div className="metric-row"><span className="metric-label">Start Point</span><span className="metric-value">[{candidate.proposedCut?.startPoint.x}, {candidate.proposedCut?.startPoint.y}]</span></div>
                  <div className="metric-row"><span className="metric-label">End Point</span><span className="metric-value">[{candidate.proposedCut?.endPoint.x}, {candidate.proposedCut?.endPoint.y}]</span></div>
                </div>

                {converted ? (
                  <div style={{ padding: '12px', background: 'rgba(46, 160, 67, 0.1)', borderLeft: '3px solid var(--good)', color: 'var(--good)' }}>
                    Draft Cut Created Successfully. Pending Safety Validation.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} /> AI is ADVISORY. Creating a cut requires Operator approval.
                    </div>
                    <button onClick={convertToCut} style={{ padding: '12px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}>
                      APPROVE DRAFT CUT
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
