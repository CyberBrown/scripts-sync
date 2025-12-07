import type { D1Database } from '@cloudflare/workers-types';
import {
  listScripts,
  getScriptByName,
  createScript,
  updateScript,
  deleteScript,
  type Script,
} from '../db/queries';

export async function handleListScripts(db: D1Database): Promise<Response> {
  const scripts = await listScripts(db);
  return Response.json({ scripts });
}

export async function handleGetScript(db: D1Database, name: string): Promise<Response> {
  const script = await getScriptByName(db, name);
  if (!script) {
    return Response.json({ error: 'Script not found' }, { status: 404 });
  }
  return Response.json({ script });
}

export async function handleCreateScript(
  db: D1Database,
  body: unknown,
  deviceId?: string
): Promise<Response> {
  if (!isValidCreateBody(body)) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Check if script with this name already exists
  const existing = await getScriptByName(db, body.name);
  if (existing) {
    return Response.json({ error: 'Script with this name already exists' }, { status: 409 });
  }

  // Validate name (no spaces, safe characters)
  if (!isValidScriptName(body.name)) {
    return Response.json(
      { error: 'Invalid script name. Use only alphanumeric characters, hyphens, and underscores.' },
      { status: 400 }
    );
  }

  // Check for system command conflicts
  const conflicts = checkSystemCommandConflict(body.name);
  if (conflicts) {
    return Response.json(
      { error: `Script name conflicts with system command: ${conflicts}`, warning: true },
      { status: 400 }
    );
  }

  // Warn about large scripts
  if (body.content.length > 100 * 1024) {
    return Response.json(
      { error: 'Script exceeds 100KB limit. This seems unusually large.' },
      { status: 400 }
    );
  }

  const script = await createScript(
    db,
    {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description ?? null,
      content: body.content,
      script_type: body.script_type ?? 'executable',
    },
    deviceId
  );

  return Response.json({ script }, { status: 201 });
}

export async function handleUpdateScript(
  db: D1Database,
  name: string,
  body: unknown,
  deviceId?: string
): Promise<Response> {
  if (!isValidUpdateBody(body)) {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Warn about large scripts
  if (body.content && body.content.length > 100 * 1024) {
    return Response.json(
      { error: 'Script exceeds 100KB limit. This seems unusually large.' },
      { status: 400 }
    );
  }

  const script = await updateScript(db, name, body, deviceId);
  if (!script) {
    return Response.json({ error: 'Script not found' }, { status: 404 });
  }

  return Response.json({ script });
}

export async function handleDeleteScript(
  db: D1Database,
  name: string,
  deviceId?: string
): Promise<Response> {
  const deleted = await deleteScript(db, name, deviceId);
  if (!deleted) {
    return Response.json({ error: 'Script not found' }, { status: 404 });
  }
  return Response.json({ success: true });
}

// Validation helpers
interface CreateScriptBody {
  name: string;
  content: string;
  description?: string;
  script_type?: 'executable' | 'source' | 'function';
}

interface UpdateScriptBody {
  content?: string;
  description?: string;
  script_type?: 'executable' | 'source' | 'function';
}

function isValidCreateBody(body: unknown): body is CreateScriptBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== 'string' || b.name.length === 0) return false;
  if (typeof b.content !== 'string') return false;
  if (b.description !== undefined && typeof b.description !== 'string') return false;
  if (b.script_type !== undefined) {
    if (!['executable', 'source', 'function'].includes(b.script_type as string)) return false;
  }
  return true;
}

function isValidUpdateBody(body: unknown): body is UpdateScriptBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  if (b.content !== undefined && typeof b.content !== 'string') return false;
  if (b.description !== undefined && typeof b.description !== 'string') return false;
  if (b.script_type !== undefined) {
    if (!['executable', 'source', 'function'].includes(b.script_type as string)) return false;
  }
  return true;
}

function isValidScriptName(name: string): boolean {
  // Allow alphanumeric, hyphens, underscores, max 64 chars
  return /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(name);
}

const COMMON_SYSTEM_COMMANDS = [
  'ls', 'cd', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'cat', 'echo', 'grep',
  'find', 'sed', 'awk', 'sort', 'uniq', 'head', 'tail', 'less', 'more',
  'vi', 'vim', 'nano', 'emacs', 'git', 'ssh', 'scp', 'curl', 'wget',
  'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'chmod', 'chown', 'sudo',
  'su', 'ps', 'top', 'htop', 'kill', 'killall', 'man', 'which', 'where',
  'pwd', 'whoami', 'date', 'time', 'history', 'alias', 'export', 'env',
  'source', 'bash', 'sh', 'zsh', 'fish', 'node', 'npm', 'npx', 'bun',
  'python', 'python3', 'pip', 'pip3', 'ruby', 'gem', 'go', 'cargo', 'rust',
  'docker', 'kubectl', 'terraform', 'aws', 'gcloud', 'az', 'make', 'cmake',
];

function checkSystemCommandConflict(name: string): string | null {
  const lower = name.toLowerCase();
  if (COMMON_SYSTEM_COMMANDS.includes(lower)) {
    return name;
  }
  return null;
}
