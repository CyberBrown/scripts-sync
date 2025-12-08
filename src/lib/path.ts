import { existsSync, unlinkSync, symlinkSync, chmodSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { paths } from './config';
import { getCachedScript } from './cache';

function getBinPath(name: string): string {
  return join(paths.binDir, name);
}

function getCachePath(name: string): string {
  return join(paths.cacheDir, `${name}.sh`);
}

export function isInstalled(name: string): boolean {
  return existsSync(getBinPath(name));
}

export function installScript(name: string): boolean {
  const cached = getCachedScript(name);
  if (!cached) {
    return false;
  }

  const binPath = getBinPath(name);
  const cachePath = getCachePath(name);

  // Remove existing if present
  if (existsSync(binPath)) {
    unlinkSync(binPath);
  }

  // For executable scripts, we create a wrapper that runs the cached script
  // This allows updates to take effect immediately without reinstalling
  if (cached.script_type === 'executable') {
    const wrapper = `#!/usr/bin/env bash
# config-sync wrapper for: ${name}
exec bash "${cachePath}" "$@"
`;
    writeFileSync(binPath, wrapper);
    chmodSync(binPath, 0o755);
  } else {
    // For source/function scripts, symlink directly
    symlinkSync(cachePath, binPath);
    chmodSync(cachePath, 0o755);
  }

  return true;
}

export function uninstallScript(name: string): boolean {
  const binPath = getBinPath(name);

  if (!existsSync(binPath)) {
    return false;
  }

  unlinkSync(binPath);
  return true;
}

export function listInstalledScripts(): string[] {
  if (!existsSync(paths.binDir)) return [];

  return readdirSync(paths.binDir).filter((f) => {
    const binPath = join(paths.binDir, f);
    return existsSync(binPath);
  });
}

export function getInstallStatus(name: string): 'installed' | 'cached' | 'not_synced' {
  if (isInstalled(name)) return 'installed';
  if (existsSync(getCachePath(name))) return 'cached';
  return 'not_synced';
}

export function checkPathSetup(): { configured: boolean; shellFile: string | null } {
  const home = process.env.HOME || '';
  const shellFiles = ['.bashrc', '.zshrc', '.profile', '.bash_profile'];

  for (const file of shellFiles) {
    const filePath = join(home, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      if (content.includes('.config-sync/.bin')) {
        return { configured: true, shellFile: filePath };
      }
    }
  }

  return { configured: false, shellFile: null };
}

export function getRecommendedShellFile(): string {
  const home = process.env.HOME || '';
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return join(home, '.zshrc');
  }
  return join(home, '.bashrc');
}

export function getPathExportLine(): string {
  return `
# Config Sync
export PATH="$HOME/.config-sync/.bin:$PATH"
`;
}
