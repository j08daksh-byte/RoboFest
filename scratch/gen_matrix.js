const fs = require('fs');

const content = `# ROBOFEST TO TITAN-CUT INTEGRATION MATRIX

## 1. Command Center / Live Operations
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Command Center & Real-time Operations Control |
| **CURRENT ROBOFEST ROUTE** | \`/command-center\` |
| **CURRENT ROBOFEST COMPONENT** | CommandCenterLayout, ControlPanel, TelemetryPanel |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | OperationsLivePage |
| **FINAL TITAN-CUT LOCATION** | \`/operations/live\` |
| **ACTION** | B. ROBOFEST OPERATIONAL AUTHORITY / C. SHARED UI |
| **DATA SOURCE** | RoboFest SSE & Command Transport API |
| **INTEGRATION METHOD** | Senior wraps RoboFest components; Commands proxied to RoboFest backend |
| **CLASSIFICATION** | MOVE / MERGE |
| **DEPENDENCIES** | SSE Proxy, Command proxy |
| **RISK** | High (Critical operational interface) |

*Reasoning: The Senior platform is the shell, but the operational command center requires strict connection to RoboFest real-time APIs. OperationsLivePage acts as the host.*

## 2. Digital Twin
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Digital Twin Visualization |
| **CURRENT ROBOFEST ROUTE** | \`/robot/twin\` |
| **CURRENT ROBOFEST COMPONENT** | DigitalTwin |
| **CURRENT AUTHORITY** | ROBOFEST (State) / SHARED (UI) |
| **SENIOR EQUIVALENT** | None previously (Now inside OperationsLivePage) |
| **FINAL TITAN-CUT LOCATION** | \`/operations/live\` & \`/robot/twin\` (standalone view) |
| **ACTION** | C. SHARED UI / REPRESENTATION |
| **DATA SOURCE** | RoboFest TwinState via SSE |
| **INTEGRATION METHOD** | Shared NPM Package (\`@titan/digital-twin\`) |
| **CLASSIFICATION** | MOVE (Already done in Phase 4.10) |
| **DEPENDENCIES** | TwinProvider, Asset Base URL |
| **RISK** | Low (Already isolated and proven) |

*Reasoning: The Twin is purely representational and already successfully decoupled into a shared package.*

## 3. Robot Health & Maintenance
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Robot Health Monitoring |
| **CURRENT ROBOFEST ROUTE** | \`/robot/health\` |
| **CURRENT ROBOFEST COMPONENT** | HealthDashboard, Diagnostics |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | MaintenancePage |
| **FINAL TITAN-CUT LOCATION** | \`/maintenance\` |
| **ACTION** | D. MERGE |
| **DATA SOURCE** | RoboFest Telemetry API (Health) + Senior DB (Maintenance Logs) |
| **INTEGRATION METHOD** | Merge RoboFest live health diagnostics into Senior's historical MaintenancePage |
| **CLASSIFICATION** | MERGE |
| **DEPENDENCIES** | RoboFest health proxy, Senior DB |
| **RISK** | Medium |

*Reasoning: Senior tracks historical maintenance (business authority) while RoboFest tracks real-time diagnostic health (operational authority). They must be merged.*

## 4. Telemetry & Sensors
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Live Telemetry & Sensor Data |
| **CURRENT ROBOFEST ROUTE** | \`/intelligence/telemetry\` & \`/robot/sensors\` |
| **CURRENT ROBOFEST COMPONENT** | TelemetryGraphs, SensorReadouts |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | SensorsPage |
| **FINAL TITAN-CUT LOCATION** | \`/sensors\` |
| **ACTION** | D. MERGE / REPLACE |
| **DATA SOURCE** | RoboFest SSE & Telemetry API |
| **INTEGRATION METHOD** | Replace mock Senior sensor data with live RoboFest SSE feeds |
| **CLASSIFICATION** | REPLACE (Senior mock data) / MOVE (RoboFest UI widgets) |
| **DEPENDENCIES** | SSE Proxy, Historical telemetry DB |
| **RISK** | Low |

*Reasoning: Senior's current SensorsPage relies on mock/static data. RoboFest provides the actual operational telemetry stream.*

## 5. Mission Planning & Cutting Strategy
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Mission Planner & Cut Strategy |
| **CURRENT ROBOFEST ROUTE** | \`/operations/missions\`, \`/operations/cut-strategy\`, \`/operations/planner\` |
| **CURRENT ROBOFEST COMPONENT** | MissionPlanner, PathGenerator |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | ShipsPage, PartTrackingPage |
| **FINAL TITAN-CUT LOCATION** | \`/missions\` |
| **ACTION** | B. ROBOFEST OPERATIONAL AUTHORITY |
| **DATA SOURCE** | RoboFest Cutting Engine |
| **INTEGRATION METHOD** | Proxy mission generation requests to RoboFest backend |
| **CLASSIFICATION** | MOVE |
| **DEPENDENCIES** | RoboFest Mission API |
| **RISK** | High |

*Reasoning: Mission execution and cut-path planning are core operational capabilities owned strictly by the RoboFest cutting engine.*

## 6. Event History & Records
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Operational Event History |
| **CURRENT ROBOFEST ROUTE** | \`/records/history\` |
| **CURRENT ROBOFEST COMPONENT** | EventTimeline |
| **CURRENT AUTHORITY** | ROBOFEST (generation) / SENIOR (storage) |
| **SENIOR EQUIVALENT** | HistoryPage |
| **FINAL TITAN-CUT LOCATION** | \`/history\` |
| **ACTION** | D. MERGE |
| **DATA SOURCE** | Senior DB + RoboFest Event API |
| **INTEGRATION METHOD** | Route RoboFest events to Senior's central business event database |
| **CLASSIFICATION** | MERGE |
| **DEPENDENCIES** | Unified logging pipeline |
| **RISK** | Medium |

*Reasoning: RoboFest generates operational events, but Senior must act as the unified business ledger for auditing and historical records.*

## 7. Safety & Emergency Stop
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Safety Hazards & Emergency Stop |
| **CURRENT ROBOFEST ROUTE** | \`/safety/emergency\`, \`/safety/hazards\` |
| **CURRENT ROBOFEST COMPONENT** | EStopButton, SafetyDashboard |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | None |
| **FINAL TITAN-CUT LOCATION** | Global Header (E-Stop) & \`/safety\` |
| **ACTION** | B. ROBOFEST OPERATIONAL AUTHORITY |
| **DATA SOURCE** | RoboFest Safety Engine |
| **INTEGRATION METHOD** | Global E-Stop component integrated into Senior shell; proxy to RoboFest safety API |
| **CLASSIFICATION** | MOVE |
| **DEPENDENCIES** | Zero-latency proxy for E-stop |
| **RISK** | Critical (Life-safety boundary) |

*Reasoning: Safety relies on RoboFest hardware authority. The UI must be hosted in Senior but bypass all business logic directly to the RoboFest safety engine.*

## 8. AI & ROBO-ASSIST
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | ROBO-ASSIST & Vision AI |
| **CURRENT ROBOFEST ROUTE** | \`/intelligence/robo-assist\`, \`/robot/vision\` |
| **CURRENT ROBOFEST COMPONENT** | ChatInterface, VisionFeed |
| **CURRENT AUTHORITY** | ROBOFEST |
| **SENIOR EQUIVALENT** | ChatbotPage |
| **FINAL TITAN-CUT LOCATION** | \`/ai-assistant\` |
| **ACTION** | D. MERGE |
| **DATA SOURCE** | RoboFest AI endpoints |
| **INTEGRATION METHOD** | Upgrade Senior ChatbotPage to utilize Robo-Assist operational knowledge |
| **CLASSIFICATION** | MERGE |
| **DEPENDENCIES** | AI API proxy |
| **RISK** | Low |

*Reasoning: Senior has a basic chatbot. RoboFest has operational AI. They should be merged into a single AI assistant interface.*

## 9. Analytics & Performance
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | Operational Analytics |
| **CURRENT ROBOFEST ROUTE** | \`/intelligence/analytics\`, \`/intelligence/performance\` |
| **CURRENT ROBOFEST COMPONENT** | AnalyticsDashboard |
| **CURRENT AUTHORITY** | SENIOR |
| **SENIOR EQUIVALENT** | DashboardPage |
| **FINAL TITAN-CUT LOCATION** | \`/dashboard\` |
| **ACTION** | A. SENIOR NATIVE |
| **DATA SOURCE** | Senior DB (Aggregated metrics) |
| **INTEGRATION METHOD** | Rebuild analytics natively in Senior using historical data from DB |
| **CLASSIFICATION** | REPLACE / REMOVE (RoboFest standalone analytics) |
| **DEPENDENCIES** | Data aggregation pipeline |
| **RISK** | Low |

*Reasoning: Analytics and business intelligence are Senior authority. RoboFest's local analytics should be removed and rebuilt inside Senior's DashboardPage.*

## 10. System Administration (Users / Auth)
| Property | Value |
| --- | --- |
| **ROBOFEST FEATURE** | User Management & Auth |
| **CURRENT ROBOFEST ROUTE** | \`/system/users\` |
| **CURRENT ROBOFEST COMPONENT** | UserList, AuthProvider |
| **CURRENT AUTHORITY** | SENIOR |
| **SENIOR EQUIVALENT** | None (Currently implicit in Senior) |
| **FINAL TITAN-CUT LOCATION** | \`/settings/users\` |
| **ACTION** | A. SENIOR NATIVE |
| **DATA SOURCE** | Senior DB |
| **INTEGRATION METHOD** | Senior manages all users and authentication |
| **CLASSIFICATION** | REMOVE (RoboFest Auth) / REPLACE |
| **DEPENDENCIES** | Senior Authentication |
| **RISK** | Medium |

*Reasoning: Auth and identity are purely business platform responsibilities. RoboFest should not manage its own users in the final platform.*

## 11. INTEGRATION GAPS (STEP 8)
The following elements still require active integration to complete the TITAN-CUT platform:

- **API Integration**: Senior must proxy operational requests (e.g., start mission, emergency stop) to the RoboFest backend securely.
- **SSE/Realtime Integration**: The unified \`/operations/live\` page must consume the RoboFest SSE data streams via the Senior gateway proxy (already mocked out but needs actual hardware/engine data).
- **Shared State Adapter**: The RoboFest \`robotState\` and \`plannerStore\` must be exposed via an adapter for Senior to display live metrics without duplicating state logic.
- **UI Reconstruction**: Analytics and Performance dashboards from RoboFest must be rebuilt natively in Senior using the DashboardPage design language.
- **Data Contracts**: Define strict schemas for how Senior queries RoboFest for robot history vs business history.
- **Authentication/Security**: Secure the API gateway between Senior and RoboFest; prevent \`ROBOFEST_SERVICE_TOKEN\` from reaching the client browser.
- **Asset Handling**: Assets (like 3D models) are correctly bounded via the shared package now, but user-uploaded blueprints must be managed by Senior.
- **Command Proxy**: Ensure all robot commands (move, cut, reset) pass through Senior's unified authentication and logging before reaching RoboFest.
- **Safety Boundary**: E-Stop actions must bypass standard queuing and immediately reach the RoboFest hardware transport.

## 12. ISOLATION BOUNDARY (STEP 9)
The following RoboFest code MUST NOT be copied or imported into Senior. Senior must only consume their outputs via API or shared UI packages:

- **Operational Stores** (\`robotState.ts\`, \`platformStore.ts\`, \`plannerStore.ts\`)
- **Safety Engine** (All E-Stop and hardware limit logic)
- **Cutting Engine** (Path generation, IK, torch control)
- **Hardware Transport** (Serial/TCP connections to the physical robot)
- **Command Execution** (The actual command queue and execution loop)
- **SimulationController** (The simulated hardware loop)
- **Backend Operational APIs** (The direct Next.js API routes in RoboFest)

*Reasoning: These systems are highly coupled to the operational execution environment. Duplicating them in Senior would create a split-brain architecture. Senior will consume their state via SSE and send commands via proxy APIs.*

## 13. PHASE 5 ROADMAP (STEP 10)
**PHASE 5.1: Unified Navigation & Shell**
- Restructure Senior's Sidebar to match the new TITAN-CUT navigation map.
- Create placeholders for merged pages (Missions, Safety, Robot Health).

**PHASE 5.2: Command Center & Telemetry Integration**
- Integrate RoboFest's Command Center components into \`/operations/live\`.
- Connect the Senior SSE Gateway to RoboFest's realtime telemetry endpoints.
- Validate live telemetry flows into the Dashboard and Twin without breaking the boundary.

**PHASE 5.3: Safety & Robot Health**
- Integrate the Global E-Stop into the Senior header.
- Merge RoboFest health diagnostics into Senior's Maintenance page.
- Establish the zero-latency safety proxy.

**PHASE 5.4: Missions & Cutting Execution**
- Port the RoboFest Mission Planner UI into Senior.
- Wire up the command proxy for generating and executing cuts.
- Validate end-to-end mission workflows from the Senior interface.

**PHASE 5.5: AI & Analytics Polish**
- Merge ROBO-ASSIST into the Senior Chatbot page.
- Rebuild Analytics dashboards natively in Senior.
- Finalize unified event history logging.
`;

if (!fs.existsSync('D:\\\\Webs\\\\ship-cutter\\\\docs')) {
  fs.mkdirSync('D:\\\\Webs\\\\ship-cutter\\\\docs', { recursive: true });
}
fs.writeFileSync('D:\\\\Webs\\\\ship-cutter\\\\docs\\\\ROBOFEST_TO_TITAN_INTEGRATION_MATRIX.md', content);
console.log('Matrix generated');
