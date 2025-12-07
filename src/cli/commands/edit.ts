import chalk from 'chalk';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getApiClient } from '../../lib/api';
import { pullScript } from '../../lib/sync';
import { saveToCache, getCachedScript } from '../../lib/cache';
import { printSuccess, printError, printWarning } from '../ui/table';
import { choose } from '../ui/menu';

export async function editCommand(name?: string): Promise<void> {
  try {
    const api = getApiClient();
    let scriptName = name;

    // If no name provided, show selection
    if (!scriptName) {
      const scripts = await api.listScripts();

      if (scripts.length === 0) {
        printWarning('No scripts available to edit.');
        return;
      }

      const options = scripts.map((s) => ({
        label: s.name,
        value: s.name,
        description: s.description || undefined,
      }));

      const selected = await choose(options, 'Select script to edit:');
      if (!selected) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = selected;
    }

    // Pull latest version
    console.log(chalk.dim(`  Pulling latest '${scriptName}'...`));
    const script = await pullScript(scriptName);

    // Create temp file
    const tmpFile = join(tmpdir(), `scripts-sync-${scriptName}-${Date.now()}.sh`);
    writeFileSync(tmpFile, script.content);

    // Open in editor
    const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
    console.log(chalk.dim(`  Opening in ${editor}...`));

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(editor, [tmpFile], { stdio: 'inherit' });
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Editor exited with code ${code}`));
      });
    });

    // Read modified content
    const newContent = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    // Check if content changed
    if (newContent === script.content) {
      console.log(chalk.dim('  No changes made.'));
      return;
    }

    // Validate script syntax
    console.log(chalk.dim('  Validating script...'));
    const valid = await validateScript(newContent);
    if (!valid) {
      printWarning('Script has syntax errors but will be saved anyway.');
    }

    // Push to server
    console.log(chalk.dim('  Uploading changes...'));
    const updated = await api.updateScript(scriptName, {
      content: newContent,
    });

    // Update cache
    saveToCache(updated);

    printSuccess(`Updated '${scriptName}'.`);
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to edit script');
    process.exit(1);
  }
}

async function validateScript(content: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('bash', ['-n'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stdin.write(content);
    proc.stdin.end();

    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}
