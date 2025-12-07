import chalk from 'chalk';
import { getApiClient } from '../../lib/api';
import { removeFromCache } from '../../lib/cache';
import { uninstallScript, isInstalled } from '../../lib/path';
import { printSuccess, printError, printWarning } from '../ui/table';
import { choose, confirm } from '../ui/menu';

export async function removeCommand(name?: string): Promise<void> {
  try {
    const api = getApiClient();
    let scriptName = name;

    // If no name provided, show selection
    if (!scriptName) {
      const scripts = await api.listScripts();

      if (scripts.length === 0) {
        printWarning('No scripts available to remove.');
        return;
      }

      const options = scripts.map((s) => ({
        label: s.name,
        value: s.name,
        description: s.description || undefined,
      }));

      const selected = await choose(options, 'Select script to remove:');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = selected;
    }

    // Confirm deletion
    console.log();
    console.log(chalk.yellow(`  This will permanently delete '${scriptName}' from the server.`));
    const confirmed = await confirm('Are you sure?');
    if (!confirmed) {
      console.log(chalk.dim('  Cancelled.'));
      return;
    }

    // Delete from server
    console.log(chalk.dim('  Deleting from server...'));
    await api.deleteScript(scriptName);

    // Uninstall if installed
    if (isInstalled(scriptName)) {
      uninstallScript(scriptName);
    }

    // Remove from cache
    removeFromCache(scriptName);

    printSuccess(`Removed '${scriptName}'.`);
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to remove script');
    process.exit(1);
  }
}
