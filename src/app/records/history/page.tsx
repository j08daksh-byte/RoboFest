"use client";

import React, { useEffect, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { History, AlertTriangle, Info, CheckCircle2, XCircle, Filter, RefreshCw, Database } from 'lucide-react';
import { getEventHistory } from '@/lib/api/events';

function getEventIcon(category: string, severity: string, message: string) {
  if (severity === 'CRITICAL' || severity === 'HIGH') return <AlertTriangle size={16} className="text-error" />;
  if (severity === 'WARNING') return <AlertTriangle size={16} className="text-warning" />;
  if (message.includes('FAILED') || message.includes('REJECTED')) return <XCircle size={16} className="text-error" />;
  if (message.includes('COMPLETED') || message.includes('ACKNOWLEDGED')) return <CheckCircle2 size={16} className="text-success" />;
  return <Info size={16} className="text-muted" />;
}

export default function RecordsHistoryPage() {
  const { systemMode } = usePlatformStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', severity: '', limit: '100' });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getEventHistory(filters);
      setEvents(res.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

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
          <div className="ui-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="heading-technical" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> OPERATIONAL DATABASE HISTORY
            </h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                value={filters.category} 
                onChange={(e) => setFilters(f => ({...f, category: e.target.value}))}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                <option value="">All Categories</option>
                <option value="SAFETY">SAFETY</option>
                <option value="MISSION">MISSION</option>
                <option value="CUT">CUT</option>
                <option value="COMMAND">COMMAND</option>
                <option value="TELEMETRY">TELEMETRY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
              <select 
                value={filters.severity} 
                onChange={(e) => setFilters(f => ({...f, severity: e.target.value}))}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <button 
                onClick={fetchHistory}
                style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              >
                <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
              </button>
            </div>
          </div>
          <div className="ui-panel-body" style={{ padding: '0' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</div>
            ) : events.length === 0 ? (
              <div className="empty-state" style={{ border: 'none', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <History size={48} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-12)' }} />
                <div className="empty-state-title">NO EVENTS FOUND</div>
                <div style={{ color: 'var(--text-muted)' }}>Adjust filters or ensure database is populated.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-panel)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>TIMESTAMP</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>TYPE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>MESSAGE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>SOURCE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>REFERENCES</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={event.id || index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(event.timestamp).toLocaleString()}
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
                          backgroundColor: event.severity === 'CRITICAL' ? 'rgba(255, 87, 87, 0.1)' : event.severity === 'WARNING' ? 'rgba(255, 170, 0, 0.1)' : 'var(--bg-main)',
                          color: event.severity === 'CRITICAL' ? 'var(--color-error)' : event.severity === 'WARNING' ? 'var(--color-warning)' : 'var(--text-secondary)',
                          border: event.severity === 'CRITICAL' ? '1px solid rgba(255, 87, 87, 0.3)' : event.severity === 'WARNING' ? '1px solid rgba(255, 170, 0, 0.3)' : '1px solid var(--border-color)'
                        }}>
                          {getEventIcon(event.category, event.severity, event.message)}
                          {event.category}{event.type ? ` / ${event.type}` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {event.message}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {event.source}
                        {event.user && <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>By: {event.user.username} ({event.user.role})</div>}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {event.missionId && <div>Mission: {event.missionId.slice(-6)}</div>}
                        {event.cutId && <div>Cut: {event.cutId.slice(-6)}</div>}
                        {event.commandId && <div>Command: {event.commandId.slice(-6)}</div>}
                        {event.robotId && <div>Robot: {event.robotId}</div>}
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
