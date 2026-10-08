const fs = require('fs');

const content = `# TITAN-CUT FINAL NAVIGATION ARCHITECTURE

This document outlines the unified navigation hierarchy for the TITAN-CUT platform, merging Senior's business logic with RoboFest's operational capabilities into a single, cohesive user experience.

## GLOBAL HEADER
- **Platform Identity**: TITAN-CUT Logo & Project Context
- **Global Search**: Search across ships, parts, and events
- **User Profile**: Auth managed natively by Senior
- **CRITICAL E-STOP**: Global hardware emergency stop button (Red, always visible, zero-latency proxy to RoboFest)

## SIDEBAR NAVIGATION HIERARCHY

### 1. Operations (Primary)
- **Live Dashboard** (\`/operations/live\`)
  - *The central command center. Wraps RoboFest Command Center components. Incorporates the shared Digital Twin (\`@titan/digital-twin\`).*
- **Missions** (\`/operations/missions\`)
  - *Mission planning, path generation, and execution. Proxies to RoboFest cutting engine.*
- **Sensors & Telemetry** (\`/operations/sensors\`)
  - *Live data streams from the physical robot. Replaces Senior mock data with RoboFest SSE.*

### 2. Fleet & Assets (Business)
- **Active Projects** (\`/ships\`)
  - *Senior native. Tracks vessels being decommissioned.*
- **Materials Tracking** (\`/materials\`)
  - *Senior native. Tracks salvaged materials.*
- **Part Tracking** (\`/parts\`)
  - *Senior native. Tracks cut parts through the supply chain.*

### 3. Maintenance & Safety (Shared)
- **Robot Health** (\`/maintenance/health\`)
  - *Live diagnostics (RoboFest) merged with historical maintenance logs (Senior).*
- **Safety Logs** (\`/maintenance/safety\`)
  - *Hazard tracking, weather limits, and E-Stop audit trails.*

### 4. Intelligence & Records (Merged)
- **AI Assistant** (\`/intelligence/ai\`)
  - *Merges Senior's Chatbot with RoboFest's ROBO-ASSIST operational knowledge.*
- **Event History** (\`/intelligence/history\`)
  - *Unified timeline of business events (Senior) and operational hardware events (RoboFest).*
- **Analytics** (\`/intelligence/analytics\`)
  - *Business Intelligence dashboards built natively in Senior using aggregated metrics.*

### 5. Settings (Platform)
- **User Management** (\`/settings/users\`)
  - *Senior native authentication and RBAC. Replaces RoboFest Auth.*
- **System Configuration** (\`/settings/config\`)
  - *API keys, integration settings, and environment variables.*

---

## WORKFLOW DEFINITIONS

### Mission Workflow
1. **Selection**: User selects a project and hull section in \`/ships\`.
2. **Planning**: User generates a cut-path in \`/operations/missions\` (handled by RoboFest engine).
3. **Execution**: User confirms mission. Context shifts to \`/operations/live\` (Command Center).
4. **Monitoring**: User monitors the physical cut using the Digital Twin and Telemetry modules in the Live Dashboard.
5. **Completion**: A business event is recorded in \`/intelligence/history\` and part is registered in \`/parts\`.

### Safety Workflow
1. **Trigger**: User hits the Global E-Stop button in the header.
2. **Proxy**: The command bypasses standard queues and hits the RoboFest safety API.
3. **Execution**: The robot immediately halts.
4. **Broadcast**: An SSE event broadcasts the E-Stop state to the Digital Twin (red safety cables) and Command Center.
5. **Audit**: An entry is logged in \`/maintenance/safety\`.
`;

fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\docs\\\\TITAN_CUT_FINAL_NAVIGATION.md', content);
console.log('Nav generated');
