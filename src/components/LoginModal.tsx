"use client";

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { telemetrySimulator, SimulationScenario } from '@/lib/telemetry';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

export function LoginModal() {
  const { status, login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // E-Stop behavior on login screen
  const [confirmingEStop, setConfirmingEStop] = useState(false);

  const handleEStop = () => {
    if (!confirmingEStop) {
      setConfirmingEStop(true);
      return;
    }
    telemetrySimulator.setScenario(SimulationScenario.EMERGENCY_STOP);
    setConfirmingEStop(false);
  };

  if (status === 'AUTHENTICATED') return null;
  if (status === 'LOADING') return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)' }}>Initializing Session...</div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'color-mix(in srgb, var(--bg-main) 90%, transparent)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '32px'
    }}>
      
      {/* E-Stop accessible during auth outage */}
      <button 
        onClick={handleEStop}
        style={{ 
          padding: '16px 32px', background: confirmingEStop ? '#da3633' : '#a40e26', 
          color: 'white', border: confirmingEStop ? '2px solid white' : '2px solid #ff7b72', borderRadius: 'var(--radius-md)', 
          fontSize: '20px', fontWeight: 800, cursor: 'pointer',
          letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: confirmingEStop ? '0 0 30px rgba(218, 54, 51, 0.8)' : '0 4px 12px rgba(164, 14, 38, 0.5)'
        }}
      >
        <ShieldAlert size={28} />
        {confirmingEStop ? 'CONFIRM EMERGENCY STOP' : 'EMERGENCY STOP (LOCAL)'}
      </button>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Lock size={24} color="var(--accent)" />
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Authentication Required</h2>
        </div>
        
        {error && (
          <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--critical) 10%, transparent)', color: 'var(--critical)', border: '1px solid var(--critical)', borderRadius: '4px', marginBottom: '20px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          const success = await login(username, password);
          if (!success) setError('Invalid username or password');
          setLoading(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>OPERATOR ID / USERNAME</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
              placeholder="e.g. admin, operator1"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ACCESS CREDENTIAL</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', background: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: '8px', padding: '12px', background: 'var(--accent)', color: 'white', 
              border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <LogIn size={18} />
            {loading ? 'AUTHENTICATING...' : 'AUTHORIZE SESSION'}
          </button>
        </form>
      </div>
    </div>
  );
}
