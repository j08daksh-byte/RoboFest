"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { EventCategory } from '@/lib/domain';
import { Bell } from 'lucide-react';

export default function SafetyNotificationsPage() {
  const { events, systemMode } = usePlatformStore();
  const [filter, setFilter] = useState<EventCategory | 'ALL'>('ALL');

  const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.category === filter);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">NOTIFICATIONS</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational and safety alerts from the platform.</p>
      </header>
      
      <main className="grid-1-col">
        
        <div className="ui-panel" style={{ background: 'var(--bg-dark)' }}>
          <div className="ui-panel-body" style={{ display: 'flex', gap: 'var(--sp-8)', padding: 'var(--sp-12)' }}>
            <button 
              onClick={() => setFilter('ALL')}
              style={{ padding: 'var(--sp-4) var(--sp-12)', background: filter === 'ALL' ? 'var(--accent)' : 'transparent', color: filter === 'ALL' ? 'var(--bg-dark)' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
            >
              All
            </button>
            {Object.values(EventCategory).map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat as EventCategory)}
                style={{ padding: 'var(--sp-4) var(--sp-12)', background: filter === cat ? 'var(--accent)' : 'transparent', color: filter === cat ? 'var(--bg-dark)' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-panel-body" style={{ padding: 0 }}>
            {filteredEvents.length === 0 ? (
              <div className="empty-state" style={{ margin: 'var(--sp-16)' }}>
                <Bell size={32} style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-8)' }} />
                <div className="empty-state-title">NO NOTIFICATIONS</div>
                <div>No notifications match the current filter.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredEvents.map((ev, idx) => {
                  let borderLeftColor = 'transparent';
                  if (ev.severity === 'CRITICAL') borderLeftColor = 'var(--critical)';
                  if (ev.severity === 'WARNING') borderLeftColor = 'var(--warning)';
                  if (ev.severity === 'ERROR') borderLeftColor = 'var(--critical)';
                  
                  return (
                    <div key={ev.id} style={{ 
                      padding: 'var(--sp-12) var(--sp-16)', 
                      borderBottom: idx !== filteredEvents.length - 1 ? '1px solid var(--border-color)' : 'none', 
                      borderLeft: `4px solid ${borderLeftColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--sp-4)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '12px', letterSpacing: '0.5px' }}>[{ev.category}]</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : (ev.severity === 'ERROR' ? 'var(--critical)' : 'var(--text-secondary)')), fontSize: '13px' }}>
                        {ev.message}
                      </div>
                      {ev.missionId && (
                        <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                          MISSION: {ev.missionId}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
