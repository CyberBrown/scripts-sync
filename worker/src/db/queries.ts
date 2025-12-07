import type { D1Database } from '@cloudflare/workers-types';

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

export interface ScriptListItem {
  id: string;
  name: string;
  description: string | null;
  script_type: string;
  updated_at: number;
}

export async function listScripts(db: D1Database): Promise<ScriptListItem[]> {
  const result = await db
    .prepare('SELECT id, name, description, script_type, updated_at FROM scripts ORDER BY name')
    .all<ScriptListItem>();
  return result.results;
}

export async function getScriptByName(db: D1Database, name: string): Promise<Script | null> {
  const result = await db
    .prepare('SELECT * FROM scripts WHERE name = ?')
    .bind(name)
    .first<Script>();
  return result;
}

export async function createScript(
  db: D1Database,
  script: Omit<Script, 'created_at' | 'updated_at'>,
  deviceId?: string
): Promise<Script> {
  const now = Date.now();
  const fullScript: Script = {
    ...script,
    created_at: now,
    updated_at: now,
  };

  await db
    .prepare(
      `INSERT INTO scripts (id, name, description, content, script_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      fullScript.id,
      fullScript.name,
      fullScript.description,
      fullScript.content,
      fullScript.script_type,
      fullScript.created_at,
      fullScript.updated_at
    )
    .run();

  // Log the sync action
  await logSyncAction(db, fullScript.id, 'create', deviceId);

  return fullScript;
}

export async function updateScript(
  db: D1Database,
  name: string,
  updates: Partial<Pick<Script, 'description' | 'content' | 'script_type'>>,
  deviceId?: string
): Promise<Script | null> {
  const existing = await getScriptByName(db, name);
  if (!existing) return null;

  const now = Date.now();
  const setClauses: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (updates.description !== undefined) {
    setClauses.push('description = ?');
    values.push(updates.description);
  }
  if (updates.content !== undefined) {
    setClauses.push('content = ?');
    values.push(updates.content);
  }
  if (updates.script_type !== undefined) {
    setClauses.push('script_type = ?');
    values.push(updates.script_type);
  }

  values.push(name);

  await db
    .prepare(`UPDATE scripts SET ${setClauses.join(', ')} WHERE name = ?`)
    .bind(...values)
    .run();

  await logSyncAction(db, existing.id, 'update', deviceId);

  return getScriptByName(db, name);
}

export async function deleteScript(db: D1Database, name: string, deviceId?: string): Promise<boolean> {
  const existing = await getScriptByName(db, name);
  if (!existing) return false;

  await logSyncAction(db, existing.id, 'delete', deviceId);

  const result = await db
    .prepare('DELETE FROM scripts WHERE name = ?')
    .bind(name)
    .run();

  return result.meta.changes > 0;
}

export async function logSyncAction(
  db: D1Database,
  scriptId: string,
  action: 'create' | 'update' | 'delete',
  deviceId?: string
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO sync_log (id, script_id, action, timestamp, device_id)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, scriptId, action, Date.now(), deviceId ?? null)
    .run();
}

export async function getSyncStatus(db: D1Database, since?: number): Promise<SyncLogEntry[]> {
  let query = 'SELECT * FROM sync_log';
  const params: number[] = [];

  if (since) {
    query += ' WHERE timestamp > ?';
    params.push(since);
  }

  query += ' ORDER BY timestamp DESC';

  const result = await db
    .prepare(query)
    .bind(...params)
    .all<SyncLogEntry>();

  return result.results;
}

export async function getLatestSyncTimestamp(db: D1Database): Promise<number> {
  const result = await db
    .prepare('SELECT MAX(timestamp) as latest FROM sync_log')
    .first<{ latest: number | null }>();
  return result?.latest ?? 0;
}
