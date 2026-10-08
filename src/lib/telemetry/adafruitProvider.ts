import { realtimeBroker } from '../realtime/broker';
import { evaluateSafetyState } from '../safety/safetyEngine';
import { evaluateSystemHealth } from '../health/healthEngine';
import { prisma } from '../prisma';
import { SCENARIO_DEFINITIONS, SimulationScenario } from './scenarios';
import { SystemMode, EventCategory, SystemEvent, TelemetrySample, SensorState, EnvironmentState } from '../domain';
import { PlatformTelemetry } from '../transport/domain';

export type TelemetrySourceStatus = 'ADAFRUIT_IO' | 'DEMO' | 'DISCONNECTED';

class AdafruitTelemetryProvider {
  private timer: NodeJS.Timeout | null = null;
  private status: TelemetrySourceStatus = 'DISCONNECTED';
  private lastSuccessfulRead: number = 0;

  // Track availability per channel
  private channels = {
    temperature: false,
    ultrasonic: false,
    thermalCamera: false,
    gasPpm: false
  };

  public getStatus() {
    return {
      status: this.status,
      lastSuccessfulRead: this.lastSuccessfulRead ? new Date(this.lastSuccessfulRead).toISOString() : null,
      channels: this.channels
    };
  }

  public start() {
    if (this.timer) return; // Prevent duplicate loops

    const username = process.env.AIO_USERNAME;
    const key = process.env.AIO_KEY;

    if (!username || !key) {
      console.log('[AdafruitProvider] AIO_USERNAME or AIO_KEY not found. Starting in DEMO/FALLBACK mode.');
      this.status = 'DEMO';
    } else {
      console.log(`[AdafruitProvider] Adafruit IO configured for user ${username}. Starting in ADAFRUIT_IO mode.`);
      this.status = 'ADAFRUIT_IO';
    }

    this.timer = setInterval(() => this.tick(), 3500);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.status = 'DISCONNECTED';
  }

