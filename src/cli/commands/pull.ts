import chalk from 'chalk';
import { pullScript, pullAll } from '../../lib/sync';
import { getApiClient } from '../../lib/api';
import { printSuccess, printError, printSyncResult } from '../ui/table';
import { choose } from '../ui/menu';

export async function pullCommand(name?: string): Promise<void> {
  try {
    if (name) {
      // Pull specific script
      console.log(chalk.dim(`  Pulling '${name}'...`));
      await pullScript(name);
      printSuccess(`Pulled '${name}' from server.`);
    } else {
      // Show selection or pull all
      const api = getApiClient();
      const scripts = await api.listScripts();

      if (scripts.length === 0) {
        console.log(chalk.dim('  No scripts on server.'));
        return;
      }

      const options = [
        { label: 'Pull all', value: '__all__', description: `${scripts.length} scripts` },
        ...scripts.map((s) => ({
          label: s.name,
          value: s.name,
          description: s.description || undefined,
        })),
      ];

      const selected = await choose(options, 'What to pull?');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }

      if (selected === '__all__') {
        console.log(chalk.dim('  Pulling all scripts...'));
        const result = await pullAll();
        printSyncResult(result);
      } else {
        console.log(chalk.dim(`  Pulling '${selected}'...`));
        await pullScript(selected);
        printSuccess(`Pulled '${selected}' from server.`);
      }
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to pull');
    process.exit(1);
  }
}
