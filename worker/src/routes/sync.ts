import type { D1Database } from '@cloudflare/workers-types';
import { getSyncStatus, getLatestSyncTimestamp } from '../db/queries';

export async function handleSyncStatus(db: D1Database, url: URL): Promise<Response> {
  const sinceParam = url.searchParams.get('since');
  const since = sinceParam ? parseInt(sinceParam, 10) : undefined;

  const [logs, latestTimestamp] = await Promise.all([
    getSyncStatus(db, since),
    getLatestSyncTimestamp(db),
  ]);

  return Response.json({
    logs,
    latest_timestamp: latestTimestamp,
    server_time: Date.now(),
  });
}
