import { seniorClient } from './SeniorPlatformClient';
import { SeniorShipResponse } from './types';

export class ShipAdapter {
  /**
   * Fetches active ship dimensions.
   * CRITICAL SAFETY BOUNDARY: Must reject fallback seed data.
   */
  async fetchActiveShip(shipId: string): Promise<SeniorShipResponse> {
    // In Phase 12B, we do not execute the live network call.
    // const data = await seniorClient.get<SeniorShipResponse>(`/ships/${shipId}`);
    
    // Abstract implementation placeholder
    const data: SeniorShipResponse = {
      id: shipId,
      name: 'Simulated Fetch',
      dimensions: { length: 200, width: 30, height: 40 }
    };

    // STRICT VALIDATION: Do not accept seed data.
    if (data.isSeedData || data.id === 'seed-ship-id') {
      throw new Error('SAFETY HAZARD: Senior API returned fallback seed data. Rejected to prevent false geometry.');
    }

    return data;
  }
}

export const shipAdapter = new ShipAdapter();
