"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePlatformStore } from '@/lib/platformStore';
import { useRobotStore } from '@/lib/robotState';
import { DigitalTwin } from '@/components/DigitalTwin';
import { LiveSensorCard } from '@/components/operations/LiveSensorCard';
import { 
  Activity, ArrowLeft, ShieldAlert, Wifi, 
  ChevronUp, ChevronDown, Video, 
  Settings, Crosshair, ArrowUp, ArrowDown, ArrowRight, Link2Off, Eye
} from 'lucide-react';
import { CommandType } from '@/lib/api/commands';

export default function CommandCenterPage() {
  const { systemMode, robot, mission, safety, sensor, environment, events } = usePlatformStore();
  const { triggerCameraFocus, setFollowMode } = useRobotStore();
  
  const [bottomExpanded, setBottomExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'sensors' | 'events'>('controls');
  const [executingCommands, setExecutingCommands] = useState<Record<string, boolean>>({});
  const [estopLoading, setEstopLoading] = useState(false);

  const isOnline = robot.status === 'ONLINE';
  const isSimulated = systemMode === 'SIMULATED';
  const sourceMode = isSimulated ? 'SIMULATED' : 'LIVE';

  const handleCommand = async (cmd: CommandType, payload: any = {}) => {
    if (!isOnline) return;
    
    setExecutingCommands(prev => ({ ...prev, [cmd]: true }));
    if (cmd === 'TRIGGER_EMERGENCY_STOP' || cmd === 'CLEAR_EMERGENCY_STOP') {
      setEstopLoading(true);
    }
    
    try {
      const res = await fetch('/api/robot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `cmd-${Date.now()}`,
          type: cmd,
          timestamp: new Date().toISOString(),
          source: 'OPERATOR',
          payload
        })
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('Command Rejected:', data.reason);
      }
    } catch (err) {
      console.error('Command Error:', err);
    } finally {
      setExecutingCommands(prev => ({ ...prev, [cmd]: false }));
      if (cmd === 'TRIGGER_EMERGENCY_STOP' || cmd === 'CLEAR_EMERGENCY_STOP') {
        setEstopLoading(false);
      }
    }
  };

  const onCameraTarget = (target: string) => {
    triggerCameraFocus(target as any);
    setFollowMode(target !== 'origin');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0a0a0a', color: '#fff', overflow: 'hidden' }}>
      
      {/* SECONDARY HEADER */}
      <div style={{ height: '40px', backgroundColor: '#000', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi size={16} color="var(--good)" /> : <Link2Off size={16} color="var(--critical)" />}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>LINK:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: isOnline ? 'var(--good)' : 'var(--critical)' }}>
              {robot.status}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', marginLeft: '8px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-panel)', color: isSimulated ? 'var(--accent)' : 'var(--text-muted)' }}>
              {systemMode}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
            <ShieldAlert size={16} color={safety.emergencyStateActive ? 'var(--critical)' : safety.level === 'WARNING' ? 'var(--warning)' : 'var(--good)'} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>SAFETY:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: safety.emergencyStateActive ? 'var(--critical)' : safety.level === 'WARNING' ? 'var(--warning)' : 'var(--good)' }}>
              {safety.level}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={{
              padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, borderRadius: '4px', cursor: (estopLoading || !isOnline) ? 'not-allowed' : 'pointer',
              backgroundColor: safety.emergencyStateActive ? '#dc2626' : '#450a0a',
              color: safety.emergencyStateActive ? '#fff' : '#ef4444',
              border: `1px solid ${safety.emergencyStateActive ? 'transparent' : '#7f1d1d'}`,
              transition: 'all 0.2s'
            }}
            onClick={() => handleCommand('TRIGGER_EMERGENCY_STOP')}
            disabled={estopLoading || !isOnline}
          >
            {estopLoading ? 'SENDING...' : (safety.emergencyStateActive ? 'E-STOP ACTIVE' : 'E-STOP')}
          </button>
          {safety.emergencyStateActive && (
            <button 
              style={{ padding: '6px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, borderRadius: '4px', cursor: (estopLoading || !isOnline) ? 'not-allowed' : 'pointer', backgroundColor: '#262626', color: '#d4d4d4', border: 'none' }}
              onClick={() => handleCommand('CLEAR_EMERGENCY_STOP')}
              disabled={estopLoading || !isOnline}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* CENTER: Digital Twin */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: '#171717' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '8px' }}>
             <button onClick={() => onCameraTarget('robot')} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#d4d4d4', padding: '6px 12px', borderRadius: '4px', border: '1px solid #404040', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
               <Video size={14}/> FOCUS ROBOT
             </button>
             <button onClick={() => onCameraTarget('cut')} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#d4d4d4', padding: '6px 12px', borderRadius: '4px', border: '1px solid #404040', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>
               <Crosshair size={14}/> FOCUS CUT
             </button>
          </div>
          
          <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
             <DigitalTwin />
          </div>
        </div>

        {/* RIGHT SIDEBAR: Telemetry Summary */}
        <div style={{ width: '320px', backgroundColor: '#000', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto', zIndex: 10 }}>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Robot State */}
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity size={14} /> Core State
              </h4>
              <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>CONNECTION</span>
                  <span style={{ fontWeight: 700, color: isOnline ? 'var(--good)' : 'var(--critical)' }}>{robot.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>POWER VOLT</span>
                  <span style={{ color: '#d4d4d4' }}>{robot.powerVoltage ? `${robot.powerVoltage.toFixed(1)}V` : 'UNKNOWN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>POWER CURR</span>
                  <span style={{ color: '#d4d4d4' }}>{robot.powerCurrent ? `${robot.powerCurrent.toFixed(1)}A` : 'UNKNOWN'}</span>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Crosshair size={14} /> Active Mission
              </h4>
              <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>MISSION ID</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{mission?.id ? mission.id.substring(0,8) : 'NONE'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SHIP</span>
                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', textAlign: 'right' }}>{mission?.shipName || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SECTION</span>
                  <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px', textAlign: 'right' }}>{mission?.hullSection || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>STATUS</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{mission?.status || 'NO ACTIVE MISSION'}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--bg-dark)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                  <div style={{ backgroundColor: 'var(--accent)', height: '100%', transition: 'all 0.5s', width: `${mission?.progressPercentage || 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* Safety & Permissions */}
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <ShieldAlert size={14} /> Safety & Permissions
              </h4>
              <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SYSTEM LEVEL</span>
                  <span style={{ fontWeight: 700, color: safety.level === 'NORMAL' ? 'var(--good)' : 'var(--critical)' }}>{safety.level || 'UNKNOWN'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>MOVEMENT</span>
                  <span style={{ color: safety.movementPermission ? 'var(--good)' : 'var(--critical)' }}>{safety.movementPermission ? 'GRANTED' : 'BLOCKED'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>TORCH</span>
                  <span style={{ color: safety.torchPermission ? 'var(--good)' : 'var(--critical)' }}>{safety.torchPermission ? 'GRANTED' : 'BLOCKED'}</span>
                </div>
                {safety.activeHazards?.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', color: 'var(--critical)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>ACTIVE HAZARDS:</div>
                    {safety.activeHazards.map((h: any) => (
                      <div key={h.id} style={{ fontSize: '10px', wordBreak: 'break-word', lineHeight: 1.2, marginBottom: '4px' }}>- {h.description}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Health / Diagnostics */}
            <div>
              <h4 style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Settings size={14} /> Robot Health
              </h4>
              <div style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px', fontSize: '12px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>MOTORS</span>
                  <span style={{ color: sensor.motors?.tempLeft > 60 || sensor.motors?.tempRight > 60 ? 'var(--warning)' : 'var(--good)' }}>OK</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SENSORS</span>
                  <span style={{ color: 'var(--good)' }}>OK</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>END EFFECTOR</span>
                  <span style={{ color: 'var(--good)' }}>OK</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* BOTTOM PANEL */}
      <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: '#000', display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'all 0.3s', height: bottomExpanded ? '256px' : '40px' }}>
        <div style={{ height: '40px', padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bg-panel)' }}>
          <div style={{ display: 'flex', height: '100%' }}>
            <button 
              style={{ height: '100%', padding: '0 16px', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: `2px solid ${activeTab === 'controls' && bottomExpanded ? 'var(--accent)' : 'transparent'}`, backgroundColor: 'transparent', color: activeTab === 'controls' && bottomExpanded ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => { setActiveTab('controls'); setBottomExpanded(true); }}
            >
              Control Panel
            </button>
            <button 
              style={{ height: '100%', padding: '0 16px', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: `2px solid ${activeTab === 'sensors' && bottomExpanded ? 'var(--accent)' : 'transparent'}`, backgroundColor: 'transparent', color: activeTab === 'sensors' && bottomExpanded ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => { setActiveTab('sensors'); setBottomExpanded(true); }}
            >
              Sensor Streams
            </button>
            <button 
              style={{ height: '100%', padding: '0 16px', fontSize: '10px', fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: `2px solid ${activeTab === 'events' && bottomExpanded ? 'var(--accent)' : 'transparent'}`, backgroundColor: 'transparent', color: activeTab === 'events' && bottomExpanded ? '#fff' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => { setActiveTab('events'); setBottomExpanded(true); }}
            >
              Event History
            </button>
          </div>
          <button 
            style={{ color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', padding: '8px', cursor: 'pointer' }}
            onClick={() => setBottomExpanded(!bottomExpanded)}
          >
            {bottomExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        
        {bottomExpanded && (
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative', backgroundColor: '#000' }}>
            
            {/* TAB: CONTROLS */}
            {activeTab === 'controls' && (
              <div style={{ height: '100%', padding: '16px', display: 'flex', gap: '32px', overflowX: 'auto', fontFamily: 'var(--font-mono)', alignItems: 'flex-start', opacity: !isOnline ? 0.5 : 1, pointerEvents: !isOnline ? 'none' : 'auto' }}>
                
                {/* Movement */}
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Base Movement</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button 
                      className="dpad-btn"
                      onMouseDown={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: 1, trackOffsetDelta: 0})}
                      onMouseUp={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: 0, trackOffsetDelta: 0})}
                      disabled={!isOnline || !safety.movementPermission || executingCommands['UPDATE_LOCOMOTION']}
                    ><ArrowUp size={16}/></button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="dpad-btn"
                        onMouseDown={() => handleCommand('UPDATE_LOCOMOTION', {x: -1, y: 0, trackOffsetDelta: 0})}
                        onMouseUp={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: 0, trackOffsetDelta: 0})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['UPDATE_LOCOMOTION']}
                      ><ArrowLeft size={16}/></button>
                      <button 
                        className="dpad-btn"
                        onMouseDown={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: -1, trackOffsetDelta: 0})}
                        onMouseUp={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: 0, trackOffsetDelta: 0})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['UPDATE_LOCOMOTION']}
                      ><ArrowDown size={16}/></button>
                      <button 
                        className="dpad-btn"
                        onMouseDown={() => handleCommand('UPDATE_LOCOMOTION', {x: 1, y: 0, trackOffsetDelta: 0})}
                        onMouseUp={() => handleCommand('UPDATE_LOCOMOTION', {x: 0, y: 0, trackOffsetDelta: 0})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['UPDATE_LOCOMOTION']}
                      ><ArrowRight size={16}/></button>
                    </div>
                  </div>
                </div>

                {/* Arm */}
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Arm Control</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <button 
                      className="dpad-btn"
                      onClick={() => handleCommand('SET_ARM_POSITION', {xExtension: sensor.hardware?.armExtensionX || 0, yPosition: (sensor.hardware?.armExtensionY || 0) + 0.1})}
                      disabled={!isOnline || !safety.movementPermission || executingCommands['SET_ARM_POSITION']}
                    ><ArrowUp size={16}/></button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        className="dpad-btn"
                        onClick={() => handleCommand('SET_ARM_POSITION', {xExtension: (sensor.hardware?.armExtensionX || 0) - 0.1, yPosition: sensor.hardware?.armExtensionY || 0})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['SET_ARM_POSITION']}
                      ><ArrowLeft size={16}/></button>
                      <button 
                        className="dpad-btn"
                        onClick={() => handleCommand('SET_ARM_POSITION', {xExtension: sensor.hardware?.armExtensionX || 0, yPosition: (sensor.hardware?.armExtensionY || 0) - 0.1})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['SET_ARM_POSITION']}
                      ><ArrowDown size={16}/></button>
                      <button 
                        className="dpad-btn"
                        onClick={() => handleCommand('SET_ARM_POSITION', {xExtension: (sensor.hardware?.armExtensionX || 0) + 0.1, yPosition: sensor.hardware?.armExtensionY || 0})}
                        disabled={!isOnline || !safety.movementPermission || executingCommands['SET_ARM_POSITION']}
                      ><ArrowRight size={16}/></button>
                    </div>
                  </div>
                </div>

                {/* Effectors */}
                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, minWidth: '192px' }}>
                  <h4 style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>End Effectors</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      style={{
                        width: '100%', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: robot.torchEnabled ? '#f97316' : 'var(--bg-panel)',
                        color: robot.torchEnabled ? '#fff' : 'var(--text-muted)',
                        borderColor: robot.torchEnabled ? '#fb923c' : 'var(--border-color)'
                      }}
                      onClick={() => handleCommand('SET_TORCH', {enabled: !robot.torchEnabled})}
                      disabled={!isOnline || !safety.torchPermission || executingCommands['SET_TORCH']}
                    >
                      {robot.torchEnabled ? 'TORCH ACTIVE' : 'IGNITE TORCH'}
                    </button>
                    <button 
                      style={{
                        width: '100%', padding: '10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700, border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                        backgroundColor: robot.electromagnetEnabled ? '#059669' : 'var(--bg-panel)',
                        color: robot.electromagnetEnabled ? '#fff' : 'var(--text-muted)',
                        borderColor: robot.electromagnetEnabled ? '#10b981' : 'var(--border-color)'
                      }}
                      onClick={() => handleCommand('SET_ELECTROMAGNET', {enabled: !robot.electromagnetEnabled})}
                      disabled={!isOnline || executingCommands['SET_ELECTROMAGNET']}
                    >
                      {robot.electromagnetEnabled ? 'MAGNET ENGAGED' : 'ENGAGE MAGNET'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SENSORS */}
            {activeTab === 'sensors' && (
              <div style={{ height: '100%', padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  <LiveSensorCard label="Power Voltage" value={robot.powerVoltage?.toFixed(1)} unit="V" status={robot.powerVoltage < 22 ? 'CRITICAL' : 'NORMAL'} sourceMode={sourceMode} />
                  <LiveSensorCard label="Power Current" value={robot.powerCurrent?.toFixed(1)} unit="A" status={robot.powerCurrent > 50 ? 'WARNING' : 'NORMAL'} sourceMode={sourceMode} />
                  <LiveSensorCard label="L Motor Temp" value={sensor.motors?.tempLeft?.toFixed(0)} unit="C" status={sensor.motors?.tempLeft > 60 ? 'WARNING' : 'NORMAL'} sourceMode={sourceMode} />
                  <LiveSensorCard label="R Motor Temp" value={sensor.motors?.tempRight?.toFixed(0)} unit="C" status={sensor.motors?.tempRight > 60 ? 'WARNING' : 'NORMAL'} sourceMode={sourceMode} />
                  
                  <LiveSensorCard label="Oxy Pressure" value={sensor.gas?.oxyPressurePsi?.toFixed(1)} unit="psi" status="NORMAL" sourceMode={sourceMode} />
                  <LiveSensorCard label="Ace Pressure" value={sensor.gas?.acePressurePsi?.toFixed(1)} unit="psi" status="NORMAL" sourceMode={sourceMode} />
                  <LiveSensorCard label="Mag Current" value={sensor.hardware?.electromagnetCurrent?.toFixed(1)} unit="A" status="NORMAL" sourceMode={sourceMode} />
                  <LiveSensorCard label="Torch State" value={sensor.gas?.torchStatus} unit="" status="NORMAL" sourceMode={sourceMode} />

                  <LiveSensorCard label="Env Temp" value={environment.temperatureC?.toFixed(1)} unit="C" status="NORMAL" sourceMode={sourceMode} />
                  <LiveSensorCard label="Env Humidity" value={environment.humidityPercentage?.toFixed(0)} unit="%" status="NORMAL" sourceMode={sourceMode} />
                  <LiveSensorCard label="Combustible Gas" value={environment.combustibleGasLel?.toFixed(1)} unit="%LEL" status={environment.combustibleGasLel > 10 ? 'CRITICAL' : 'NORMAL'} sourceMode={sourceMode} />
                  <LiveSensorCard label="Wind Speed" value={environment.windSpeedKmh?.toFixed(1)} unit="km/h" status="NORMAL" sourceMode={sourceMode} />
                </div>
              </div>
            )}

            {/* TAB: EVENTS */}
            {activeTab === 'events' && (
              <div style={{ height: '100%', padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {events.map((ev: any, i: number) => (
                  <div key={ev.id || i} style={{
                    padding: '6px', borderLeft: '2px solid',
                    borderColor: ev.severity === 'CRITICAL' ? '#ef4444' : ev.severity === 'WARNING' ? '#f59e0b' : '#404040',
                    color: ev.severity === 'CRITICAL' ? '#f87171' : ev.severity === 'WARNING' ? '#fbbf24' : '#a3a3a3',
                    backgroundColor: ev.severity === 'CRITICAL' ? 'rgba(69, 10, 10, 0.2)' : ev.severity === 'WARNING' ? 'rgba(69, 26, 3, 0.2)' : 'transparent'
                  }}>
                    <span style={{ opacity: 0.5, marginRight: '8px' }}>[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
                    <span style={{ fontWeight: 700, marginRight: '8px' }}>[{ev.category}]</span>
                    {ev.message}
                  </div>
                ))}
                {events.length === 0 && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No events recorded.</div>}
              </div>
            )}
          </div>
        )}
      </footer>
      <style dangerouslySetInnerHTML={{__html: `
        .dpad-btn {
          width: 48px; height: 40px; background-color: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-muted); transition: all 0.2s;
        }
        .dpad-btn:hover { background-color: var(--border-color); }
        .dpad-btn:active { background-color: var(--accent); color: #000; }
        .dpad-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}} />
    </div>
  );
}
