"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { EventCategory } from '@/lib/domain';

export default function SafetyNotificationsPage() {
  const { events, systemMode } = usePlatformStore();
  const [filter, setFilter] = useState<EventCategory | 'ALL'>('ALL');

  const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.category === filter);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">NOTIFICATIONS</h1>
          <span className="sim-badge" style={{ margin: 0 }}>[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Operational and safety alerts from the platform.</p>
      </header>
      
      <main className="grid-1-col">
        
        <div className="ui-panel" style={{ display: 'flex', gap: '8px', padding: '16px', background: 'var(--bg-dark)' }}>
          <button 
            onClick={() => setFilter('ALL')}
            style={{ padding: '8px 16px', background: filter === 'ALL' ? 'var(--accent)' : 'var(--bg-panel)', color: filter === 'ALL' ? '#000' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: filter === 'ALL' ? 'bold' : 'normal' }}
          >
            All
          </button>
          {Object.values(EventCategory).map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat as EventCategory)}
              style={{ padding: '8px 16px', background: filter === cat ? 'var(--accent)' : 'var(--bg-panel)', color: filter === cat ? '#000' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: filter === cat ? 'bold' : 'normal' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ui-panel">
          <div className="ui-panel-body">
            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">NO NOTIFICATIONS</div>
                <div>No notifications match the current filter.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredEvents.map(ev => {
                  let borderLeftColor = 'var(--border-color)';
                  if (ev.severity === 'CRITICAL') borderLeftColor = 'var(--critical)';
                  if (ev.severity === 'WARNING') borderLeftColor = 'var(--warning)';
                  if (ev.severity === 'ERROR') borderLeftColor = 'var(--critical)';
                  
                  return (
                    <div key={ev.id} style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${borderLeftColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{ev.category}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ color: ev.severity === 'CRITICAL' ? 'var(--critical)' : (ev.severity === 'WARNING' ? 'var(--warning)' : (ev.severity === 'ERROR' ? 'var(--critical)' : 'var(--text-secondary)')) }}>
                        {ev.message}
                      </div>
                      {ev.missionId && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                          Mission ID: {ev.missionId}
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
