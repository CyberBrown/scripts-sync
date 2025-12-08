# Config-Sync (formerly scripts-sync)

Personal environment sync tool that syncs scripts, aliases, functions, config files, and application settings across machines via Cloudflare D1.

## Project Overview

- **CLI**: Bun-based TypeScript CLI (`cs` command)
- **Backend**: Cloudflare Worker with D1 database
- **Architecture**: Two repos - config-sync (engine) + chris-config (user library)

## Current Phase: Phase 0 - Rename and Clean

### Key Changes in Progress
- Rename from `scripts-sync` to `config-sync`
- CLI command `ss` to `cs`
- Worker URL: `https://config-sync-api.solamp.workers.dev`
- Remove hardcoded Kando/mouse configs (move to user library)
- Keep only hello world example script

## Directory Structure

```
config-sync/
├── src/cli/           # CLI implementation
│   ├── commands/      # Command handlers
│   └── ui/            # ASCII art, menus, prompts
├── src/lib/           # Shared utilities
│   ├── api.ts         # API client
│   ├── config.ts      # Config management (~/.config-sync/)
│   └── sync.ts        # Sync logic
├── worker/            # Cloudflare Worker
│   ├── src/db/        # D1 schema and queries
│   └── src/routes/    # API endpoints
└── install.sh         # Installation script
```

## Build & Deploy

```bash
# Development
bun run dev                    # Run CLI locally
bun run worker:dev             # Run worker locally

# Build
bun run build                  # Build CLI binary

# Deploy
bun run worker:deploy          # Deploy worker to Cloudflare
```

## Configuration

- Config directory: `~/.config-sync/`
- Scripts installed to: `~/.config-sync/.bin/`
- Server URL default: `https://config-sync-api.solamp.workers.dev`

<!-- Developer Guides MCP Setup v1.1.0 - Check for updates: docs/CLAUDE-MD-SETUP.md -->
## Developer Guidelines (MCP Server)

### Required: Check Before Implementing

ALWAYS search the developer guides before:
- Writing new functions or modules
- Implementing error handling
- Adding validation logic
- Creating API endpoints
- Writing database queries
- Adding authentication or security features

This is not optional - established patterns must be followed for consistency and security.

### Quick Reference

| Task | Search Query |
|------|-------------|
| Input validation | `query="zod validation"` |
| Error handling | `query="error classes"` |
| API security | `query="authentication middleware"` |
| Database queries | `query="parameterized queries"` |
| Testing patterns | `query="unit test"` |
| Logging/monitoring | `query="observability"` |

### How to Access

Search by topic:
```
mcp__developer-guides__search_developer_guides query="validation"
```

Get specific guide:
```
mcp__developer-guides__get_guide guideId="guide-07-security"
mcp__developer-guides__get_guide guideId="guide-01-fundamentals"
```

List all available guides:
```
mcp__developer-guides__list_guides
```

### Available Guides

| Guide | Use For |
|-------|---------|
| `guide-01-fundamentals` | Code organization, naming, error handling, types |
| `guide-02-11-arch-devops` | Architecture patterns, CI/CD, deployment |
| `guide-05-10-db-perf` | Database schemas, queries, performance |
| `guide-07-security` | Validation, auth, secrets, CORS, rate limiting |
| `guide-09-testing` | Unit, integration, E2E testing patterns |
| `Cloudflare-Workers-Guide` | Cloudflare Workers patterns, bindings, KV, D1 |
| `Frontend-Development-Guide` | Frontend patterns, components, state management |
| `AI and Observability-Guide` | AI integration, logging, monitoring, tracing |

### Key Patterns to Follow
- Use Zod schemas for all input validation
- Use custom error classes (`AppError`, `ValidationError`, `NotFoundError`)
- Never concatenate SQL queries - use parameterized queries
- Store secrets in environment variables, never in code

### Improving the Guides

If you find gaps, outdated patterns, or better approaches while working:
```
mcp__developer-guides__propose_guide_change guideId="guide-07-security" section="Authentication" currentText="..." proposedText="..." rationale="Found a better pattern for..."
```
Proposals help keep the guides current and comprehensive.
