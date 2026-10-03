import React, { useState } from 'react';
import { usePlatformStore } from '@/lib/platformStore';
import { useCutJobStore } from '@/lib/cutting/cutJobStore';
import { validateLayout } from '@/lib/cutting/rectLayout';

export function MissionControls() {
  const store = usePlatformStore();
  const { mission, createMission, startMission, interruptMission, completeMission, cancelMission } = store;
  const { rects, board, imageUrl, imageName } = useCutJobStore();
  const [shipName, setShipName] = useState('Demo Vessel');
  const canCreate = !(!!mission.id && !['COMPLETED', 'CANCELLED'].includes(mission.status));
  const layoutCheck = validateLayout(rects, board);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {canCreate && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <input
            id="mission-ship-name"
            value={shipName}
            onChange={(e) => setShipName(e.target.value)}
            placeholder="Ship name"
            style={{ padding: '6px 8px', background: 'var(--bg-panel)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Photo: <strong>{imageUrl ? imageName : 'none'}</strong> · {rects.length} rectangular {rects.length === 1 ? 'cut' : 'cuts'}
          </div>
          {!layoutCheck.ok && <div style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>{layoutCheck.reason}</div>}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          id="mission-create"
          onClick={() => { createMission({ shipName: shipName.trim() || 'Unnamed Vessel', hullSection: `${rects.length} marked panel${rects.length === 1 ? '' : 's'}`, objective: 'Cut only the marked rectangles: straight-line cuts, torch off while turning', shipImage: imageUrl }); }}
          style={{ padding: '6px 12px', background: 'var(--good)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={!canCreate || !layoutCheck.ok}
        >
          Create Mission
        </button>
        
        <button 
          id="mission-start"
          onClick={() => startMission()}
          style={{ padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={!['PLANNED', 'INTERRUPTED'].includes(mission.status)}
        >
          Start
        </button>

        <button 
          onClick={() => interruptMission()}
          style={{ padding: '6px 12px', background: 'var(--warning)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem' }}
          disabled={mission.status !== 'IN_PROGRESS'}
        >
          Interrupt
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => completeMission()}
          style={{ padding: '6px 12px', background: '#8957e5', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', flex: 1 }}
          disabled={mission.status !== 'IN_PROGRESS'}
        >
          Complete
        </button>
        
        <button 
          onClick={() => cancelMission()}
          style={{ padding: '6px 12px', background: 'var(--critical)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.8rem', flex: 1 }}
          disabled={!['PLANNED', 'IN_PROGRESS', 'INTERRUPTED'].includes(mission.status)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
