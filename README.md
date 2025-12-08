# Config Sync

Personal environment sync tool powered by **Logos Flux**. Sync scripts, aliases, functions, and config files across machines via Cloudflare D1. Edit on one terminal, available everywhere after a sync.

```
        ██╗      ██████╗  ██████╗  ██████╗ ███████╗
        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝
        ██║     ██║   ██║██║  ███╗██║   ██║███████╗
        ██║     ██║   ██║██║   ██║██║   ██║╚════██║
        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║
        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝

                ███████╗██╗     ██╗   ██╗██╗  ██╗
                ██╔════╝██║     ██║   ██║╚██╗██╔╝
                █████╗  ██║     ██║   ██║ ╚███╔╝
                ██╔══╝  ██║     ██║   ██║ ██╔██╗
                ██║     ███████╗╚██████╔╝██╔╝ ██╗
                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝

                           Φ⥁○⧖∵
```

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/CyberBrown/config-sync/master/install.sh | bash

# Restart terminal, then authenticate
cs auth

# Create your first script
cs add spark

# Install to PATH
cs install spark

# Run it
spark
```

## Commands

| Command | Description |
|---------|-------------|
| `cs` | Interactive menu |
| `cs list` | List all items with status |
| `cs install <name>` | Install item to system |
| `cs uninstall <name>` | Remove from system (keeps cache) |
| `cs add <name>` | Create new item |
| `cs edit <name>` | Edit existing item |
| `cs remove <name>` | Delete from server |
| `cs push [name]` | Upload local changes |
| `cs pull [name]` | Download from server |
| `cs sync` | Bidirectional sync |
| `cs run <name>` | Run without installing |
| `cs source <name>` | Output for eval |
| `cs config` | Configure settings |
| `cs auth` | Browser authentication |
| `cs extras` | Kando config sync |

## Item Types

- **executable** (default): Standalone scripts that run in a subshell
- **source**: Scripts with functions/aliases to load into your shell
- **function**: Single function definitions

### Using Source Scripts

```bash
# Load aliases/functions into your shell
eval "$(cs source my-aliases)"

# Add to .bashrc/.zshrc for auto-load
echo 'eval "$(cs source my-aliases)"' >> ~/.bashrc
```

## Status Indicators

| Status | Meaning |
|--------|---------|
| `installed` | Ready to run |
| `cached` | Downloaded, not installed |
| `not synced` | On server, not downloaded |
| `local only` | Local changes not pushed |
| `modified` | Local differs from server |

## Configuration

Config is stored in `~/.config-sync/config.json`:

```json
{
  "serverUrl": "https://config-sync-api.solamp.workers.dev",
  "apiKey": "your-api-key",
  "deviceId": "machine-abc123"
}
```

## Local Files

```
~/.config-sync/
  cache/           # Downloaded content
    spark.sh
    my-script.sh
  .bin/            # Installed executables (in PATH)
    spark
    my-script
  config.json      # Configuration
  .last-sync       # Last sync timestamp
```

## Architecture

Config Sync is designed as two separate repos:

1. **config-sync** (this repo) - The open-source sync engine
2. **Your config library** (e.g., [chris-config](https://github.com/CyberBrown/chris-config)) - Your personal scripts, aliases, configs

This separation keeps the tool generic while your personal config remains yours.

## Deploying Your Own Worker

1. Create D1 database:
```bash
cd worker
wrangler d1 create config-sync-db
```

2. Update `wrangler.toml` with your database ID

3. Initialize schema:
```bash
wrangler d1 execute config-sync-db --file=src/db/schema.sql
```

4. Deploy:
```bash
wrangler deploy
```

## Development

```bash
# Install dependencies
bun install

# Run CLI locally
bun run src/cli/index.ts list

# Build standalone binary
bun run build

# Run worker locally
bun run worker:dev
```

## Extras

The `cs extras` command provides optional integrations:

- **Kando push/pull** - Sync your Kando pie menu configuration across machines

Kando must be installed separately via Flatpak:
```bash
flatpak install flathub menu.kando.Kando
```

## License

MIT
