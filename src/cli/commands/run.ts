import chalk from 'chalk';
import { spawn } from 'child_process';
import { pullScript } from '../../lib/sync';
import { getCachedScript, getCacheContent } from '../../lib/cache';
import { printError } from '../ui/table';
import { choose } from '../ui/menu';
import { getApiClient } from '../../lib/api';

export async function runCommand(name?: string, args: string[] = []): Promise<void> {
  try {
    let scriptName = name;

    // If no name provided, show selection
    if (!scriptName) {
      const api = getApiClient();
      const scripts = await api.listScripts();

      if (scripts.length === 0) {
        printError('No scripts available to run.');
        process.exit(1);
      }

      const options = scripts.map((s) => ({
        label: s.name,
        value: s.name,
        description: s.description || undefined,
      }));

      const selected = await choose(options, 'Select script to run:');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = selected;
    }

    // Get script content (pull if not cached)
    let cached = getCachedScript(scriptName);
    if (!cached) {
      console.log(chalk.dim(`  Downloading '${scriptName}'...`));
      await pullScript(scriptName);
      cached = getCachedScript(scriptName);
    }

    if (!cached) {
      printError(`Failed to get script '${scriptName}'.`);
      process.exit(1);
    }

    const content = getCacheContent(scriptName);
    if (!content) {
      printError(`Failed to read script content for '${scriptName}'.`);
      process.exit(1);
    }

    // Run the script
    console.log(chalk.dim(`  Running '${scriptName}'...\n`));

    const proc = spawn('bash', ['-c', content, '--', ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    proc.on('close', (code) => {
      process.exit(code ?? 0);
    });
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to run script');
    process.exit(1);
  }
}
