import { getScriptStatuses } from '../../lib/sync';
import { printScriptTable, printError } from '../ui/table';

export async function listCommand(): Promise<void> {
  try {
    const scripts = await getScriptStatuses();
    printScriptTable(scripts);
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to list scripts');
    process.exit(1);
  }
}