  private async fetchFeed(feedKey: string, username: string, key: string): Promise<number | null> {
    try {
      const res = await fetch(`https://io.adafruit.com/api/v2/${username}/feeds/${feedKey}/data?limit=1`, {
        headers: { 'X-AIO-Key': key }
      });
      if (!res.ok) {
        return null;
      }
      const data = await res.json();
      if (data && data.length > 0) {
        const val = parseFloat(data[0].value);
        return isNaN(val) ? null : val;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  private async tick() {
    const isLive = this.status === 'ADAFRUIT_IO';
    let tempC: number | null = null;
    let ultrasonicDist: number | null = null;
    let thermalTemp: number | null = null;
    let gasPpm: number | null = null;

    if (isLive) {
      const username = process.env.AIO_USERNAME!;
      const key = process.env.AIO_KEY!;
      
      const [rTemp, rUlt, rTherm, rGas] = await Promise.all([
        this.fetchFeed('temperature', username, key),
        this.fetchFeed('ultrasonic', username, key),
        this.fetchFeed('thermal-camera', username, key),
        this.fetchFeed('gas-ppm', username, key)
      ]);

      tempC = rTemp;
      ultrasonicDist = rUlt;
      thermalTemp = rTherm;
      gasPpm = rGas;

      this.channels.temperature = tempC !== null;
      this.channels.ultrasonic = ultrasonicDist !== null;
      this.channels.thermalCamera = thermalTemp !== null;
      this.channels.gasPpm = gasPpm !== null;

      if (tempC !== null || ultrasonicDist !== null || thermalTemp !== null || gasPpm !== null) {
        this.lastSuccessfulRead = Date.now();
      }
    }

    // Blend into the base scenario to ensure we have all required fields for the UI/Twin
    const baseDef = SCENARIO_DEFINITIONS[SimulationScenario.NORMAL_OPERATION];
    
    // Add small random fuzzing to demo data if we don't have real data
    const fuzz = () => (Math.random() - 0.5) * 0.2;

    const finalTemp = tempC !== null ? tempC : (baseDef.env!.temperatureC || 25) + fuzz();
    const finalGas = gasPpm !== null ? gasPpm : (baseDef.env!.combustibleGasLel || 0) + (Math.random() * 0.5);
    const finalUltrasonic = ultrasonicDist !== null ? ultrasonicDist : 3.5 + fuzz(); // 3.5 mm

    // Build normalized sensor and environment state
    const newSensor: SensorState = {
      metadata: { 
        isSimulated: !isLive, 
        isStale: isLive && (Date.now() - this.lastSuccessfulRead > 10000), 
        lastUpdated: new Date().toISOString() 
      },
      motors: { ...baseDef.sensor!.motors! },
      imu: { ...baseDef.sensor!.imu! },
      hardware: {
        ...baseDef.sensor!.hardware!,
        armExtensionY: finalUltrasonic // Map ultrasonic standoff to armExtensionY
      },
      gas: { ...baseDef.sensor!.gas! }
    };

    const newEnv: EnvironmentState = {
      ...baseDef.env!,
      temperatureC: finalTemp,
      combustibleGasLel: finalGas,
      humidityPercentage: baseDef.env?.humidityPercentage || 50,
      windSpeedKmh: baseDef.env?.windSpeedKmh || 0,
      rain: baseDef.env?.rain || false,
      visibilityStatus: baseDef.env?.visibilityStatus || 'CLEAR',
      atmosphericPressureHpa: baseDef.env?.atmosphericPressureHpa || 1013,
      stormWorkabilityState: baseDef.env?.stormWorkabilityState || 'WORKABLE',
      o2Percentage: baseDef.env?.o2Percentage || 21,
      coPpm: baseDef.env?.coPpm || 0,
      co2Ppm: baseDef.env?.co2Ppm || 400
    };

    // Evaluate Safety Rules Engine (Authoritative)
    const { state: newSafetyState, newEvents } = evaluateSafetyState(newSensor, newEnv, false);

    // Build the Telemetry Sample
    const systemMode = isLive ? SystemMode.LIVE : SystemMode.DEMO;
    const sample: TelemetrySample = {
      timestamp: new Date().toISOString(),
      sourceMode: systemMode,
      robot: {
        powerVoltage: 24.0 + fuzz(),
        powerCurrent: 1.5 + fuzz()
      },
      motors: newSensor.motors,
      imu: newSensor.imu,
      hardware: newSensor.hardware,
      gas: newSensor.gas,
      environment: {
        o2Percentage: newEnv.o2Percentage,
        coPpm: newEnv.coPpm,
        co2Ppm: newEnv.co2Ppm,
        combustibleGasLel: newEnv.combustibleGasLel,
        temperatureC: newEnv.temperatureC,
        humidityPercentage: newEnv.humidityPercentage,
        atmosphericPressureHpa: newEnv.atmosphericPressureHpa,
        windSpeedKmh: newEnv.windSpeedKmh,
        rain: newEnv.rain,
        visibilityStatus: newEnv.visibilityStatus
      }
    };

    // Generate System Events
    const generatedEvents: SystemEvent[] = [];
    newEvents.forEach(ev => {
      generatedEvents.push({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        category: EventCategory.SAFETY,
        message: `Hazard Detected: ${ev.description}`,
        severity: ev.severity === 'HIGH' ? 'CRITICAL' : (ev.severity === 'MEDIUM' ? 'WARNING' : 'INFO'),
        robotId: 'ROBOT-01'
      });
    });

    const payload: PlatformTelemetry = {
      sensor: newSensor,
      environment: newEnv,
      safety: newSafetyState,
      telemetrySample: sample,
      events: generatedEvents
    };

    // Publish Tick to active clients
    realtimeBroker.publish({
      type: 'LIVE_TELEMETRY_TICK',
      source: 'AdafruitProvider',
      timestamp: sample.timestamp,
      payload
    });

    // Optionally Persist Record & Run Health Engine (10% of the time to avoid DB bloat during DEMO, 100% if LIVE)
    if (isLive || Math.random() < 0.1) {
      this.persistRecord(sample, systemMode).catch(err => {
        console.error('[AdafruitProvider] Failed to persist telemetry record:', err);
      });
    }
  }

  private async persistRecord(sample: TelemetrySample, mode: SystemMode) {
    try {
      const record = await prisma.telemetryRecord.create({
        data: {
          timestamp: new Date(sample.timestamp),
          robotId: 'ROBOT-01',
          source: 'AdafruitProvider',
          mode: mode,

          powerVoltage: sample.robot.powerVoltage,
          powerCurrent: sample.robot.powerCurrent,

          imuAccelX: sample.imu.acceleration.x,
          imuAccelY: sample.imu.acceleration.y,
          imuAccelZ: sample.imu.acceleration.z,
          imuGyroX: sample.imu.gyro.x,
          imuGyroY: sample.imu.gyro.y,
          imuGyroZ: sample.imu.gyro.z,
          imuTiltAngle: sample.imu.tiltAngle,

          motorCurrentLeft: sample.motors.currentLeft,
          motorCurrentRight: sample.motors.currentRight,
          motorTempLeft: sample.motors.tempLeft,
          motorTempRight: sample.motors.tempRight,

          electromagnetCurrent: sample.hardware.electromagnetCurrent,
          electromagnetEnabled: false,
          armExtensionY: sample.hardware.armExtensionY,
          armExtensionX: sample.hardware.armExtensionX,
          vibrationLevel: sample.hardware.vibrationLevel,
          torchStatus: sample.gas.torchStatus,

          oxyPressurePsi: sample.gas.oxyPressurePsi,
          oxyFlowRate: sample.gas.oxyFlowRate,
          acePressurePsi: sample.gas.acePressurePsi,
          aceFlowRate: sample.gas.aceFlowRate,

          envTemperatureC: sample.environment.temperatureC,
          envHumidity: sample.environment.humidityPercentage,
          envAtmosphericPressure: sample.environment.atmosphericPressureHpa,
          envWindSpeed: sample.environment.windSpeedKmh,
          envRain: sample.environment.rain,
          envVisibility: sample.environment.visibilityStatus,
          envO2Percentage: sample.environment.o2Percentage,
          envCoPpm: sample.environment.coPpm,
          envCo2Ppm: sample.environment.co2Ppm,
          envCombustibleGasLel: sample.environment.combustibleGasLel,

          overallHealth: 'GOOD',
        }
      });

      await evaluateSystemHealth(record);

      // Simple bounded retention
      const maxRecords = mode === SystemMode.LIVE ? 10000 : 1000;
      const count = await prisma.telemetryRecord.count({ where: { mode } });
      if (count > maxRecords) {
        const oldest = await prisma.telemetryRecord.findFirst({
          where: { mode },
          orderBy: { timestamp: 'asc' },
          select: { id: true }
        });
        if (oldest) {
          await prisma.telemetryRecord.delete({ where: { id: oldest.id } });
        }
      }
    } catch (e) {
      console.error('[AdafruitProvider] DB Persist error:', e);
    }
  }
}

export const adafruitTelemetryProvider = new AdafruitTelemetryProvider();
