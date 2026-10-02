"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { telemetrySimulator } from '@/lib/telemetry';
import './shell.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    telemetrySimulator.start();
    return () => telemetrySimulator.stop();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
