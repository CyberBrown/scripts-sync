import chalk from 'chalk';
import { pullScript } from '../../lib/sync';
import { installScript, isInstalled } from '../../lib/path';
import { isCached } from '../../lib/cache';
import { printSuccess, printError, printWarning } from '../ui/table';
import { choose } from '../ui/menu';
import { getApiClient } from '../../lib/api';
import { printBanner } from '../ui/ascii';

export async function installCommand(name?: string): Promise<void> {
  try {
    let scriptName = name;

    // If no name provided, show selection
    if (!scriptName) {
      const api = getApiClient();
      const scripts = await api.listScripts();

      if (scripts.length === 0) {
        printWarning('No scripts available to install.');
        return;
      }

      const options = scripts.map((s) => ({
        label: s.name,
        value: s.name,
        description: s.description || undefined,
      }));

      const selected = await choose(options, 'Select script to install:');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = selected;
    }

    // Check if already installed
    if (isInstalled(scriptName)) {
      printWarning(`'${scriptName}' is already installed.`);
      return;
    }

    // Pull if not cached
    if (!isCached(scriptName)) {
      console.log(chalk.dim(`  Downloading '${scriptName}'...`));
      await pullScript(scriptName);
    }

    // Install
    const success = installScript(scriptName);
    if (success) {
      printBanner('install');
      printSuccess(`Installed '${scriptName}'. You can now run it with: ${chalk.cyan(scriptName)}`);
    } else {
      printError(`Failed to install '${scriptName}'.`);
      process.exit(1);
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to install script');
    process.exit(1);
  }
}
