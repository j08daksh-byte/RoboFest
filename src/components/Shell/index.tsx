"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { initTransport } from '@/lib/transport/provider';
import './shell.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTransport();
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
