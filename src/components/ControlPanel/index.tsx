'use client';

import React from 'react';
import { useRobotStore } from '@/lib/robotState';
import { usePlatformStore } from '@/lib/platformStore';
import { robotConfig } from '@/lib/robotConfig';
import { Play, Pause, RotateCcw, Power, Monitor, Settings2, ShieldCheck, AlertCircle } from 'lucide-react';

export function ControlPanel({ mode = 'full' }: { mode?: 'full' | 'compact' }) {
  const {
    arm,
    electromagnet,
    torch,
    simulationState,
    uiMode,
    cameraTarget,
    followMode,
    xRayMode,
    setArmPosition,
    setElectromagnet,
    setTorch,
    setSimulationState,
    setUiMode,
    setLocomotionIntent,
    triggerCameraFocus,
    setFollowMode,
    setXRayMode,
    reset,
  } = useRobotStore();
  
  const safety = usePlatformStore(state => state.safety);

  const handleSimToggle = () => {
    setSimulationState(simulationState === 'playing' ? 'paused' : 'playing');
  };

  return (
    <div className={`control-panel ${uiMode}`}>
      <div className="panel-header">
        <h2>DIGITAL TWIN HUD</h2>
        {mode === 'full' && (
          <div className="mode-toggle">
            <button 
              className={uiMode === 'debug' ? 'active' : ''} 
              onClick={() => setUiMode('debug')}
            >
              <Settings2 size={14} /> DEBUG
            </button>
            <button 
              className={uiMode === 'presentation' ? 'active' : ''} 
              onClick={() => setUiMode('presentation')}
            >
              <Monitor size={14} /> PRESENT
            </button>
          </div>
        )}
      </div>

      {mode === 'full' && (
        <>
          <div className="hud-section">
        <h3><ShieldCheck size={16} /> SYSTEM STATUS</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">COMM</span>
            <span className="value warning">SIMULATED</span>
          </div>
          <div className="status-item">
            <span className="label">POWER</span>
            <span className="value good">NOMINAL <span className="sim-badge">SIM</span></span>
          </div>
          <div className="status-item">
            <span className="label">MAGNETIC HOLD</span>
            <span className={electromagnet.enabled ? 'value warning' : 'value good'}>{electromagnet.enabled ? 'LOCKED' : 'RELEASED'} <span className="sim-badge">SIM</span></span>
          </div>
          <div className="status-item">
            <span className="label">SAFETY SYSTEM</span>
            <span className={safety.emergencyStateActive || safety.level !== 'NORMAL' ? 'value critical' : 'value good'}>
              {safety.emergencyStateActive ? 'EMERGENCY' : safety.level} <span className="sim-badge">SIM</span>
            </span>
          </div>
        </div>
      </div>

      <div className="hud-section">
        <h3>MAGNETIC SYSTEM</h3>
        <div className="button-group">
          <button 
            className={electromagnet.enabled ? 'active-magnet' : ''} 
            onClick={() => setElectromagnet(!electromagnet.enabled)}
          >
            <Power size={16} /> CENTRAL ELECTROMAGNET {electromagnet.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="hud-section">
        <h3>ROBOT MOBILITY</h3>
        <div className="dpad-group">
          <div className="dpad-row">
            <button 
              onMouseDown={() => safety.movementPermission && !electromagnet.enabled && setLocomotionIntent(-1, 0)}
              onMouseUp={() => setLocomotionIntent(0, 0)}
              onMouseLeave={() => setLocomotionIntent(0, 0)}
              disabled={!safety.movementPermission || electromagnet.enabled}
              style={!safety.movementPermission ? { opacity: 0.5, border: '1px solid var(--critical)' } : undefined}
            >â–² UP</button>
          </div>
          <div className="dpad-row">
            <button 
              onMouseDown={() => safety.movementPermission && !electromagnet.enabled && setLocomotionIntent(0, -1)}
              onMouseUp={() => setLocomotionIntent(0, 0)}
              onMouseLeave={() => setLocomotionIntent(0, 0)}
              disabled={!safety.movementPermission || electromagnet.enabled}
              style={!safety.movementPermission ? { opacity: 0.5, border: '1px solid var(--critical)' } : undefined}
            >â—€ LEFT</button>
            <button 
              onMouseDown={() => safety.movementPermission && !electromagnet.enabled && setLocomotionIntent(0, 1)}
              onMouseUp={() => setLocomotionIntent(0, 0)}
              onMouseLeave={() => setLocomotionIntent(0, 0)}
              disabled={!safety.movementPermission || electromagnet.enabled}
              style={!safety.movementPermission ? { opacity: 0.5, border: '1px solid var(--critical)' } : undefined}
            >RIGHT â–¶</button>
          </div>
          <div className="dpad-row">
            <button 
              onMouseDown={() => safety.movementPermission && !electromagnet.enabled && setLocomotionIntent(1, 0)}
              onMouseUp={() => setLocomotionIntent(0, 0)}
              onMouseLeave={() => setLocomotionIntent(0, 0)}
              disabled={!safety.movementPermission || electromagnet.enabled}
              style={!safety.movementPermission ? { opacity: 0.5, border: '1px solid var(--critical)' } : undefined}
            >â–¼ DOWN</button>
          </div>
        </div>
        {electromagnet.enabled && <p className="warning-text">Unlock magnet to move</p>}
        {!safety.movementPermission && (
          <p className="warning-text" style={{ color: 'var(--critical)' }}>
            BLOCKED BY SAFETY{safety.activeHazards.length > 0 ? `: ${safety.activeHazards[0].description}` : ''}
          </p>
        )}
      </div>

      <div className="hud-section">
        <h3>CUTTING ARM</h3>
        <div className="slider-group">
          <label>
            <span className="label-text">Y AXIS (VERTICAL)</span>
            <span className="value-text">{(arm.yPosition * 1000).toFixed(0)} mm</span>
            <input 
              type="range" 
              min={robotConfig.armMinPositionY} 
              max={robotConfig.armMaxPositionY} 
              step="0.01" 
              value={arm.yPosition} 
              onChange={(e) => setArmPosition(parseFloat(e.target.value), arm.xExtension)} 
            />
          </label>
          <label>
            <span className="label-text">X AXIS (EXTENSION)</span>
            <span className="value-text">{(arm.xExtension * 1000).toFixed(0)} mm</span>
            <input 
              type="range" 
              min={robotConfig.armMinExtensionX} 
              max={robotConfig.armMaxExtensionX} 
              step="0.01" 
              value={arm.xExtension} 
              onChange={(e) => setArmPosition(arm.yPosition, parseFloat(e.target.value))} 
            />
          </label>
        </div>
      </div>

      <div className="hud-section">
        <h3>TORCH</h3>
        <div className="button-group">
          <button 
            className={torch.enabled ? 'active-flame' : ''} 
            onClick={() => {
              if (torch.enabled) {
                setTorch(false);
              } else if (safety.torchPermission) {
                setTorch(true);
              }
            }}
            disabled={!safety.torchPermission && !torch.enabled}
            style={(!safety.torchPermission && !torch.enabled) ? { opacity: 0.5, border: '1px solid var(--critical)' } : undefined}
          >
            <Power size={16} /> OXY-ACETYLENE TORCH {torch.enabled ? 'IGNITED' : 'OFF'}
          </button>
        </div>
        {!safety.torchPermission && (
          <p className="warning-text" style={{ color: 'var(--critical)' }}>
            BLOCKED BY SAFETY{safety.activeHazards.length > 0 ? `: ${safety.activeHazards[0].description}` : ''}
          </p>
        )}
      </div>
        </>
      )}

      <div className="hud-section">
        <h3>INSPECTION / CAMERA</h3>
        <div className="button-group">
          <button 
            className={cameraTarget === 'robot' ? 'active' : ''} 
            onClick={() => triggerCameraFocus('robot')}
          >
            FOCUS ROBOT
          </button>
          <button 
            className={cameraTarget === 'cut' ? 'active' : ''} 
            onClick={() => triggerCameraFocus('cut')}
          >
            FOCUS CUT
          </button>
        </div>
        <div className="button-group" style={{ marginTop: '5px' }}>
          <button 
            className={cameraTarget === 'ship' ? 'active' : ''} 
            onClick={() => triggerCameraFocus('ship')}
          >
            FOCUS SHIP
          </button>
            <button 
              className={cameraTarget === 'free' ? 'active' : ''}
              onClick={() => triggerCameraFocus('free')}
            >
              RESET VIEW
            </button>
          </div>
          {mode === 'full' && (
            <>
              <div className="button-group" style={{ marginTop: '5px' }}>
                <button 
                  className={cameraTarget === 'starboard' ? 'active' : ''} 
                  onClick={() => triggerCameraFocus('starboard')}
                >
                  STARBOARD
                </button>
                <button 
                  className={cameraTarget === 'port' ? 'active' : ''} 
                  onClick={() => triggerCameraFocus('port')}
                >
                  PORT
                </button>
              </div>
              <div className="button-group" style={{ marginTop: '5px' }}>
                <button 
                  className={cameraTarget === 'front' ? 'active' : ''} 
                  onClick={() => triggerCameraFocus('front')}
                >
                  FRONT
                </button>
                <button 
                  className={cameraTarget === 'rear' ? 'active' : ''} 
                  onClick={() => triggerCameraFocus('rear')}
                >
                  REAR
                </button>
              </div>
            </>
          )}
          <div className="button-group" style={{ marginTop: '5px' }}>
          <button 
            className={followMode ? 'active' : ''} 
            onClick={() => setFollowMode(!followMode)}
          >
            FOLLOW ROBOT: {followMode ? 'ON' : 'OFF'}
          </button>
          <button 
            className={xRayMode ? 'active-flame' : ''} 
            onClick={() => setXRayMode(!xRayMode)}
          >
            X-RAY: {xRayMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {mode === 'full' && (
        <>
          <div className="hud-section">
            <h3>SIMULATION</h3>
        <div className="button-group">
          <button onClick={handleSimToggle}>
            {simulationState === 'playing' ? <><Pause size={16}/> PAUSE</> : <><Play size={16}/> PLAY</>}
          </button>
          <button onClick={() => { reset(); setSimulationState('reset'); }}>
            <RotateCcw size={16}/> RESET
          </button>
        </div>
      </div>

      {uiMode === 'debug' && (
        <div className="hud-section telemetry">
          <h3>DIAGNOSTICS</h3>
          <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
            <strong>ROBOT POSITION</strong><br/>
            X: {(useRobotStore.getState().position.x * 1000).toFixed(0)} mm<br/>
            Y: {(useRobotStore.getState().position.y * 1000).toFixed(0)} mm<br/>
            Z: {(useRobotStore.getState().position.z * 1000).toFixed(0)} mm<br/><br/>
            
            <strong>MOBILITY</strong><br/>
            VERTICAL: {useRobotStore.getState().locomotionIntent.y !== 0 ? 'MOVING' : 'STOPPED'}<br/>
            LATERAL: {useRobotStore.getState().locomotionIntent.x !== 0 ? 'MOVING' : 'STOPPED'}<br/><br/>
            
            <strong>MAGNETIC HOLD:</strong> {electromagnet.enabled ? 'ON' : 'OFF'}<br/>
            <strong>SAFETY SYSTEM:</strong> <span style={{ color: safety.emergencyStateActive || safety.level !== 'NORMAL' ? 'var(--critical)' : 'inherit' }}>{safety.emergencyStateActive ? 'EMERGENCY' : safety.level}</span><br/><br/>

            <strong>POSITIONING CABLE</strong><br/>
            LENGTH: {(useRobotStore.getState().fifthCableLength * 1000).toFixed(0)} mm<br/>
            TENSION: NOMINAL<br/><br/>
            
            <strong>CUTTING ENGINE</strong><br/>
            TORCH: {torch.enabled ? 'ON' : 'OFF'}<br/>
            ACTIVE POINTS: {useRobotStore.getState().activeCutPath.length}<br/>
            <strong>COMPLETED CUTS:</strong> {useRobotStore.getState().completedCuts.length}<br/>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
