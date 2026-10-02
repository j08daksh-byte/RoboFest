import React from 'react';
import { usePlatformStore } from '@/lib/platformStore';

export function MissionControls() {
  const store = usePlatformStore();
  const { mission, createMission, startMission, interruptMission, completeMission, cancelMission } = store;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => createMission({ shipName: 'Demo Vessel', hullSection: 'STARBOARD-A', objective: 'Demonstration hull cutting mission' })}
          style={{ padding: '6px 12px', background: '#238636', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={!!mission.id && !['COMPLETED', 'CANCELLED'].includes(mission.status)}
        >
          Create Mission
        </button>
        
        <button 
          onClick={() => startMission()}
          style={{ padding: '6px 12px', background: '#1f6feb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={!['PLANNED', 'INTERRUPTED'].includes(mission.status)}
        >
          Start
        </button>

        <button 
          onClick={() => interruptMission()}
          style={{ padding: '6px 12px', background: '#d29922', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={mission.status !== 'IN_PROGRESS'}
        >
          Interrupt
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => completeMission()}
          style={{ padding: '6px 12px', background: '#8957e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', flex: 1 }}
          disabled={mission.status !== 'IN_PROGRESS'}
        >
          Complete
        </button>
        
        <button 
          onClick={() => cancelMission()}
          style={{ padding: '6px 12px', background: '#da3633', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', flex: 1 }}
          disabled={!['PLANNED', 'IN_PROGRESS', 'INTERRUPTED'].includes(mission.status)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
