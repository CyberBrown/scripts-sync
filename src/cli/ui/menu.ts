import chalk from 'chalk';
import { spawn } from 'child_process';
import { createInterface } from 'readline';

interface MenuOption {
  label: string;
  value: string;
  description?: string;
}

async function hasGum(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', ['gum']);
    proc.on('close', (code) => resolve(code === 0));
  });
}

async function gumChoose(options: MenuOption[], prompt?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const args = ['choose'];
    if (prompt) {
      args.push('--header', prompt);
    }
    args.push('--cursor.foreground', '39');
    args.push('--selected.foreground', '39');

    const items = options.map((o) => `${o.label}  ${chalk.dim(o.description || '')}`);

    const proc = spawn('gum', [...args, ...items], {
      stdio: ['inherit', 'pipe', 'inherit'],
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0 || !output.trim()) {
        resolve(null);
        return;
      }
      // Extract just the label (before the spaces and description)
      const selected = output.trim().split('  ')[0];
      const option = options.find((o) => o.label === selected);
      resolve(option?.value || null);
    });
  });
}

async function gumInput(prompt: string, placeholder?: string): Promise<string | null> {
  return new Promise((resolve) => {
    const args = ['input', '--header', prompt];
    if (placeholder) {
      args.push('--placeholder', placeholder);
    }
    args.push('--cursor.foreground', '39');

    const proc = spawn('gum', args, {
      stdio: ['inherit', 'pipe', 'inherit'],
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      resolve(output.trim());
    });
  });
}

async function gumConfirm(prompt: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('gum', ['confirm', prompt], {
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function fallbackChoose(options: MenuOption[], prompt?: string): Promise<string | null> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (prompt) {
      console.log(`\n${prompt}\n`);
    }

    options.forEach((option, index) => {
      const desc = option.description ? chalk.dim(` - ${option.description}`) : '';
      console.log(`  ${chalk.cyan(index + 1)}. ${option.label}${desc}`);
    });

    console.log();
    rl.question(chalk.dim('  Enter number (or q to quit): '), (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'q') {
        resolve(null);
        return;
      }

      const num = parseInt(answer, 10);
      if (num >= 1 && num <= options.length) {
        resolve(options[num - 1].value);
      } else {
        resolve(null);
      }
    });
  });
}

async function fallbackInput(prompt: string, placeholder?: string): Promise<string | null> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const hint = placeholder ? chalk.dim(` (${placeholder})`) : '';
    rl.question(`${prompt}${hint}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || null);
    });
  });
}

async function fallbackConfirm(prompt: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${prompt} [y/N]: `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export async function choose(options: MenuOption[], prompt?: string): Promise<string | null> {
  if (await hasGum()) {
    return gumChoose(options, prompt);
  }
  return fallbackChoose(options, prompt);
}

export async function input(prompt: string, placeholder?: string): Promise<string | null> {
  if (await hasGum()) {
    return gumInput(prompt, placeholder);
  }
  return fallbackInput(prompt, placeholder);
}

export async function confirm(prompt: string): Promise<boolean> {
  if (await hasGum()) {
    return gumConfirm(prompt);
  }
  return fallbackConfirm(prompt);
}

export const MAIN_MENU_OPTIONS: MenuOption[] = [
  { label: 'list', value: 'list', description: 'View all items' },
  { label: 'install', value: 'install', description: 'Install an item' },
  { label: 'edit', value: 'edit', description: 'Edit an item' },
  { label: 'sync', value: 'sync', description: 'Sync with server' },
  { label: 'add', value: 'add', description: 'Create new item' },
  { label: 'remove', value: 'remove', description: 'Delete an item' },
  { label: 'config', value: 'config', description: 'Configure settings' },
  { label: 'extras', value: 'extras', description: 'Kando sync & other tools' },
];

export const EXTRAS_MENU_OPTIONS: MenuOption[] = [
  { label: 'kando push', value: 'kando-push', description: 'Upload Kando config to cloud' },
  { label: 'kando pull', value: 'kando-pull', description: 'Download Kando config from cloud' },
  { label: 'back', value: 'back', description: 'Return to main menu' },
];
