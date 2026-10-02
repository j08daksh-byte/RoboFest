"use client";

import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { Users } from 'lucide-react';

export default function SystemUsersPage() {
  const { systemMode } = usePlatformStore();

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="page-header-top">
          <h1 className="page-title">USERS & ROLES</h1>
          <span className="status-badge simulated">[{systemMode}]</span>
        </div>
        <p className="page-subtitle">Access control and permission boundaries.</p>
      </header>
      
      <main className="grid-1-col">
        <div className="ui-panel">
          <div className="ui-panel-header">
            <h2 className="heading-technical">REGISTERED OPERATORS</h2>
          </div>
          <div className="ui-panel-body">
            <div className="metric-row"><span className="metric-label">OP-01 (Current)</span><span className="status-badge good">ADMIN</span></div>
            <div className="metric-row"><span className="metric-label">SYS-AUTO</span><span className="status-badge neutral">SYSTEM</span></div>
          </div>
        </div>
      </main>
    </div>
  );
}
