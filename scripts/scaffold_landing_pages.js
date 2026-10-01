const fs = require('fs');
const modules = [
  { path: 'operations', name: 'Operations', children: [
    { name: 'Command Center', path: '/command-center' },
    { name: 'Missions', path: '/operations/missions' },
    { name: 'Cutting Planner', path: '/operations/planner' },
    { name: 'AI Cut Strategy', path: '/operations/cut-strategy' }
  ]},
  { path: 'robot', name: 'Robot', children: [
    { name: 'Digital Twin', path: '/robot/twin' },
    { name: 'Sensors', path: '/robot/sensors' },
    { name: 'Robot Health', path: '/robot/health' },
    { name: 'Robot Passport', path: '/robot/passport' },
    { name: 'Vision', path: '/robot/vision' }
  ]},
  { path: 'safety', name: 'Safety', children: [
    { name: 'Safety & Hazards', path: '/safety/hazards' },
    { name: 'Weather / Site', path: '/safety/weather' },
    { name: 'Emergency Control', path: '/safety/emergency' },
    { name: 'Notifications', path: '/safety/notifications' }
  ]},
  { path: 'ship', name: 'Ship', children: [
    { name: 'Ship / Hull Map', path: '/ship/map' },
    { name: 'Internal Structure', path: '/ship/internal-structure' },
    { name: 'Digital Shipyard', path: '/ship/shipyard' }
  ]},
  { path: 'intelligence', name: 'Intelligence', children: [
    { name: 'ROBO-ASSIST', path: '/intelligence/robo-assist' },
    { name: 'Analytics', path: '/intelligence/analytics' },
    { name: 'Telemetry', path: '/intelligence/telemetry' },
    { name: 'Performance', path: '/intelligence/performance' }
  ]},
  { path: 'records', name: 'Records', children: [
    { name: 'Event History', path: '/records/history' },
    { name: 'Maintenance Log', path: '/records/maintenance' },
    { name: 'Knowledge Base', path: '/records/knowledge-base' }
  ]},
  { path: 'system', name: 'System', children: [
    { name: 'Users / Roles', path: '/system/users' },
    { name: 'Guided Demo', path: '/system/demo' }
  ]}
];

modules.forEach(mod => {
  const content = `import React from 'react';
import Link from 'next/link';

export default function ${mod.name}LandingPage() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>${mod.name}</h1>
        <p>Overview and sub-modules for ${mod.name}</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          ${mod.children.map(child => `
          <Link href="${child.path}" style={{ textDecoration: 'none' }}>
            <div className="ui-panel" style={{ cursor: 'pointer', height: '100%' }}>
              <div className="ui-panel-title">${child.name}</div>
              <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Open ${child.name} module</div>
            </div>
          </Link>
          `).join('')}
        </div>
      </main>
    </div>
  );
}
`;
  fs.writeFileSync('src/app/' + mod.path + '/page.tsx', content);
});
