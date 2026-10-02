"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MessageSquare, Cpu } from 'lucide-react';

export default function IntelligenceRoboAssistPage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBO-ASSIST</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">AI-driven operational copilot and contextual reasoning.</p>
      </header>
      
      <main className="grid-2-col-asym">
        <div className="ui-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="ui-panel-header">
            <h2 className="heading-technical">ASSISTANT CHAT</h2>
          </div>
          <div className="ui-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="empty-state" style={{ flex: 1, border: 'none', background: 'var(--bg-dark)' }}>
              <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-16)' }} />
              <div className="empty-state-title">AI ASSISTANT OFFLINE</div>
              <div style={{ textAlign: 'center', maxWidth: '300px' }}>Robo-Assist chat interface is not available in the current simulation mode.</div>
            </div>
            
            <div style={{ marginTop: 'var(--sp-16)', display: 'flex', gap: 'var(--sp-8)' }}>
              <input type="text" placeholder="Type a command..." disabled style={{ flex: 1, padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
              <button disabled style={{ padding: 'var(--sp-12) var(--sp-24)', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed', fontWeight: 600 }}>SEND</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">CONTEXT ENGINE</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row"><span className="metric-label">Model Status</span><span className="status-badge neutral">STANDBY</span></div>
              <div className="metric-row"><span className="metric-label">Context Window</span><span className="metric-value" style={{ color: 'var(--text-muted)' }}>0 / 128k</span></div>
              <div className="metric-row"><span className="metric-label">Telemetry Ingestion</span><span className="metric-value" style={{ color: 'var(--good)' }}>ACTIVE</span></div>
            </div>
          </div>
          
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">SUGGESTED ACTIONS</h2>
            </div>
            <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
              <button disabled style={{ textAlign: 'left', padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed', fontSize: '13px' }}>
                <Cpu size={14} style={{ display: 'inline', marginRight: '8px' }} />
                Analyze current vibration patterns
              </button>
              <button disabled style={{ textAlign: 'left', padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed', fontSize: '13px' }}>
                <Cpu size={14} style={{ display: 'inline', marginRight: '8px' }} />
                Suggest optimized cut path for active mission
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
