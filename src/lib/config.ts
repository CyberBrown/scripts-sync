import { homedir } from 'os';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

export interface Config {
  apiKey?: string;
  serverUrl: string;
  deviceId: string;
}

const CONFIG_DIR = join(homedir(), '.scripts-sync');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const CACHE_DIR = join(CONFIG_DIR, 'cache');
const BIN_DIR = join(CONFIG_DIR, '.bin');
const LAST_SYNC_FILE = join(CONFIG_DIR, '.last-sync');

export const paths = {
  configDir: CONFIG_DIR,
  configFile: CONFIG_FILE,
  cacheDir: CACHE_DIR,
  binDir: BIN_DIR,
  lastSyncFile: LAST_SYNC_FILE,
};

export function ensureDirectories(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!existsSync(BIN_DIR)) {
    mkdirSync(BIN_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureDirectories();

  const defaultConfig: Config = {
    serverUrl: 'https://scripts-sync-api.solamp.workers.dev',
    deviceId: generateDeviceId(),
  };

  if (!existsSync(CONFIG_FILE)) {
    return defaultConfig;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      ...defaultConfig,
      ...parsed,
    };
  } catch {
    return defaultConfig;
  }
}

export function saveConfig(config: Partial<Config>): void {
  ensureDirectories();

  const existing = loadConfig();
  const updated = { ...existing, ...config };

  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
}

export function getLastSyncTimestamp(): number {
  if (!existsSync(LAST_SYNC_FILE)) {
    return 0;
  }
  try {
    const content = readFileSync(LAST_SYNC_FILE, 'utf-8');
    return parseInt(content.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

export function setLastSyncTimestamp(timestamp: number): void {
  ensureDirectories();
  writeFileSync(LAST_SYNC_FILE, timestamp.toString());
}

function generateDeviceId(): string {
  const { hostname } = require('os');
  const name = hostname();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}-${random}`;
}

export function isConfigured(): boolean {
  const config = loadConfig();
  return !!config.apiKey && !!config.serverUrl;
}
