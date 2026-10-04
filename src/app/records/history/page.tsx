"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { History, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

function getEventIcon(category: string, message: string) {
  if (category === 'SAFETY') return <AlertTriangle size={16} className="text-error" />;
  if (message.includes('FAILED') || message.includes('REJECTED')) return <XCircle size={16} className="text-error" />;
  if (message.includes('COMPLETED') || message.includes('ACKNOWLEDGED')) return <CheckCircle2 size={16} className="text-success" />;
  return <Info size={16} className="text-muted" />;
}

export default function RecordsHistoryPage() {
  const { systemMode, events } = usePlatformStore();

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-top">
          <h1 className="page-title">EVENT HISTORY</h1>
          <span className={`status-badge ${systemMode.toLowerCase()}`}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Authoritative operational event log and safety audit trail.</p>
      </header>
      
      <main style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        <div className="ui-panel" style={{ minHeight: '100%' }}>
          <div className="ui-panel-header">
            <h2 className="heading-technical">LIVE OPERATIONAL EVENTS</h2>
          </div>
          <div className="ui-panel-body" style={{ padding: '0' }}>
            {events.length === 0 ? (
              <div className="empty-state" style={{ border: 'none', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <History size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
                <div className="empty-state-title">NO EVENTS RECORDED</div>
                <div style={{ color: 'var(--text-muted)' }}>Awaiting operational telemetry...</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>CATEGORY</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>MESSAGE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>SOURCE</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: event.category === 'SAFETY' ? 'rgba(255, 87, 87, 0.1)' : 'var(--bg-main)',
                          color: event.category === 'SAFETY' ? 'var(--color-error)' : 'var(--text-secondary)',
                          border: event.category === 'SAFETY' ? '1px solid rgba(255, 87, 87, 0.3)' : '1px solid var(--border-color)'
                        }}>
                          {getEventIcon(event.category, event.message)}
                          {event.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {event.message}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {event.source}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
