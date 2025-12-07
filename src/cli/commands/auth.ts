import chalk from 'chalk';
import { createServer } from 'http';
import { spawn } from 'child_process';
import { saveConfig, loadConfig } from '../../lib/config';
import { resetApiClient, getApiClient } from '../../lib/api';
import { printSuccess, printError, printInfo } from '../ui/table';

const AUTH_PORT = 19284;

export async function authCommand(): Promise<void> {
  const config = loadConfig();

  console.log();
  console.log(chalk.bold('  Browser Authentication'));
  console.log(chalk.dim('  ─────────────────────'));
  console.log();
  printInfo('This will open your browser to authenticate.');
  console.log();

  // Start local server to receive the callback
  const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${AUTH_PORT}`);

    if (url.pathname === '/callback') {
      const apiKey = url.searchParams.get('key');

      if (apiKey) {
        saveConfig({ apiKey });
        resetApiClient();

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Scripts Sync - Authenticated</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #1a1a2e;
                color: #eee;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: #16213e;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
              }
              h1 { color: #4ecca3; margin-bottom: 10px; }
              p { color: #aaa; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Authenticated!</h1>
              <p>You can close this window and return to your terminal.</p>
            </div>
          </body>
          </html>
        `);

        setTimeout(() => {
          server.close();
          printSuccess('Authentication successful!');
          verifyConnection();
        }, 100);
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing API key');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(AUTH_PORT, () => {
    const authUrl = `${config.serverUrl}/auth?callback=http://localhost:${AUTH_PORT}/callback`;

    console.log(chalk.dim(`  Opening browser to: ${authUrl}`));
    console.log();
    console.log(chalk.dim('  Waiting for authentication...'));

    // Try to open browser
    openBrowser(authUrl);
  });

  // Timeout after 5 minutes
  setTimeout(() => {
    server.close();
    console.log();
    printError('Authentication timed out.');
    process.exit(1);
  }, 5 * 60 * 1000);
}

function openBrowser(url: string): void {
  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  spawn(command, args, { stdio: 'ignore', detached: true }).unref();
}

async function verifyConnection(): Promise<void> {
  try {
    const api = getApiClient();
    const works = await api.healthCheck();

    if (works) {
      const scripts = await api.listScripts();
      printInfo(`Connected. Found ${scripts.length} script(s) on server.`);
    }
  } catch {
    printError('Could not verify connection.');
  }

  process.exit(0);
}
