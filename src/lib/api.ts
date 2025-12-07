import { loadConfig } from './config';

export interface ScriptListItem {
  id: string;
  name: string;
  description: string | null;
  script_type: string;
  updated_at: number;
}

export interface Script {
  id: string;
  name: string;
  description: string | null;
  content: string;
  script_type: 'executable' | 'source' | 'function';
  created_at: number;
  updated_at: number;
}

export interface SyncLogEntry {
  id: string;
  script_id: string;
  action: 'create' | 'update' | 'delete';
  timestamp: number;
  device_id: string | null;
}

export interface SyncStatus {
  logs: SyncLogEntry[];
  latest_timestamp: number;
  server_time: number;
}

export interface ApiError {
  error: string;
  warning?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private deviceId: string;

  constructor() {
    const config = loadConfig();
    this.baseUrl = config.serverUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey || '';
    this.deviceId = config.deviceId;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Device-ID': this.deviceId,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiClientError(error.error, response.status, error.warning);
    }

    return data as T;
  }

  async listScripts(): Promise<ScriptListItem[]> {
    const result = await this.request<{ scripts: ScriptListItem[] }>('/scripts');
    return result.scripts;
  }

  async getScript(name: string): Promise<Script> {
    const result = await this.request<{ script: Script }>(
      `/scripts/${encodeURIComponent(name)}`
    );
    return result.script;
  }

  async createScript(script: {
    name: string;
    content: string;
    description?: string;
    script_type?: 'executable' | 'source' | 'function';
  }): Promise<Script> {
    const result = await this.request<{ script: Script }>('/scripts', {
      method: 'POST',
      body: JSON.stringify(script),
    });
    return result.script;
  }

  async updateScript(
    name: string,
    updates: {
      content?: string;
      description?: string;
      script_type?: 'executable' | 'source' | 'function';
    }
  ): Promise<Script> {
    const result = await this.request<{ script: Script }>(
      `/scripts/${encodeURIComponent(name)}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return result.script;
  }

  async deleteScript(name: string): Promise<void> {
    await this.request(`/scripts/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  async getSyncStatus(since?: number): Promise<SyncStatus> {
    const params = since ? `?since=${since}` : '';
    return this.request<SyncStatus>(`/sync/status${params}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request<{ status: string }>('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isWarning?: boolean
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

let clientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!clientInstance) {
    clientInstance = new ApiClient();
  }
  return clientInstance;
}

export function resetApiClient(): void {
  clientInstance = null;
}
