# Phase 1: Adafruit IO & RoboFest Integration (Hardware Telemetry)

## Architecture Overview
The RoboFest application is now the single authoritative source of truth. The new server-side telemetry pipeline directly connects to Adafruit IO, bypassing the deprecated `ship-cutter-original` application. 

**Data Flow:**
1. Physical ESP32 hardware publishes MQTT data directly to Adafruit IO.
2. `AdafruitTelemetryProvider` (Node.js backend in RoboFest) polls the Adafruit IO REST API every 3500ms.
3. The adapter maps the 4 physical feeds (`temperature`, `ultrasonic`, `thermal-camera`, `gas-ppm`) to the normalized RoboFest telemetry structure (`EnvironmentState` and `HardwareData`).
4. `evaluateSafetyState()` is executed synchronously to verify the safety rules (e.g., combustible gas thresholds).
5. A system-wide `LIVE_TELEMETRY_TICK` event is broadcast via the `realtimeBroker` Server-Sent Events (SSE) system.
6. A `TelemetryRecord` is written to the SQLite database (via Prisma) and `evaluateSystemHealth()` is called for persistence.
7. The browser-side `RealtimeProvider` receives the event and hydrates the Zustand `platformStore`, immediately updating the Live Operations UI and the 3D Digital Twin.

## Feed Mapping
| Adafruit IO Feed | RoboFest Telemetry Mapping | Fallback Value (DEMO Mode) |
|------------------|----------------------------|----------------------------|
| `temperature`    | `environment.temperatureC` | 25°C + random fuzzing      |
| `ultrasonic`     | `hardware.armExtensionY`   | 3.5mm + random fuzzing     |
| `thermal-camera` | (Used for liveness/logging)| N/A                        |
| `gas-ppm`        | `environment.combustibleGasLel` | 0 + random fuzzing |

## Environment Variables
Credentials are now stored securely server-side and are **never** exposed to the browser. 
Add the following to your `.env` file:
```env
# Adafruit IO Telemetry Integration
AIO_USERNAME="your_adafruit_username"
AIO_KEY="your_secure_aio_key"
```

## LIVE vs DEMO Behavior
- **LIVE Mode**: Automatically activates if `AIO_USERNAME` and `AIO_KEY` are present. It establishes a real network connection to Adafruit IO.
- **DEMO / FALLBACK Mode**: Automatically activates if credentials are missing or the network is unreachable. The provider smoothly transitions to emitting bounded, stable baseline telemetry so that the Digital Twin and UI remain functional without spamming the database with duplicate records. 

## Failure Behavior
- **Network Timeout / API Error**: The provider catches errors without crashing. The channel's availability flag (`status.channels.temperature`, etc.) turns to `false`. The system will automatically fall back to the safe baseline values for missing channels.
- **Malformed Data**: Handled safely. If `parseFloat()` returns `NaN`, the system ignores the data point and falls back safely.

## Safety Authority
We **did not** duplicate the safety logic. The adapter feeds directly into RoboFest's existing, unified `evaluateSafetyState()` and `evaluateSystemHealth()` engines. RoboFest remains the sole decision-maker for triggering an Emergency Stop based on gas concentration limits or critical temperatures.

## Testing Performed
Automated tests (`jest src/lib/telemetry/adafruitProvider.test.ts`) were added to verify:
- Missing credentials seamlessly start the provider in `DEMO` mode.
- Valid Adafruit data perfectly merges into the Real-time Event pipeline (`LIVE_TELEMETRY_TICK`).
- The Adafruit API `fetch` handles network errors gracefully without crashing the server.
- Malformed numerical strings from Adafruit feeds are safely rejected.
- Duplicate initialization bugs are prevented by the `setInterval` guard.
- Absolute security: The tests confirm that the `AIO_KEY` never leaks into the broadcasted `Payload` or requested URLs.
