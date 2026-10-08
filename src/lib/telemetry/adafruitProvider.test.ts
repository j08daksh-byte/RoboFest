import { adafruitTelemetryProvider } from './adafruitProvider';
import { realtimeBroker } from '../realtime/broker';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AdafruitTelemetryProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockFetch.mockClear();
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';
    adafruitTelemetryProvider.stop();
    // Clear broker subscribers if any
  });

  afterEach(() => {
    jest.useRealTimers();
    adafruitTelemetryProvider.stop();
  });

  test('Missing credentials starts in DEMO mode (D)', () => {
    delete process.env.AIO_USERNAME;
    delete process.env.AIO_KEY;
    adafruitTelemetryProvider.start();
    const status = adafruitTelemetryProvider.getStatus();
    expect(status.status).toBe('DEMO');
  });

  test('Provides DEMO data when in DEMO mode', () => {
    delete process.env.AIO_USERNAME;
    
    let receivedPayload: any = null;
    const unsub = realtimeBroker.subscribe((evt) => {
      if (evt.type === 'LIVE_TELEMETRY_TICK') receivedPayload = evt.payload;
    });

    adafruitTelemetryProvider.start();
    jest.advanceTimersByTime(3500);

    expect(receivedPayload).toBeTruthy();
    expect(receivedPayload.telemetrySample.sourceMode).toBe('DEMO');
    
    unsub();
  });

  test('Valid Adafruit response normalizes telemetry and reaches realtime pathway (A, H)', async () => {
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ value: '42.5' }]
    });

    let receivedEvent: any = null;
    const unsub = realtimeBroker.subscribe((evt) => {
      if (evt.type === 'LIVE_TELEMETRY_TICK') {
        receivedEvent = evt;
      }
    });

    adafruitTelemetryProvider.start();
    
    // Trigger tick
    await jest.advanceTimersByTimeAsync(3500);

    expect(mockFetch).toHaveBeenCalledTimes(4); // 4 feeds
    expect(receivedEvent).toBeTruthy();
    expect(receivedEvent.payload.sensor.metadata.isSimulated).toBe(false);
    expect(receivedEvent.payload.telemetrySample.sourceMode).toBe('LIVE');
    // Temperature feed is mapped to temperatureC
    expect(receivedEvent.payload.environment.temperatureC).toBe(42.5);

    unsub();
  });

  test('API error does not crash and handles gracefully (E, C)', async () => {
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';

    mockFetch.mockRejectedValue(new Error('Network error'));

    adafruitTelemetryProvider.start();
    
    // Wait for promise rejections
    await jest.advanceTimersByTimeAsync(3500);

    const status = adafruitTelemetryProvider.getStatus();
    expect(status.status).toBe('ADAFRUIT_IO');
    // It should have failed to read
    expect(status.channels.temperature).toBe(false);
  });

  test('Malformed feed value is safely rejected (B)', async () => {
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ value: 'not-a-number' }]
    });

    let receivedEvent: any = null;
    const unsub = realtimeBroker.subscribe((evt) => {
      if (evt.type === 'LIVE_TELEMETRY_TICK') {
        receivedEvent = evt;
      }
    });

    adafruitTelemetryProvider.start();
    await jest.advanceTimersByTimeAsync(3500);

    expect(receivedEvent).toBeTruthy();
    const status = adafruitTelemetryProvider.getStatus();
    expect(status.channels.temperature).toBe(false); // Parse failed, remains null

    unsub();
  });

  test('Duplicate polling prevention (G)', () => {
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';
    
    adafruitTelemetryProvider.start();
    const initialStatus = adafruitTelemetryProvider.getStatus();
    
    adafruitTelemetryProvider.start(); // Call again
    
    jest.advanceTimersByTime(3500);
    // Fetch should only be called once per feed (4 times total for one tick)
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  test('No credential leakage (F)', async () => {
    process.env.AIO_USERNAME = 'test_user';
    process.env.AIO_KEY = 'test_key';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ value: '42.5' }]
    });

    let receivedEvent: any = null;
    const unsub = realtimeBroker.subscribe((evt) => {
      if (evt.type === 'LIVE_TELEMETRY_TICK') {
        receivedEvent = evt;
      }
    });

    adafruitTelemetryProvider.start();
    await jest.advanceTimersByTimeAsync(3500);

    // Verify the URL does not contain the key
    const calls = mockFetch.mock.calls;
    for (const call of calls) {
      const url = call[0];
      expect(url).not.toContain('test_key');
      expect(call[1].headers['X-AIO-Key']).toBe('test_key');
    }

    // Verify the emitted event does not contain the key
    const payloadStr = JSON.stringify(receivedEvent);
    expect(payloadStr).not.toContain('test_key');

    unsub();
  });
});
