import chalk from 'chalk';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getApiClient } from '../../lib/api';
import { saveToCache } from '../../lib/cache';
import { printSuccess, printError, printWarning } from '../ui/table';
import { input, choose } from '../ui/menu';

const SCRIPT_TEMPLATE = `#!/usr/bin/env bash
# Script: {name}
# Description: {description}
# Created: {date}

set -euo pipefail

# Your script here
echo "Hello from {name}!"
`;

export async function addCommand(name?: string): Promise<void> {
  try {
    // Get script name
    let scriptName: string | undefined = name;
    if (!scriptName) {
      const inputName = await input('Script name', 'my-script');
      if (!inputName) {
        console.log(chalk.dim('  Cancelled.'));
        return;
      }
      scriptName = inputName;
    }

    // Validate name
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(scriptName)) {
      printError('Invalid script name. Use only alphanumeric characters, hyphens, and underscores.');
      process.exit(1);
    }

    // Check if already exists
    const api = getApiClient();
    try {
      await api.getScript(scriptName);
      printError(`Script '${scriptName}' already exists. Use 'edit' to modify it.`);
      process.exit(1);
    } catch {
      // Good - doesn't exist
    }

    // Get description
    const description = await input('Description (optional)', 'What does this script do?');

    // Get script type
    const scriptType = await choose(
      [
        { label: 'executable', value: 'executable', description: 'Standalone script' },
        { label: 'source', value: 'source', description: 'Functions/aliases to source' },
        { label: 'function', value: 'function', description: 'Single function' },
      ],
      'Script type:'
    );

    if (!scriptType) {
      console.log(chalk.dim('  Cancelled.'));
      return;
    }

    // Create temp file with template
    const tmpFile = join(tmpdir(), `config-sync-${scriptName}-${Date.now()}.sh`);
    const template = SCRIPT_TEMPLATE
      .replace(/{name}/g, scriptName)
      .replace(/{description}/g, description || 'No description')
      .replace(/{date}/g, new Date().toISOString().split('T')[0]);

    writeFileSync(tmpFile, template);

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

    // Read content
    const content = readFileSync(tmpFile, 'utf-8');
    unlinkSync(tmpFile);

    // Check if content was modified
    if (content === template) {
      printWarning('Script was not modified. Aborting.');
      return;
    }

    // Validate script syntax
    console.log(chalk.dim('  Validating script...'));
    const valid = await validateScript(content);
    if (!valid) {
      printWarning('Script has syntax errors. Continue anyway?');
      // Could add confirmation here
    }

    // Push to server
    console.log(chalk.dim('  Uploading to server...'));
    const script = await api.createScript({
      name: scriptName,
      content,
      description: description ?? undefined,
      script_type: scriptType as 'executable' | 'source' | 'function',
    });

    // Save to cache
    saveToCache(script);

    printSuccess(`Created script '${scriptName}'.`);
    console.log(chalk.dim(`  Run 'cs install ${scriptName}' to add to PATH.`));
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Failed to create script');
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
