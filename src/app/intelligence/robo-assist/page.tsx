"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { MessageSquare, Cpu, Send } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';

export default function IntelligenceRoboAssistPage() {
  const { systemMode } = usePlatformStore();
  const { token } = useAuthStore();
  
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || !token) return;
    
    const userQ = query;
    setHistory(prev => [...prev, { role: 'user', text: userQ }]);
    setQuery('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/ai/robo-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // cookie automatically sent
        body: JSON.stringify({ query: userQ })
      });
      const data = await res.json();
      
      if (res.ok) {
        setHistory(prev => [...prev, { role: 'ai', text: data.data.answer }]);
      } else {
        setHistory(prev => [...prev, { role: 'ai', text: `Error: ${data.error}` }]);
      }
    } catch (e) {
      setHistory(prev => [...prev, { role: 'ai', text: 'Network Error' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">ROBO-ASSIST</h1>
          <span className="status-badge simulated">[{systemMode}] ADVISORY ONLY</span>
        </div>
        <p className="page-subtitle">AI-driven operational copilot and contextual reasoning. Grounded in backend state.</p>
      </header>
      
      <main className="grid-2-col-asym">
        <div className="ui-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="ui-panel-header">
            <h2 className="heading-technical">ASSISTANT CHAT</h2>
          </div>
          <div className="ui-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {history.length === 0 ? (
              <div className="empty-state" style={{ flex: 1, border: 'none', background: 'var(--bg-dark)' }}>
                <MessageSquare size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-16)' }} />
                <div className="empty-state-title">AI ASSISTANT READY</div>
                <div style={{ textAlign: 'center', maxWidth: '300px', color: 'var(--text-muted)' }}>Ask about safety, health, missions, or cuts. Data is grounded deterministically.</div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)', overflowY: 'auto' }}>
                {history.map((h, i) => (
                  <div key={i} style={{ alignSelf: h.role === 'user' ? 'flex-end' : 'flex-start', background: h.role === 'user' ? 'var(--primary-dark)' : 'var(--bg-dark)', padding: 'var(--sp-12)', borderRadius: 'var(--radius-md)', maxWidth: '80%', border: h.role === 'ai' ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ fontSize: '11px', color: h.role === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: '4px' }}>
                      {h.role === 'user' ? 'OPERATOR' : 'ROBO-ASSIST (ADVISORY)'}
                    </div>
                    <div>{h.text}</div>
                  </div>
                ))}
                {loading && <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Thinking...</div>}
              </div>
            )}
            
            <div style={{ marginTop: 'var(--sp-16)', display: 'flex', gap: 'var(--sp-8)' }}>
              <input 
                type="text" 
                placeholder="Ask about safety, health, or missions..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }} 
              />
              <button onClick={handleSend} disabled={loading} style={{ padding: 'var(--sp-12) var(--sp-24)', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} /> SEND
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">CONTEXT ENGINE</h2>
            </div>
            <div className="ui-panel-body">
              <div className="metric-row"><span className="metric-label">Model Status</span><span className="status-badge good">ONLINE</span></div>
              <div className="metric-row"><span className="metric-label">Safety Grounding</span><span className="metric-value" style={{ color: 'var(--good)' }}>DETERMINISTIC</span></div>
              <div className="metric-row"><span className="metric-label">Execution Authority</span><span className="metric-value" style={{ color: 'var(--critical)' }}>NONE</span></div>
            </div>
          </div>
          
          <div className="ui-panel">
            <div className="ui-panel-header">
              <h2 className="heading-technical">SUGGESTED ACTIONS</h2>
            </div>
            <div className="ui-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-8)' }}>
              <button onClick={() => { setQuery("What is the current robot health?"); handleSend(); }} style={{ textAlign: 'left', padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px dashed var(--border-color)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px' }}>
                <Cpu size={14} style={{ display: 'inline', marginRight: '8px' }} />
                Check current robot health
              </button>
              <button onClick={() => { setQuery("Is the emergency stop active?"); handleSend(); }} style={{ textAlign: 'left', padding: 'var(--sp-12)', background: 'var(--bg-dark)', border: '1px dashed var(--border-color)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px' }}>
                <Cpu size={14} style={{ display: 'inline', marginRight: '8px' }} />
                Check safety status
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
