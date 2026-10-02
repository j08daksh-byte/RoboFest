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
    <div className="module-container">
      <header className="module-header">
        <h1>Operational Event History</h1>
        <p>Complete historical log of platform and safety events.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '16px', background: '#161b22', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Category:</span>
            <select 
              value={filterCat} 
              onChange={e => setFilterCat(e.target.value as EventCategory | 'ALL')}
              style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '4px' }}
            >
              <option value="ALL">All Categories</option>
              {Object.values(EventCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#8b949e', fontSize: '0.9rem' }}>Severity:</span>
            <select 
              value={filterSev} 
              onChange={e => setFilterSev(e.target.value as 'ALL' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL')}
              style={{ background: '#0d1117', color: '#c9d1d9', border: '1px solid #30363d', padding: '6px 12px', borderRadius: '4px' }}
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        <div className="ui-panel" style={{ background: '#161b22', borderRadius: '8px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead style={{ background: '#21262d', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal', borderBottom: '1px solid #30363d' }}>Timestamp</th>
                <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal', borderBottom: '1px solid #30363d' }}>Severity</th>
                <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal', borderBottom: '1px solid #30363d' }}>Category</th>
                <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal', borderBottom: '1px solid #30363d' }}>Message</th>
                <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal', borderBottom: '1px solid #30363d' }}>Mission ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#8b949e' }}>No matching events found in history buffer.</td>
                </tr>
              ) : (
                filteredEvents.map(ev => {
                  let sevColor = '#c9d1d9';
                  if (ev.severity === 'CRITICAL') sevColor = '#f85149';
                  if (ev.severity === 'WARNING') sevColor = '#d29922';
                  
                  return (
                    <tr key={ev.id} style={{ borderBottom: '1px solid #30363d' }}>
                      <td style={{ padding: '12px 16px', color: '#8b949e', whiteSpace: 'nowrap' }}>{new Date(ev.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', color: sevColor, fontWeight: 'bold' }}>{ev.severity}</td>
                      <td style={{ padding: '12px 16px', color: '#c9d1d9' }}>{ev.category}</td>
                      <td style={{ padding: '12px 16px', color: '#c9d1d9' }}>{ev.message}</td>
                      <td style={{ padding: '12px 16px', color: '#58a6ff' }}>{ev.missionId || '-'}</td>
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
