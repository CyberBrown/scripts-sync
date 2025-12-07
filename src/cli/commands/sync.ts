import chalk from 'chalk';
import { syncAll } from '../../lib/sync';
import { printSyncResult, printError } from '../ui/table';
import { printBanner } from '../ui/ascii';

export async function syncCommand(): Promise<void> {
  try {
    console.log(chalk.dim('  Syncing with server...'));
    const result = await syncAll();
    if (result.pulled > 0 || result.pushed > 0) {
      printBanner('update');
    }
    printSyncResult(result);
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to sync');
    process.exit(1);
  }
}
