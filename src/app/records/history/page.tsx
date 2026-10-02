"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { EventCategory } from '@/lib/domain';

export default function RecordsHistoryPage() {
  const { events, systemMode } = usePlatformStore();
  const [filterCat, setFilterCat] = useState<EventCategory | 'ALL'>('ALL');
  const [filterSev, setFilterSev] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'>('ALL');

  const filteredEvents = events.filter(e => {
    if (filterCat !== 'ALL' && e.category !== filterCat) return false;
    if (filterSev !== 'ALL' && e.severity !== filterSev) return false;
    return true;
  });

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">OPERATIONAL EVENT HISTORY</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Complete historical log of platform and safety events.</p>
      </header>
      
      <main className="grid-1-col" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div className="ui-panel" style={{ display: 'flex', gap: '20px', padding: '16px', background: 'var(--bg-dark)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>CATEGORY:</span>
            <select 
              value={filterCat} 
              onChange={e => setFilterCat(e.target.value as EventCategory | 'ALL')}
              style={{ background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            >
              <option value="ALL">All Categories</option>
              {Object.values(EventCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>SEVERITY:</span>
            <select 
              value={filterSev} 
              onChange={e => setFilterSev(e.target.value as 'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL')}
              style={{ background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', outline: 'none' }}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        <div className="ui-panel" style={{ flex: 1, padding: 0, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead style={{ background: 'var(--bg-dark)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>TIMESTAMP</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>SEVERITY</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>CATEGORY</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>MESSAGE</th>
                <th style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>MISSION ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state" style={{ border: 'none', background: 'transparent' }}>
                      <div className="empty-state-title">NO EVENTS FOUND</div>
                      <div>No matching events found in history buffer.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map(ev => {
                  let sevColor = 'var(--text-main)';
                  if (ev.severity === 'CRITICAL') sevColor = 'var(--critical)';
                  if (ev.severity === 'WARNING') sevColor = 'var(--warning)';
                  if (ev.severity === 'ERROR') sevColor = 'var(--critical)';
                  
                  return (
                    <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-panel)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(ev.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: sevColor, fontWeight: 'bold' }}>{ev.severity}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-main)' }}>{ev.category}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{ev.message}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{ev.missionId || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
