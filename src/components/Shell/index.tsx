"use client";

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import './shell.css';

export function AppShell({ children }: { children: React.ReactNode }) {
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
