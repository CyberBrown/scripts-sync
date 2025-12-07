# Scripts Sync

Cloud-synced script manager powered by **Logos Flux**. Edit a script on terminal 1, it's immediately available on terminal 2 after a sync. One-word commands.

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/CyberBrown/scripts-sync/master/install.sh | bash

# Restart terminal, then authenticate
scripts-sync auth

# Create your first script
scripts-sync add spark

# Install to PATH
scripts-sync install spark

# Run it
spark
```

## Commands

| Command | Description |
|---------|-------------|
| `scripts-sync` | Interactive menu |
| `scripts-sync list` | List all scripts with status |
| `scripts-sync install <name>` | Install script to PATH |
| `scripts-sync uninstall <name>` | Remove from PATH (keeps cache) |
| `scripts-sync add <name>` | Create new script |
| `scripts-sync edit <name>` | Edit existing script |
| `scripts-sync remove <name>` | Delete from server |
| `scripts-sync push [name]` | Upload local changes |
| `scripts-sync pull [name]` | Download from server |
| `scripts-sync sync` | Bidirectional sync |
| `scripts-sync run <name>` | Run without installing |
| `scripts-sync source <name>` | Output for eval |
| `scripts-sync config` | Configure settings |
| `scripts-sync auth` | Browser authentication |

## Script Types

- **executable** (default): Standalone scripts that run in a subshell
- **source**: Scripts with functions/aliases to load into your shell
- **function**: Single function definitions

### Using Source Scripts

```bash
# Load aliases/functions into your shell
eval "$(scripts-sync source my-aliases)"

# Add to .bashrc/.zshrc for auto-load
echo 'eval "$(scripts-sync source my-aliases)"' >> ~/.bashrc
```

## Status Indicators

| Status | Meaning |
|--------|---------|
| `installed` | In PATH, ready to run |
| `cached` | Downloaded, not in PATH |
| `not synced` | On server, not downloaded |
| `local only` | Local changes not pushed |
| `modified` | Local differs from server |

## Configuration

Config is stored in `~/.scripts-sync/config.json`:

```json
{
  "serverUrl": "https://scripts-sync-api.solamp.workers.dev",
  "apiKey": "your-api-key",
  "deviceId": "machine-abc123"
}
```

## Local Files

```
~/.scripts-sync/
  cache/           # Downloaded script content
    spark.sh
    my-script.sh
  .bin/            # Installed executables (in PATH)
    spark
    my-script
  config.json      # Configuration
  .last-sync       # Last sync timestamp
```

## Deploying the Worker

1. Create D1 database:
```bash
cd worker
wrangler d1 create scripts-sync-db
```

2. Update `wrangler.toml` with database ID

3. Initialize schema:
```bash
wrangler d1 execute scripts-sync-db --file=src/db/schema.sql
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

## Optional Extras

During installation, you can optionally set up:

- **Kando Pie Menu** - Quick launcher triggered by Ctrl+Space with customizable shortcuts
- **Middle Mouse → Kando** - Maps middle mouse button to open Kando for rapid access

These are completely optional and can be skipped during install.

## License

MIT
