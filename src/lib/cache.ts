import { existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join } from 'path';
import { paths } from './config';
import type { Script } from './api';

export interface CachedScript {
  name: string;
  content: string;
  description: string | null;
  script_type: 'executable' | 'source' | 'function';
  updated_at: number;
  local_modified_at?: number;
}

function getCachePath(name: string): string {
  return join(paths.cacheDir, `${name}.sh`);
}

function getMetaPath(name: string): string {
  return join(paths.cacheDir, `${name}.meta.json`);
}

export function getCachedScript(name: string): CachedScript | null {
  const cachePath = getCachePath(name);
  const metaPath = getMetaPath(name);

  if (!existsSync(cachePath) || !existsSync(metaPath)) {
    return null;
  }

  try {
    const content = readFileSync(cachePath, 'utf-8');
    const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

    return {
      name,
      content,
      description: meta.description ?? null,
      script_type: meta.script_type ?? 'executable',
      updated_at: meta.updated_at ?? 0,
      local_modified_at: meta.local_modified_at,
    };
  } catch {
    return null;
  }
}

export function saveToCache(script: Script | CachedScript): void {
  const cachePath = getCachePath(script.name);
  const metaPath = getMetaPath(script.name);

  writeFileSync(cachePath, script.content);
  writeFileSync(
    metaPath,
    JSON.stringify({
      description: script.description,
      script_type: script.script_type,
      updated_at: script.updated_at,
      local_modified_at: 'local_modified_at' in script ? script.local_modified_at : undefined,
    })
  );
}

export function markLocallyModified(name: string): void {
  const metaPath = getMetaPath(name);
  if (!existsSync(metaPath)) return;

  const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
  meta.local_modified_at = Date.now();
  writeFileSync(metaPath, JSON.stringify(meta));
}

export function removeFromCache(name: string): void {
  const cachePath = getCachePath(name);
  const metaPath = getMetaPath(name);

  if (existsSync(cachePath)) unlinkSync(cachePath);
  if (existsSync(metaPath)) unlinkSync(metaPath);
}

export function listCachedScripts(): CachedScript[] {
  if (!existsSync(paths.cacheDir)) return [];

  const files = readdirSync(paths.cacheDir);
  const scriptFiles = files.filter((f) => f.endsWith('.sh'));

  const scripts: CachedScript[] = [];
  for (const file of scriptFiles) {
    const name = file.replace(/\.sh$/, '');
    const cached = getCachedScript(name);
    if (cached) scripts.push(cached);
  }

  return scripts;
}

export function isCached(name: string): boolean {
  return existsSync(getCachePath(name)) && existsSync(getMetaPath(name));
}

export function getCacheContent(name: string): string | null {
  const cachePath = getCachePath(name);
  if (!existsSync(cachePath)) return null;
  return readFileSync(cachePath, 'utf-8');
}

export function updateCacheContent(name: string, content: string): void {
  const cachePath = getCachePath(name);
  if (!existsSync(cachePath)) return;
  writeFileSync(cachePath, content);
  markLocallyModified(name);
}
