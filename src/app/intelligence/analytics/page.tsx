"use client";

import React, { useEffect, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Activity, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Hammer, Wrench, HardDrive } from 'lucide-react';
import { getAnalytics } from '@/lib/api/analytics';

export default function IntelligenceAnalyticsPage() {
  const { systemMode } = usePlatformStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    setLoading(true);
    getAnalytics(timeRange)
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <header className="page-header" style={{ flexShrink: 0 }}>
        <div className="page-header-top">
          <h1 className="page-title">ANALYTICS & METRICS</h1>
          <span className={`status-badge ${systemMode.toLowerCase()}`}>[{systemMode}]</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="page-subtitle">Long-term data aggregation and operational analysis.</p>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.85rem' }}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </header>
      
      <main style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>
        ) : (
          <div className="grid-2-col">
            <div className="ui-panel">
              <div className="ui-panel-header">
                <h2 className="heading-technical"><Activity size={16} style={{display: 'inline', marginRight: 8}}/> OPERATIONAL EFFICIENCY</h2>
              </div>
              <div className="ui-panel-body">
                <div className="metric-row"><span className="metric-label">Total Missions</span><span className="metric-value">{stats?.missions?.total || 0}</span></div>
                <div className="metric-row"><span className="metric-label">Missions Completed</span><span className="metric-value" style={{color: stats?.missions?.completed > 0 ? 'var(--good)' : 'var(--text-main)'}}>{stats?.missions?.completed || 0}</span></div>
                <div className="metric-row"><span className="metric-label">Missions Aborted</span><span className="metric-value" style={{color: stats?.missions?.aborted > 0 ? 'var(--critical)' : 'var(--text-main)'}}>{stats?.missions?.aborted || 0}</span></div>
                <div className="metric-row"><span className="metric-label">Completion Rate</span><span className="metric-value">{stats?.missions?.completionRate.toFixed(1)}%</span></div>
                
                <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-color)' }}></div>
                
                <div className="metric-row"><span className="metric-label">Total Cuts Planned</span><span className="metric-value">{stats?.cuts?.total || 0}</span></div>
                <div className="metric-row"><span className="metric-label">Cuts Completed</span><span className="metric-value" style={{color: stats?.cuts?.completed > 0 ? 'var(--good)' : 'var(--text-main)'}}>{stats?.cuts?.completed || 0}</span></div>
                <div className="metric-row"><span className="metric-label">Cuts Failed/Aborted</span><span className="metric-value" style={{color: stats?.cuts?.failed > 0 || stats?.cuts?.aborted > 0 ? 'var(--critical)' : 'var(--text-main)'}}>{(stats?.cuts?.failed || 0) + (stats?.cuts?.aborted || 0)}</span></div>
                <div className="metric-row"><span className="metric-label">Cut Success Rate</span><span className="metric-value">{stats?.cuts?.completionRate.toFixed(1)}%</span></div>
              </div>
            </div>

            <div className="grid-1-col" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="ui-panel">
                <div className="ui-panel-header">
                  <h2 className="heading-technical"><ShieldAlert size={16} style={{display: 'inline', marginRight: 8}}/> SAFETY & HEALTH</h2>
                </div>
                <div className="ui-panel-body">
                  <div className="metric-row"><span className="metric-label">Safety Events</span><span className="metric-value" style={{color: stats?.safety?.safetyEvents > 0 ? 'var(--critical)' : 'var(--text-main)'}}>{stats?.robot?.safetyEvents || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">E-Stops Asserted</span><span className="metric-value" style={{color: stats?.safety?.estops > 0 ? 'var(--critical)' : 'var(--text-main)'}}>{stats?.safety?.estops || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">Unsafe Commands Rejected</span><span className="metric-value" style={{color: stats?.safety?.rejectedUnsafe > 0 ? 'var(--warning)' : 'var(--text-main)'}}>{stats?.safety?.rejectedUnsafe || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">Component Faults (Critical)</span><span className="metric-value" style={{color: stats?.health?.faults > 0 ? 'var(--critical)' : 'var(--text-main)'}}>{stats?.health?.faults || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">Component Warnings</span><span className="metric-value" style={{color: stats?.health?.warnings > 0 ? 'var(--warning)' : 'var(--text-main)'}}>{stats?.health?.warnings || 0}</span></div>
                </div>
              </div>
              
              <div className="ui-panel">
                <div className="ui-panel-header">
                  <h2 className="heading-technical"><Wrench size={16} style={{display: 'inline', marginRight: 8}}/> SYSTEM UTILIZATION</h2>
                </div>
                <div className="ui-panel-body">
                  <div className="metric-row"><span className="metric-label">Maintenance Interventions</span><span className="metric-value">{stats?.robot?.maintenanceEvents || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">Total Commands Processed</span><span className="metric-value">{stats?.robot?.commandCount || 0}</span></div>
                  <div className="metric-row"><span className="metric-label">Active Operating Time</span><span className="metric-value">{(stats?.robot?.totalRuntimeSeconds / 3600).toFixed(2)} hrs</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
