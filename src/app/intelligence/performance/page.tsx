"use client";

import React, { useEffect, useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { LineChart, Clock, Zap, Activity } from 'lucide-react';
import { getAnalytics } from '@/lib/api/analytics';

export default function IntelligencePerformancePage() {
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
          <h1 className="page-title">SYSTEM PERFORMANCE</h1>
          <span className={`status-badge ${systemMode.toLowerCase()}`}>[{systemMode}]</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="page-subtitle">Compute and network latency metrics.</p>
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
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading performance data...</div>
        ) : (
          <div className="grid-2-col">
            <div className="ui-panel">
              <div className="ui-panel-header">
                <h2 className="heading-technical"><Clock size={16} style={{display: 'inline', marginRight: 8}}/> TIMING & LATENCY</h2>
              </div>
              <div className="ui-panel-body">
                <div className="metric-row"><span className="metric-label">Avg Mission Duration</span><span className="metric-value">{stats?.performance?.avgMissionDurationSeconds > 0 ? (stats.performance.avgMissionDurationSeconds / 60).toFixed(1) + ' min' : 'UNKNOWN'}</span></div>
                <div className="metric-row"><span className="metric-label">Avg Cuts per Mission</span><span className="metric-value">{stats?.cuts?.avgCutsPerMission > 0 ? stats.cuts.avgCutsPerMission.toFixed(1) : 'UNKNOWN'}</span></div>
                <div className="metric-row"><span className="metric-label">First Operation</span><span className="metric-value">{stats?.robot?.firstOperationalTimestamp ? new Date(stats.robot.firstOperationalTimestamp).toLocaleDateString() : 'N/A'}</span></div>
                <div className="metric-row"><span className="metric-label">Last Operation</span><span className="metric-value">{stats?.robot?.lastOperationalTimestamp ? new Date(stats.robot.lastOperationalTimestamp).toLocaleDateString() : 'N/A'}</span></div>
              </div>
            </div>

            <div className="ui-panel">
              <div className="ui-panel-header">
                <h2 className="heading-technical"><Zap size={16} style={{display: 'inline', marginRight: 8}}/> ERROR RATES</h2>
              </div>
              <div className="ui-panel-body">
                <div className="metric-row"><span className="metric-label">Aborted Mission Rate</span><span className="metric-value">{stats?.missions?.total > 0 ? ((stats.missions.aborted / stats.missions.total) * 100).toFixed(1) + '%' : '0.0%'}</span></div>
                <div className="metric-row"><span className="metric-label">Failed Cut Rate</span><span className="metric-value">{stats?.cuts?.total > 0 ? ((stats.cuts.failed / stats.cuts.total) * 100).toFixed(1) + '%' : '0.0%'}</span></div>
                <div className="metric-row"><span className="metric-label">Fault Frequency</span><span className="metric-value">{stats?.robot?.totalRuntimeSeconds > 0 ? (stats.health.faults / (stats.robot.totalRuntimeSeconds / 3600)).toFixed(2) + ' per hr' : 'UNKNOWN'}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
