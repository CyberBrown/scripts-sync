import chalk from 'chalk';
import { uninstallScript, isInstalled, listInstalledScripts } from '../../lib/path';
import { printSuccess, printError, printWarning } from '../ui/table';
import { choose, confirm } from '../ui/menu';

export async function uninstallCommand(name?: string): Promise<void> {
  try {
    let scriptName = name;

    // If no name provided, show selection
    if (!scriptName) {
      const installed = listInstalledScripts();

      if (installed.length === 0) {
        printWarning('No scripts are currently installed.');
        return;
      }

      const options = installed.map((s) => ({
        label: s,
        value: s,
      }));

      const selected = await choose(options, 'Select script to uninstall:');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = selected;
    }

    // Check if installed
    if (!isInstalled(scriptName)) {
      printWarning(`'${scriptName}' is not installed.`);
      return;
    }

    // Confirm
    const confirmed = await confirm(`Uninstall '${scriptName}'?`);
    if (!confirmed) {
      console.log(chalk.dim('  Cancelled.'));
      return;
    }

    // Uninstall
    const success = uninstallScript(scriptName);
    if (success) {
      printSuccess(`Uninstalled '${scriptName}'. Script remains in cache for reinstall.`);
    } else {
      printError(`Failed to uninstall '${scriptName}'.`);
      process.exit(1);
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to uninstall script');
    process.exit(1);
  }
}
