import chalk from 'chalk';
import type { ScriptStatus } from '../../lib/sync';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

function padRight(str: string, len: number): string {
  // Handle ANSI codes by calculating visible length
  const visibleLength = str.replace(/\x1b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, len - visibleLength);
  return str + ' '.repeat(padding);
}

function formatStatus(status: ScriptStatus['status']): string {
  switch (status) {
    case 'installed':
      return chalk.green('installed');
    case 'cached':
      return chalk.yellow('cached');
    case 'not_synced':
      return chalk.dim('not synced');
    case 'local_only':
      return chalk.blue('local only');
    case 'modified':
      return chalk.magenta('modified');
    default:
      return chalk.dim(status);
  }
}

export function printScriptTable(scripts: ScriptStatus[]): void {
  if (scripts.length === 0) {
    console.log(chalk.dim('  No scripts found.'));
    console.log(chalk.dim('  Run `cs add <name>` to create one.'));
    return;
  }

  // Calculate column widths
  const nameWidth = Math.max(12, ...scripts.map((s) => s.name.length)) + 2;
  const statusWidth = 12;
  const descWidth = 35;

  // Header
  console.log();
  console.log(
    chalk.dim('  ') +
      chalk.bold(padRight('NAME', nameWidth)) +
      chalk.bold(padRight('STATUS', statusWidth)) +
      chalk.bold(padRight('DESCRIPTION', descWidth)) +
      chalk.bold('UPDATED')
  );
  console.log(chalk.dim('  ' + '─'.repeat(nameWidth + statusWidth + descWidth + 15)));

  // Rows
  for (const script of scripts) {
    const name = padRight(script.name, nameWidth);
    const status = padRight(formatStatus(script.status), statusWidth);
    const desc = padRight(
      (script.description || chalk.dim('—')).slice(0, descWidth - 2),
      descWidth
    );
    const updated = formatTimeAgo(script.updated_at);

    console.log(`  ${name}${status}${desc}${chalk.dim(updated)}`);
  }

  console.log();
}

export function printSyncResult(result: {
  pulled: string[];
  pushed: string[];
  deleted: string[];
  conflicts: { name: string }[];
  errors: { name: string; error: string }[];
}): void {
  const { pulled, pushed, deleted, conflicts, errors } = result;

  if (pulled.length > 0) {
    console.log(chalk.green(`  ↓ Pulled: ${pulled.join(', ')}`));
  }
  if (pushed.length > 0) {
    console.log(chalk.blue(`  ↑ Pushed: ${pushed.join(', ')}`));
  }
  if (deleted.length > 0) {
    console.log(chalk.red(`  ✕ Deleted: ${deleted.join(', ')}`));
  }
  if (conflicts.length > 0) {
    console.log(chalk.yellow(`  ⚠ Conflicts: ${conflicts.map((c) => c.name).join(', ')}`));
    console.log(chalk.dim('    Use `cs edit <name>` to resolve'));
  }
  if (errors.length > 0) {
    for (const err of errors) {
      console.log(chalk.red(`  ✕ Error (${err.name}): ${err.error}`));
    }
  }

  const total = pulled.length + pushed.length + deleted.length;
  if (total === 0 && conflicts.length === 0 && errors.length === 0) {
    console.log(chalk.dim('  Everything up to date.'));
  }
}

export function printError(message: string): void {
  console.log(chalk.red(`  Error: ${message}`));
}

export function printSuccess(message: string): void {
  console.log(chalk.green(`  ${message}`));
}

export function printWarning(message: string): void {
  console.log(chalk.yellow(`  Warning: ${message}`));
}

export function printInfo(message: string): void {
  console.log(chalk.dim(`  ${message}`));
}
