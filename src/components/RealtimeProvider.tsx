"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { usePlatformStore } from '@/lib/platformStore';
import { useRobotStore } from '@/lib/robotState';
import { RealtimeEvent } from '@/lib/realtime/types';
import { EventCategory, SystemEvent } from '@/lib/domain';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const authStatus = useAuthStore((state) => state.status);
  const esRef = useRef<EventSource | null>(null);
  
  // Manage reconnection logic
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (authStatus !== 'AUTHENTICATED') {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (esRef.current) esRef.current.close();

      const es = new EventSource('/api/realtime', { withCredentials: true });
      esRef.current = es;

      es.onopen = async () => {
        // Upon successful connection (or reconnection), bounded authoritative reconciliation
        setReconnectAttempts(0);
        
        try {
          const res = await fetch('/api/robot/state');
          if (res.ok) {
            const data = await res.json();
            usePlatformStore.getState().hydrateRuntimeState(data);
            useRobotStore.getState().hydrateRuntimeState(data);
            
            usePlatformStore.getState().addSystemEvent({
              id: 'EVT-RECON-' + Date.now(),
              category: EventCategory.OPERATION,
              severity: 'INFO',
              message: 'Real-time connection established. State reconciled.',
              timestamp: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error('Failed to reconcile state after real-time connection', e);
        }
      };

      es.onmessage = (event) => {
        try {
          const rtEvent: RealtimeEvent = JSON.parse(event.data);
          
          switch (rtEvent.type) {
            case 'RUNTIME_STATE_UPDATED':
              usePlatformStore.getState().hydrateRuntimeState(rtEvent.payload);
              useRobotStore.getState().hydrateRuntimeState(rtEvent.payload);
              break;
            case 'COMMAND_STATUS_CHANGED':
              // Normally we might update a specific command UI, but for now we just log it
              console.log('Command status changed:', rtEvent.payload);
              break;
            case 'MISSION_UPDATED':
            case 'CUT_UPDATED':
            case 'SAFETY_CHANGED':
              // A full runtime state reconciliation is easiest since these affect global state
              // We could merge just the payload if the event schema precisely matches
              if (rtEvent.payload) {
                usePlatformStore.getState().hydrateRuntimeState(rtEvent.payload);
              }
              break;
            case 'TELEMETRY_UPDATED':
              // Push to local history
              if (rtEvent.payload && Array.isArray(rtEvent.payload)) {
                rtEvent.payload.forEach(sample => usePlatformStore.getState().addTelemetrySample(sample));
              }
              break;
            case 'EVENT_CREATED':
              usePlatformStore.getState().addSystemEvent(rtEvent.payload as SystemEvent);
              break;
            case 'HEALTH_UPDATED':
              // Health updates
              break;
          }
        } catch (e) {
          console.error('Failed to parse real-time event', e);
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        
        // Exponential backoff reconnect up to max 10s
        const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 10000);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
        }, timeout);
      };
    };

    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [authStatus, reconnectAttempts]);

  return <>{children}</>;
}
