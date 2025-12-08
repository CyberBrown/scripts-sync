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

## Install

One command installs everything (Bun, dependencies, binary):

```bash
curl -fsSL https://raw.githubusercontent.com/CyberBrown/config-sync/master/install.sh | bash
```

The installer will:
- Install [Bun](https://bun.sh) if not present
- Clone and build the CLI
- Set up `~/.config-sync/`
- Add to your PATH
- Prompt for your API key

After install:
```bash
source ~/.bashrc   # or restart terminal
cs sync            # sync your scripts
cs list            # see what's available
```

## Quick Start

```bash
# Create a new script
cs add my-script

# Install to PATH
cs install my-script

# Run it
my-script

# Edit and sync
cs edit my-script
```

## Commands

| Command | Description |
|---------|-------------|
| `cs` | Interactive menu |
| `cs list` | List all items with status |
| `cs sync` | Bidirectional sync |
| `cs install <name>` | Install item to PATH |
| `cs uninstall <name>` | Remove from PATH |
| `cs add <name>` | Create new item |
| `cs edit <name>` | Edit existing item |
| `cs remove <name>` | Delete from server |
| `cs push [name]` | Upload local changes |
| `cs pull [name]` | Download from server |
| `cs run <name>` | Run without installing |
| `cs source <name>` | Output for eval |
| `cs config` | Configure settings |
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
  "deviceId": "hostname-abc123"
}
```

## Local Files

```
~/.config-sync/
├── .bin/            # Installed executables (in PATH)
│   ├── cs           # The CLI itself
│   └── my-script    # Your installed scripts
├── cache/           # Downloaded content
│   └── my-script.sh
├── config.json      # Configuration
└── .last-sync       # Last sync timestamp
```

## Architecture

Config Sync separates the engine from your personal data:

1. **config-sync** (this repo) - The open-source sync engine
2. **Your config library** - Your personal scripts, aliases, configs

This keeps the tool generic while your personal config stays private.

## Self-Hosting

Deploy your own Cloudflare Worker:

```bash
# Clone the repo
git clone https://github.com/CyberBrown/config-sync.git
cd config-sync/worker

# Create D1 database
wrangler d1 create config-sync-db

# Update wrangler.toml with your database ID

# Initialize schema
wrangler d1 execute config-sync-db --file=src/db/schema.sql

# Add API key secret
echo "your-secret-key" | wrangler secret put API_KEY

# Deploy
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

```bash
flatpak install flathub menu.kando.Kando
cs extras  # then select kando push/pull
```

## License

MIT
