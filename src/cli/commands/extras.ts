import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { choose, confirm, EXTRAS_MENU_OPTIONS } from '../ui/menu';
import { printSuccess, printError, printWarning, printInfo } from '../ui/table';
import { getApiClient } from '../../lib/api';

const KANDO_CONFIG_NAME = 'kando-menus';
const KANDO_SETTINGS_NAME = 'kando-settings';

function getKandoConfigPath(): string {
  // Check for Flatpak installation first
  const flatpakPath = join(homedir(), '.var/app/menu.kando.Kando/config/kando');
  if (existsSync(flatpakPath)) {
    return flatpakPath;
  }
  // Standard Linux path
  return join(homedir(), '.config/kando');
}

function isKandoInstalled(): boolean {
  return existsSync(getKandoConfigPath());
}

async function pushKandoConfig(): Promise<void> {
  const configPath = getKandoConfigPath();
  const menusPath = join(configPath, 'menus.json');
  const settingsPath = join(configPath, 'config.json');

  if (!existsSync(menusPath)) {
    printError('Kando menus.json not found. Install and configure Kando first.');
    console.log(chalk.dim('  Install via Flatpak: flatpak install flathub menu.kando.Kando'));
    return;
  }

  const api = getApiClient();

  try {
    // Push menus.json
    const menusContent = readFileSync(menusPath, 'utf-8');
    try {
      await api.getScript(KANDO_CONFIG_NAME);
      await api.updateScript(KANDO_CONFIG_NAME, { content: menusContent });
    } catch {
      await api.createScript({
        name: KANDO_CONFIG_NAME,
        content: menusContent,
        description: 'Kando menus configuration',
        script_type: 'source',
      });
    }
    printSuccess('Pushed Kando menus.json');

    // Push config.json if exists
    if (existsSync(settingsPath)) {
      const settingsContent = readFileSync(settingsPath, 'utf-8');
      try {
        await api.getScript(KANDO_SETTINGS_NAME);
        await api.updateScript(KANDO_SETTINGS_NAME, { content: settingsContent });
      } catch {
        await api.createScript({
          name: KANDO_SETTINGS_NAME,
          content: settingsContent,
          description: 'Kando settings',
          script_type: 'source',
        });
      }
      printSuccess('Pushed Kando config.json');
    }

    printSuccess('Kando config synced to cloud');
  } catch (err) {
    printError(`Failed to push: ${err}`);
  }
}

async function pullKandoConfig(): Promise<void> {
  const configPath = getKandoConfigPath();

  if (!isKandoInstalled()) {
    printWarning('Kando config directory not found.');
    console.log(chalk.dim('  Install Kando first: flatpak install flathub menu.kando.Kando'));
    console.log(chalk.dim('  Then run it once to create the config directory.'));
    return;
  }

  mkdirSync(configPath, { recursive: true });

  const api = getApiClient();

  try {
    // Pull menus.json
    try {
      const menus = await api.getScript(KANDO_CONFIG_NAME);
      const menusPath = join(configPath, 'menus.json');

      if (existsSync(menusPath)) {
        const overwrite = await confirm('Overwrite local menus.json?');
        if (!overwrite) {
          printWarning('Skipped menus.json');
        } else {
          writeFileSync(menusPath, menus.content);
          printSuccess('Pulled menus.json');
        }
      } else {
        writeFileSync(menusPath, menus.content);
        printSuccess('Pulled menus.json');
      }
    } catch {
      printWarning('No Kando menus found in cloud. Push your config first.');
    }

    // Pull config.json
    try {
      const settings = await api.getScript(KANDO_SETTINGS_NAME);
      const settingsPath = join(configPath, 'config.json');

      if (existsSync(settingsPath)) {
        const overwrite = await confirm('Overwrite local config.json?');
        if (!overwrite) {
          printWarning('Skipped config.json');
        } else {
          writeFileSync(settingsPath, settings.content);
          printSuccess('Pulled config.json');
        }
      } else {
        writeFileSync(settingsPath, settings.content);
        printSuccess('Pulled config.json');
      }
    } catch {
      // config.json is optional
    }

    console.log(chalk.dim('\n  Restart Kando to apply changes'));
  } catch (err) {
    printError(`Failed to pull: ${err}`);
  }
}

export async function extrasCommand(): Promise<void> {
  while (true) {
    console.log();
    console.log(chalk.bold('  Extras'));
    console.log(chalk.dim('  ──────'));

    const selected = await choose(EXTRAS_MENU_OPTIONS);

    if (!selected || selected === 'back') {
      return;
    }

    console.log();

    switch (selected) {
      case 'kando-push':
        await pushKandoConfig();
        break;
      case 'kando-pull':
        await pullKandoConfig();
        break;
    }
  }
}
