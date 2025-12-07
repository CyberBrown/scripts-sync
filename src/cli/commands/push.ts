import chalk from 'chalk';
import { pushScript, pushAll } from '../../lib/sync';
import { listCachedScripts, getCachedScript } from '../../lib/cache';
import { printSuccess, printError, printWarning, printSyncResult } from '../ui/table';
import { choose } from '../ui/menu';

export async function pushCommand(name?: string): Promise<void> {
  try {
    if (name) {
      // Push specific script
      const cached = getCachedScript(name);
      if (!cached) {
        printError(`Script '${name}' not found in cache.`);
        process.exit(1);
      }

      console.log(chalk.dim(`  Pushing '${name}'...`));
      await pushScript(name);
      printSuccess(`Pushed '${name}' to server.`);
    } else {
      // Show selection or push all modified
      const cached = listCachedScripts();
      const modified = cached.filter(
        (s) => s.local_modified_at && s.local_modified_at > s.updated_at
      );

      if (modified.length === 0) {
        console.log(chalk.dim('  No local changes to push.'));
        return;
      }

      console.log(chalk.dim(`  Found ${modified.length} modified script(s).`));

      const options = [
        { label: 'Push all', value: '__all__', description: `${modified.length} scripts` },
        ...modified.map((s) => ({
          label: s.name,
          value: s.name,
          description: s.description || undefined,
        })),
      ];

      const selected = await choose(options, 'What to push?');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }

      if (selected === '__all__') {
        console.log(chalk.dim('  Pushing all changes...'));
        const result = await pushAll();
        printSyncResult(result);
      } else {
        console.log(chalk.dim(`  Pushing '${selected}'...`));
        await pushScript(selected);
        printSuccess(`Pushed '${selected}' to server.`);
      }
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to push');
    process.exit(1);
  }
}
