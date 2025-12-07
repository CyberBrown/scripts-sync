import chalk from 'chalk';
import { execSync, spawnSync } from 'child_process';
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
  // Check Flatpak
  try {
    const result = spawnSync('flatpak', ['list'], { encoding: 'utf-8' });
    if (result.stdout?.includes('menu.kando.Kando')) {
      return true;
    }
  } catch {}

  // Check if config exists
  return existsSync(getKandoConfigPath());
}

async function setupKando(): Promise<void> {
  printInfo('Checking Kando installation...');

  if (isKandoInstalled()) {
    printSuccess('Kando is already installed');
  } else {
    printWarning('Kando not found. Installing via Flatpak...');
    try {
      execSync('flatpak install -y flathub menu.kando.Kando', { stdio: 'inherit' });
      printSuccess('Kando installed');
    } catch {
      printError('Failed to install Kando. Install manually from flathub.');
      return;
    }
  }

  const configPath = getKandoConfigPath();
  mkdirSync(join(configPath, 'icon-themes/custom'), { recursive: true });

  // Copy Proton Pass icon if available
  const protonIconSrc = '/usr/share/pixmaps/proton-pass.png';
  if (existsSync(protonIconSrc)) {
    try {
      execSync(`cp "${protonIconSrc}" "${join(configPath, 'icon-themes/custom/proton-pass.svg')}"`, { stdio: 'pipe' });
    } catch {}
  }

  printSuccess('Kando configured');
  console.log(chalk.dim('  Use Ctrl+Space to open Kando'));
  console.log(chalk.dim('  Run `scripts-sync extras` → kando push to sync your config'));
}

async function pushKandoConfig(): Promise<void> {
  const configPath = getKandoConfigPath();
  const menusPath = join(configPath, 'menus.json');
  const settingsPath = join(configPath, 'config.json');

  if (!existsSync(menusPath)) {
    printError('Kando menus.json not found. Set up Kando first.');
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
    const install = await confirm('Kando not installed. Install it first?');
    if (install) {
      await setupKando();
    } else {
      return;
    }
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

async function setupMouseMapping(): Promise<void> {
  printInfo('Setting up middle mouse → Ctrl+Space mapping...');

  // Check if input-remapper is installed
  const hasInputRemapper = spawnSync('which', ['input-remapper-control']).status === 0;

  if (!hasInputRemapper) {
    printWarning('input-remapper not found. Installing...');
    try {
      execSync('sudo apt install -y input-remapper', { stdio: 'inherit' });
    } catch {
      printError('Failed to install input-remapper. Install manually.');
      return;
    }
  }

  // Detect mouse
  let mouseName = '';
  try {
    const devices = readFileSync('/proc/bus/input/devices', 'utf-8');
    const mouseMatch = devices.match(/N: Name="([^"]+)"[\s\S]*?H: Handlers=[^\n]*mouse/);
    if (mouseMatch) {
      mouseName = mouseMatch[1];
    }
  } catch {}

  if (!mouseName) {
    printError('Could not detect mouse. Configure manually with input-remapper-gtk');
    return;
  }

  printInfo(`Detected mouse: ${mouseName}`);

  // Create config directories
  const userConfigDir = join(homedir(), '.config/input-remapper-2/presets', mouseName);
  mkdirSync(userConfigDir, { recursive: true });

  // Create preset
  const preset = [{
    input_combination: [{
      type: 1,
      code: 274,
      origin_hash: mouseName
    }],
    target_uinput: 'keyboard',
    output_symbol: 'KEY_LEFTCTRL + KEY_SPACE',
    mapping_type: 'key_macro'
  }];

  writeFileSync(join(userConfigDir, 'kando.json'), JSON.stringify(preset, null, 2));

  // Create autoload config
  const configJson = {
    version: '2.1.1',
    autoload: {
      [mouseName]: 'kando'
    }
  };
  writeFileSync(join(homedir(), '.config/input-remapper-2/config.json'), JSON.stringify(configJson, null, 2));

  // Copy to root (for daemon)
  try {
    execSync(`sudo mkdir -p "/root/.config/input-remapper-2/presets/${mouseName}"`, { stdio: 'pipe' });
    execSync(`sudo cp "${join(userConfigDir, 'kando.json')}" "/root/.config/input-remapper-2/presets/${mouseName}/"`, { stdio: 'pipe' });
    execSync(`sudo cp "${join(homedir(), '.config/input-remapper-2/config.json')}" /root/.config/input-remapper-2/`, { stdio: 'pipe' });
  } catch {}

  // Restart daemon and load
  try {
    execSync('sudo systemctl restart input-remapper-daemon', { stdio: 'pipe' });
    execSync('input-remapper-control --command autoload 2>/dev/null', { stdio: 'pipe' });
    printSuccess('Middle mouse button → Ctrl+Space (Kando)');
  } catch {
    printWarning('Mapping saved. Restart input-remapper daemon to apply.');
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
      case 'kando-setup':
        await setupKando();
        break;
      case 'kando-push':
        await pushKandoConfig();
        break;
      case 'kando-pull':
        await pullKandoConfig();
        break;
      case 'mouse-setup':
        await setupMouseMapping();
        break;
    }
  }
}
