import chalk from 'chalk';
import { loadConfig, saveConfig, paths } from '../../lib/config';
import { resetApiClient, getApiClient } from '../../lib/api';
import { checkPathSetup, getRecommendedShellFile, getPathExportLine } from '../../lib/path';
import { printSuccess, printError, printInfo, printWarning } from '../ui/table';
import { input, choose, confirm } from '../ui/menu';

export async function configCommand(): Promise<void> {
  const config = loadConfig();

  console.log();
  console.log(chalk.bold('  Current Configuration'));
  console.log(chalk.dim('  ─────────────────────'));
  console.log(`  Server URL: ${chalk.cyan(config.serverUrl)}`);
  console.log(`  API Key:    ${config.apiKey ? chalk.green('Configured') : chalk.yellow('Not set')}`);
  console.log(`  Device ID:  ${chalk.dim(config.deviceId)}`);
  console.log(`  Config dir: ${chalk.dim(paths.configDir)}`);
  console.log();

  // Check PATH setup
  const pathCheck = checkPathSetup();
  if (pathCheck.configured) {
    console.log(`  PATH:       ${chalk.green('Configured')} ${chalk.dim(`(${pathCheck.shellFile})`)}`);
  } else {
    console.log(`  PATH:       ${chalk.yellow('Not configured')}`);
  }
  console.log();

  const action = await choose(
    [
      { label: 'Set server URL', value: 'url' },
      { label: 'Set API key', value: 'key' },
      { label: 'Setup PATH', value: 'path' },
      { label: 'Test connection', value: 'test' },
      { label: 'Done', value: 'done' },
    ],
    'What would you like to configure?'
  );

  if (!action || action === 'done') {
    return;
  }

  switch (action) {
    case 'url':
      await configureServerUrl();
      break;
    case 'key':
      await configureApiKey();
      break;
    case 'path':
      await configurePath();
      break;
    case 'test':
      await testConnection();
      break;
  }
}

async function configureServerUrl(): Promise<void> {
  const config = loadConfig();
  const url = await input('Server URL', config.serverUrl);

  if (!url) {
    console.log(chalk.dim('  Cancelled.'));
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    printError('Invalid URL format.');
    return;
  }

  saveConfig({ serverUrl: url });
  resetApiClient();
  printSuccess('Server URL updated.');
}

async function configureApiKey(): Promise<void> {
  const key = await input('API Key');

  if (!key) {
    console.log(chalk.dim('  Cancelled.'));
    return;
  }

  saveConfig({ apiKey: key });
  resetApiClient();
  printSuccess('API key updated.');

  // Test the key
  const works = await testConnectionQuiet();
  if (works) {
    printSuccess('Connection verified.');
  } else {
    printWarning('Could not verify connection. Check your API key and server URL.');
  }
}

async function configurePath(): Promise<void> {
  const pathCheck = checkPathSetup();

  if (pathCheck.configured) {
    printInfo(`PATH is already configured in ${pathCheck.shellFile}`);
    return;
  }

  const shellFile = getRecommendedShellFile();
  const line = getPathExportLine();

  console.log();
  console.log(chalk.dim('  Add the following to your shell config:'));
  console.log();
  console.log(chalk.cyan(line));
  console.log();

  const autoAdd = await confirm(`Add to ${shellFile}?`);

  if (autoAdd) {
    const { appendFileSync } = await import('fs');
    appendFileSync(shellFile, line);
    printSuccess(`Added to ${shellFile}`);
    printInfo('Run `source ' + shellFile + '` or restart your terminal.');
  } else {
    printInfo('Add the above lines manually to your shell config.');
  }
}

async function testConnection(): Promise<void> {
  console.log(chalk.dim('  Testing connection...'));

  try {
    const api = getApiClient();
    const works = await api.healthCheck();

    if (works) {
      printSuccess('Connection successful!');

      // Try to list scripts as additional check
      const scripts = await api.listScripts();
      printInfo(`Found ${scripts.length} script(s) on server.`);
    } else {
      printError('Connection failed. Check your server URL and API key.');
    }
  } catch (error) {
    printError(error instanceof Error ? error.message : 'Connection failed.');
  }
}

async function testConnectionQuiet(): Promise<boolean> {
  try {
    const api = getApiClient();
    return await api.healthCheck();
  } catch {
    return false;
  }
}
