"use client";

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { LoginModal } from '../LoginModal';
import { RealtimeProvider } from '../RealtimeProvider';
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
        await useAuthStore.getState().initialize();
        const status = useAuthStore.getState().status;
        if (status === 'AUTHENTICATED') {
          const res = await fetch('/api/robot/state');
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
    <>
      <LoginModal />
      <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <TopBar />
        <div className="content-area">
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </div>
      </div>
    </div>
    </>
  );
}
