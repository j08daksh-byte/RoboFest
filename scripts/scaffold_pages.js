const fs = require('fs');
const routes = [
  'operations/missions','operations/planner','operations/ai-strategy',
  'robot/twin','robot/sensors','robot/health','robot/passport','robot/vision',
  'safety/hazards','safety/weather','safety/emergency','safety/notifications',
  'ship/map','ship/internal-structure','ship/shipyard',
  'intelligence/robo-assist','intelligence/analytics','intelligence/telemetry','intelligence/performance',
  'records/history','records/maintenance','records/knowledge-base',
  'system/users','system/demo'
];

routes.forEach(p => { 
  const name = p.split('/').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '); 
  const content = `import React from 'react';

export default function ${name.replace(/[^a-zA-Z]/g,'')}Page() {
  return (
    <div className="module-container">
      <header className="module-header">
        <h1>${name}</h1>
        <p>Module purpose: Placeholder for ${name}</p>
        <span className="sim-badge">SIMULATED / DEMO</span>
      </header>
      <main className="module-content">
        <div className="empty-state">
          <h2>No active data</h2>
          <p>The ${name} module is currently offline.</p>
        </div>
      </main>
    </div>
  );
}
`; 
  fs.writeFileSync('src/app/'+p+'/page.tsx', content); 
});
