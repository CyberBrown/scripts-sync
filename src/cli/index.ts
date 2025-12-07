#!/usr/bin/env bun
import chalk from 'chalk';
import { printBanner } from './ui/ascii';
import { choose, MAIN_MENU_OPTIONS } from './ui/menu';
import { isConfigured, ensureDirectories } from '../lib/config';
import { printError, printWarning } from './ui/table';

// Import commands
import { listCommand } from './commands/list';
import { installCommand } from './commands/install';
import { uninstallCommand } from './commands/uninstall';
import { addCommand } from './commands/add';
import { editCommand } from './commands/edit';
import { removeCommand } from './commands/remove';
import { pushCommand } from './commands/push';
import { pullCommand } from './commands/pull';
import { syncCommand } from './commands/sync';
import { runCommand } from './commands/run';
import { sourceCommand } from './commands/source';
import { configCommand } from './commands/config';
import { authCommand } from './commands/auth';
import { extrasCommand } from './commands/extras';

const VERSION = '0.2.0';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  // Ensure directories exist
  ensureDirectories();

  // Handle version flag
  if (command === '-v' || command === '--version') {
    console.log(`scripts-sync v${VERSION}`);
    process.exit(0);
  }

  // Handle help flag
  if (command === '-h' || command === '--help' || command === 'help') {
    printHelp();
    process.exit(0);
  }

  // Check configuration for commands that need it
  const needsConfig = !['config', 'auth', '-v', '--version', '-h', '--help', 'help'].includes(command);
  if (needsConfig && !isConfigured()) {
    printBanner('small');
    printWarning('Scripts Sync is not configured.');
    console.log();
    console.log(chalk.dim('  Run one of the following to get started:'));
    console.log(chalk.cyan('    scripts-sync config') + chalk.dim('  - Set up manually'));
    console.log(chalk.cyan('    scripts-sync auth') + chalk.dim('    - Browser authentication'));
    console.log();
    process.exit(1);
  }

  // Route to command
  switch (command) {
    case undefined:
      // Interactive menu
      await interactiveMenu();
      break;

    case 'list':
    case 'ls':
      await listCommand();
      break;

    case 'install':
    case 'i':
      await installCommand(args[1]);
      break;

    case 'uninstall':
    case 'un':
      await uninstallCommand(args[1]);
      break;

    case 'add':
    case 'new':
    case 'create':
      await addCommand(args[1]);
      break;

    case 'edit':
    case 'e':
      await editCommand(args[1]);
      break;

    case 'remove':
    case 'rm':
    case 'delete':
      await removeCommand(args[1]);
      break;

    case 'push':
      await pushCommand(args[1]);
      break;

    case 'pull':
      await pullCommand(args[1]);
      break;

    case 'sync':
    case 's':
      await syncCommand();
      break;

    case 'run':
    case 'r':
      await runCommand(args[1], args.slice(2));
      break;

    case 'source':
    case 'src':
      await sourceCommand(args[1]);
      break;

    case 'config':
    case 'cfg':
      await configCommand();
      break;

    case 'auth':
    case 'login':
      await authCommand();
      break;

    case 'extras':
    case 'bonus':
    case 'kando':
      await extrasCommand();
      break;

    default:
      printError(`Unknown command: ${command}`);
      console.log(chalk.dim('  Run `scripts-sync --help` for usage.'));
      process.exit(1);
  }
}

async function interactiveMenu(): Promise<void> {
  printBanner('small');

  const selected = await choose(MAIN_MENU_OPTIONS);

  if (!selected) {
    console.log(chalk.dim('  Goodbye!'));
    return;
  }

  console.log();

  switch (selected) {
    case 'list':
      await listCommand();
      break;
    case 'install':
      await installCommand();
      break;
    case 'edit':
      await editCommand();
      break;
    case 'sync':
      await syncCommand();
      break;
    case 'add':
      await addCommand();
      break;
    case 'remove':
      await removeCommand();
      break;
    case 'config':
      await configCommand();
      break;
    case 'extras':
      await extrasCommand();
      break;
  }
}

function printHelp(): void {
  printBanner('small');

  console.log(chalk.bold('  Usage:'));
  console.log(chalk.dim('    scripts-sync [command] [options]'));
  console.log();

  console.log(chalk.bold('  Commands:'));
  console.log(`    ${chalk.cyan('list')}              List all scripts with status`);
  console.log(`    ${chalk.cyan('install')} <name>    Install script to PATH`);
  console.log(`    ${chalk.cyan('uninstall')} <name>  Remove from PATH (keeps cache)`);
  console.log(`    ${chalk.cyan('add')} <name>        Create new script`);
  console.log(`    ${chalk.cyan('edit')} <name>       Edit existing script`);
  console.log(`    ${chalk.cyan('remove')} <name>     Delete script from server`);
  console.log(`    ${chalk.cyan('push')} [name]       Upload local changes`);
  console.log(`    ${chalk.cyan('pull')} [name]       Download from server`);
  console.log(`    ${chalk.cyan('sync')}              Bidirectional sync`);
  console.log(`    ${chalk.cyan('run')} <name>        Run script without installing`);
  console.log(`    ${chalk.cyan('source')} <name>     Output for eval (functions/aliases)`);
  console.log(`    ${chalk.cyan('config')}            Configure settings`);
  console.log(`    ${chalk.cyan('auth')}              Browser-based authentication`);
  console.log(`    ${chalk.cyan('extras')}            Kando pie menu & other tools`);
  console.log();

  console.log(chalk.bold('  Examples:'));
  console.log(chalk.dim('    scripts-sync                    # Interactive menu'));
  console.log(chalk.dim('    scripts-sync list               # Show all scripts'));
  console.log(chalk.dim('    scripts-sync add spark          # Create new script'));
  console.log(chalk.dim('    scripts-sync install spark      # Add to PATH'));
  console.log(chalk.dim('    spark                           # Run installed script'));
  console.log(chalk.dim('    scripts-sync edit spark         # Edit and sync'));
  console.log(chalk.dim('    eval "$(scripts-sync source aliases)"  # Load aliases'));
  console.log();

  console.log(chalk.bold('  Version:'));
  console.log(`    ${VERSION}`);
  console.log();
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
