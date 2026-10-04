"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { initTransport } from '@/lib/transport/provider';
import { usePlatformStore } from '@/lib/platformStore';
import { useRobotStore } from '@/lib/robotState';
import { useAuthStore } from '@/lib/authStore';
import { EventCategory } from '@/lib/domain';
import './shell.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function hydrate() {
      try {
        let token = useAuthStore.getState().token;
        if (!token) {
          await useAuthStore.getState().login('admin', 'admin');
          token = useAuthStore.getState().token;
        }

        if (token) {
          const res = await fetch('/api/robot/state', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            usePlatformStore.getState().hydrateRuntimeState(data);
            useRobotStore.getState().hydrateRuntimeState(data);
            usePlatformStore.getState().addSystemEvent({
              id: 'EVT-' + Date.now(),
              category: EventCategory.OPERATION,
              severity: 'INFO',
              message: 'Runtime state hydrated from backend successfully',
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Failed to hydrate runtime state', err);
      }
    }
    
    hydrate().then(() => {
      initTransport();
    });
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
