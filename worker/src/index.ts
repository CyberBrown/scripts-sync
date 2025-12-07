import type { D1Database } from '@cloudflare/workers-types';
import {
  handleListScripts,
  handleGetScript,
  handleCreateScript,
  handleUpdateScript,
  handleDeleteScript,
} from './routes/scripts';
import { handleSyncStatus } from './routes/sync';

interface Env {
  DB: D1Database;
  API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
    };

    // Handle preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check (no auth required)
    if (path === '/health' && method === 'GET') {
      return Response.json(
        { status: 'ok', timestamp: Date.now() },
        { headers: corsHeaders }
      );
    }

    // Auth check
    const authResult = await authenticate(request, env);
    if (!authResult.ok) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const deviceId = request.headers.get('X-Device-ID') ?? undefined;

    try {
      let response: Response;

      // Route matching
      if (path === '/scripts' && method === 'GET') {
        response = await handleListScripts(env.DB);
      } else if (path === '/scripts' && method === 'POST') {
        const body = await request.json();
        response = await handleCreateScript(env.DB, body, deviceId);
      } else if (path.startsWith('/scripts/') && method === 'GET') {
        const name = decodeURIComponent(path.slice('/scripts/'.length));
        response = await handleGetScript(env.DB, name);
      } else if (path.startsWith('/scripts/') && method === 'PUT') {
        const name = decodeURIComponent(path.slice('/scripts/'.length));
        const body = await request.json();
        response = await handleUpdateScript(env.DB, name, body, deviceId);
      } else if (path.startsWith('/scripts/') && method === 'DELETE') {
        const name = decodeURIComponent(path.slice('/scripts/'.length));
        response = await handleDeleteScript(env.DB, name, deviceId);
      } else if (path === '/sync/status' && method === 'GET') {
        response = await handleSyncStatus(env.DB, url);
      } else {
        response = Response.json({ error: 'Not found' }, { status: 404 });
      }

      // Add CORS headers to response
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      console.error('Request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return Response.json(
        { error: 'Internal server error', details: errorMessage },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};

async function authenticate(
  request: Request,
  env: Env
): Promise<{ ok: boolean }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false };
  }

  const token = authHeader.slice('Bearer '.length);

  // For development, accept the env API_KEY directly
  if (env.API_KEY && token === env.API_KEY) {
    return { ok: true };
  }

  // For production, we'd validate against the api_keys table
  // This would involve hashing the token and checking the database
  // For now, we'll just check if any valid key exists
  try {
    const keyHash = await hashApiKey(token);
    const result = await env.DB
      .prepare('SELECT id FROM api_keys WHERE key_hash = ?')
      .bind(keyHash)
      .first();

    if (result) {
      // Update last_used_at
      await env.DB
        .prepare('UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?')
        .bind(Date.now(), keyHash)
        .run();
      return { ok: true };
    }
  } catch {
    // Database might not be set up yet
  }

  return { ok: false };
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
