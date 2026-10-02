"use client";

import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { EventCategory } from '@/lib/domain';

export default function SafetyNotificationsPage() {
  const { events, systemMode } = usePlatformStore();
  const [filter, setFilter] = useState<EventCategory | 'ALL'>('ALL');

  const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.category === filter);

  return (
    <div className="module-container">
      <header className="module-header">
        <h1>Notifications</h1>
        <p>Operational and safety alerts from the platform.</p>
        <span className="sim-badge" style={{ background: '#d29922', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {systemMode}
        </span>
      </header>
      
      <main className="module-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button 
            onClick={() => setFilter('ALL')}
            style={{ padding: '6px 12px', background: filter === 'ALL' ? '#58a6ff' : '#21262d', color: filter === 'ALL' ? '#0d1117' : '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
          >
            All
          </button>
          {Object.values(EventCategory).map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat as EventCategory)}
              style={{ padding: '6px 12px', background: filter === cat ? '#58a6ff' : '#21262d', color: filter === cat ? '#0d1117' : '#c9d1d9', border: '1px solid #30363d', borderRadius: '4px', cursor: 'pointer' }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ui-panel" style={{ background: '#161b22', padding: '24px', borderRadius: '8px', minHeight: '400px' }}>
          {filteredEvents.length === 0 ? (
            <div style={{ color: '#8b949e', textAlign: 'center', padding: '40px 0' }}>No notifications found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEvents.map(ev => {
                let borderLeftColor = '#30363d';
                if (ev.severity === 'CRITICAL') borderLeftColor = '#f85149';
                if (ev.severity === 'WARNING') borderLeftColor = '#d29922';
                
                return (
                  <div key={ev.id} style={{ padding: '16px', background: '#0d1117', borderRadius: '6px', borderLeft: `4px solid ${borderLeftColor}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#c9d1d9' }}>{ev.category}</span>
                      <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>{new Date(ev.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ color: ev.severity === 'CRITICAL' ? '#f85149' : (ev.severity === 'WARNING' ? '#d29922' : '#c9d1d9') }}>
                      {ev.message}
                    </div>
                    {ev.missionId && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#58a6ff' }}>
                        Mission: {ev.missionId}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
