export class SeniorPlatformClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SENIOR_API_URL || 'http://localhost:5000/api';
    this.token = process.env.SENIOR_API_TOKEN || '';
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GET ${url} failed with status ${response.status}`);
    }

    return response.json();
  }

  async post<T>(path: string, body: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`POST ${url} failed with status ${response.status}`);
    }

    return response.json();
  }

  async put<T>(path: string, body: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`PUT ${url} failed with status ${response.status}`);
    }

    return response.json();
  }
}

export const seniorClient = new SeniorPlatformClient();
