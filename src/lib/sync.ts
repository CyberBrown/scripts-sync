import { getApiClient, type Script, type ScriptListItem } from './api';
import {
  getCachedScript,
  saveToCache,
  listCachedScripts,
  removeFromCache,
  type CachedScript,
} from './cache';
import { getLastSyncTimestamp, setLastSyncTimestamp } from './config';
import { isInstalled, installScript } from './path';

export interface SyncResult {
  pulled: string[];
  pushed: string[];
  deleted: string[];
  conflicts: ConflictInfo[];
  errors: { name: string; error: string }[];
}

export interface ConflictInfo {
  name: string;
  localModified: number;
  serverModified: number;
}

export interface ScriptStatus {
  name: string;
  description: string | null;
  script_type: string;
  status: 'installed' | 'cached' | 'not_synced' | 'local_only' | 'modified';
  updated_at: number;
  local_modified_at?: number;
}

export async function getScriptStatuses(): Promise<ScriptStatus[]> {
  const api = getApiClient();
  const statuses: ScriptStatus[] = [];

  // Get remote scripts
  let remoteScripts: ScriptListItem[] = [];
  try {
    remoteScripts = await api.listScripts();
  } catch {
    // Offline - just use cache
  }

  const remoteByName = new Map(remoteScripts.map((s) => [s.name, s]));
  const cachedScripts = listCachedScripts();
  const cachedByName = new Map(cachedScripts.map((s) => [s.name, s]));

  // Process remote scripts
  for (const remote of remoteScripts) {
    const cached = cachedByName.get(remote.name);
    let status: ScriptStatus['status'] = 'not_synced';

    if (cached) {
      if (isInstalled(remote.name)) {
        status = 'installed';
      } else {
        status = 'cached';
      }

      // Check for local modifications
      if (cached.local_modified_at && cached.local_modified_at > cached.updated_at) {
        status = 'modified';
      }
    }

    statuses.push({
      name: remote.name,
      description: remote.description,
      script_type: remote.script_type,
      status,
      updated_at: remote.updated_at,
      local_modified_at: cached?.local_modified_at,
    });
  }

  // Find local-only scripts
  for (const cached of cachedScripts) {
    if (!remoteByName.has(cached.name)) {
      statuses.push({
        name: cached.name,
        description: cached.description,
        script_type: cached.script_type,
        status: 'local_only',
        updated_at: cached.updated_at,
        local_modified_at: cached.local_modified_at,
      });
    }
  }

  return statuses.sort((a, b) => a.name.localeCompare(b.name));
}

export async function pullScript(name: string): Promise<Script> {
  const api = getApiClient();
  const script = await api.getScript(name);
  saveToCache(script);
  return script;
}

export async function pullAll(): Promise<SyncResult> {
  const api = getApiClient();
  const result: SyncResult = {
    pulled: [],
    pushed: [],
    deleted: [],
    conflicts: [],
    errors: [],
  };

  const remoteScripts = await api.listScripts();

  for (const remote of remoteScripts) {
    try {
      const cached = getCachedScript(remote.name);

      // Check for conflicts
      if (
        cached &&
        cached.local_modified_at &&
        cached.local_modified_at > cached.updated_at &&
        remote.updated_at > cached.updated_at
      ) {
        result.conflicts.push({
          name: remote.name,
          localModified: cached.local_modified_at,
          serverModified: remote.updated_at,
        });
        continue;
      }

      // Pull if newer or not cached
      if (!cached || remote.updated_at > cached.updated_at) {
        await pullScript(remote.name);
        result.pulled.push(remote.name);
      }
    } catch (error) {
      result.errors.push({
        name: remote.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  setLastSyncTimestamp(Date.now());
  return result;
}

export async function pushScript(name: string): Promise<void> {
  const api = getApiClient();
  const cached = getCachedScript(name);

  if (!cached) {
    throw new Error(`Script '${name}' not found in cache`);
  }

  try {
    // Try to update first
    await api.updateScript(name, {
      content: cached.content,
      description: cached.description ?? undefined,
      script_type: cached.script_type,
    });
  } catch (error) {
    // If not found, create it
    if (error instanceof Error && error.message.includes('not found')) {
      await api.createScript({
        name: cached.name,
        content: cached.content,
        description: cached.description ?? undefined,
        script_type: cached.script_type,
      });
    } else {
      throw error;
    }
  }

  // Update local cache with server timestamp
  const updated = await api.getScript(name);
  saveToCache(updated);
}

export async function pushAll(): Promise<SyncResult> {
  const result: SyncResult = {
    pulled: [],
    pushed: [],
    deleted: [],
    conflicts: [],
    errors: [],
  };

  const cachedScripts = listCachedScripts();

  for (const cached of cachedScripts) {
    // Only push locally modified scripts
    if (cached.local_modified_at && cached.local_modified_at > cached.updated_at) {
      try {
        await pushScript(cached.name);
        result.pushed.push(cached.name);
      } catch (error) {
        result.errors.push({
          name: cached.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  return result;
}

export async function syncAll(): Promise<SyncResult> {
  // Push local changes first, then pull remote changes
  const pushResult = await pushAll();
  const pullResult = await pullAll();

  return {
    pulled: pullResult.pulled,
    pushed: pushResult.pushed,
    deleted: [...pushResult.deleted, ...pullResult.deleted],
    conflicts: [...pushResult.conflicts, ...pullResult.conflicts],
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

export async function deleteRemoteScript(name: string): Promise<void> {
  const api = getApiClient();
  await api.deleteScript(name);
  removeFromCache(name);
}
