#!/usr/bin/env bash
# Config Sync Installer
# curl -fsSL https://raw.githubusercontent.com/CyberBrown/config-sync/master/install.sh | bash

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Configuration
INSTALL_DIR="$HOME/.config-sync"
BIN_DIR="$INSTALL_DIR/.bin"
CACHE_DIR="$INSTALL_DIR/cache"
CONFIG_FILE="$INSTALL_DIR/config.json"
REPO_URL="https://github.com/CyberBrown/config-sync.git"
TMP_DIR="/tmp/config-sync-install-$$"
DEFAULT_SERVER="https://config-sync-api.solamp.workers.dev"

# Banner
print_banner() {
  echo ""
  echo -e "${MAGENTA}        ██╗      ██████╗  ██████╗  ██████╗ ███████╗${NC}"
  echo -e "${MAGENTA}        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝${NC}"
  echo -e "${MAGENTA}        ██║     ██║   ██║██║  ███╗██║   ██║███████╗${NC}"
  echo -e "${MAGENTA}        ██║     ██║   ██║██║   ██║██║   ██║╚════██║${NC}"
  echo -e "${MAGENTA}        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║${NC}"
  echo -e "${MAGENTA}        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝${NC}"
  echo ""
  echo -e "${CYAN}                ███████╗██╗     ██╗   ██╗██╗  ██╗${NC}"
  echo -e "${CYAN}                ██╔════╝██║     ██║   ██║╚██╗██╔╝${NC}"
  echo -e "${CYAN}                █████╗  ██║     ██║   ██║ ╚███╔╝ ${NC}"
  echo -e "${CYAN}                ██╔══╝  ██║     ██║   ██║ ██╔██╗ ${NC}"
  echo -e "${CYAN}                ██║     ███████╗╚██████╔╝██╔╝ ██╗${NC}"
  echo -e "${CYAN}                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝${NC}"
  echo ""
  echo -e "${DIM}                           Φ⥁○⧖∵${NC}"
  echo ""
}

log_info() { echo -e "${DIM}  $1${NC}"; }
log_success() { echo -e "${GREEN}  ✓ $1${NC}"; }
log_error() { echo -e "${RED}  ✗ $1${NC}"; }
log_warning() { echo -e "${YELLOW}  ! $1${NC}"; }

cleanup() {
  rm -rf "$TMP_DIR" 2>/dev/null || true
}
trap cleanup EXIT

# Detect shell config file
detect_shell_config() {
  if [[ "${SHELL:-/bin/bash}" == *"zsh"* ]]; then
    echo "$HOME/.zshrc"
  elif [[ -f "$HOME/.bashrc" ]]; then
    echo "$HOME/.bashrc"
  else
    echo "$HOME/.profile"
  fi
}

# Check and install bun if needed
ensure_bun() {
  if command -v bun &> /dev/null; then
    log_success "Bun $(bun --version)"
    return 0
  fi

  log_info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash &>/dev/null

  # Source bun for current session
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"

  if command -v bun &> /dev/null; then
    log_success "Bun installed"
  else
    log_error "Failed to install Bun"
    exit 1
  fi
}

# Check for git
ensure_git() {
  if command -v git &> /dev/null; then
    log_success "Git available"
    return 0
  fi

  log_error "Git is required but not installed"
  echo -e "${DIM}  Install with: sudo apt install git${NC}"
  exit 1
}

# Clone, build, and install
build_and_install() {
  log_info "Cloning config-sync..."
  mkdir -p "$TMP_DIR"
  git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR"
  log_success "Cloned repository"

  log_info "Installing dependencies..."
  cd "$TMP_DIR"
  bun install --silent 2>/dev/null
  log_success "Dependencies installed"

  log_info "Building binary..."
  bun build src/cli/index.ts --compile --outfile dist/config-sync 2>/dev/null
  log_success "Binary built"

  # Create directories
  mkdir -p "$BIN_DIR" "$CACHE_DIR"

  # Copy binary
  cp "$TMP_DIR/dist/config-sync" "$BIN_DIR/cs"
  chmod +x "$BIN_DIR/cs"
  log_success "Installed to ~/.config-sync/.bin/cs"
}

# Configure PATH
configure_path() {
  local shell_config
  shell_config=$(detect_shell_config)

  if grep -q ".config-sync/.bin" "$shell_config" 2>/dev/null; then
    log_success "PATH already configured"
  else
    {
      echo ""
      echo "# Config Sync"
      echo 'export PATH="$HOME/.config-sync/.bin:$PATH"'
    } >> "$shell_config"
    log_success "Added to $shell_config"
  fi

  # Also add bun to PATH if needed
  if [[ -d "$HOME/.bun" ]] && ! grep -q ".bun/bin" "$shell_config" 2>/dev/null; then
    {
      echo ""
      echo "# Bun"
      echo 'export BUN_INSTALL="$HOME/.bun"'
      echo 'export PATH="$BUN_INSTALL/bin:$PATH"'
    } >> "$shell_config"
  fi
}

# Get configuration from user
configure_app() {
  echo ""
  echo -e "${BOLD}  Configuration${NC}"
  echo -e "${DIM}  ─────────────${NC}"
  echo ""

  # API Key
  echo -e "  ${CYAN}Enter your API key:${NC}"
  read -r -p "  > " api_key

  if [[ -z "$api_key" ]]; then
    log_warning "No API key - run 'cs config' later to set it"
  fi

  # Auto-generate device ID
  local device_id
  device_id="$(hostname)-$(head -c 3 /dev/urandom | xxd -p 2>/dev/null || printf '%04x' $RANDOM)"

  # Write config
  cat > "$CONFIG_FILE" << EOF
{
  "serverUrl": "$DEFAULT_SERVER",
  "apiKey": "$api_key",
  "deviceId": "$device_id"
}
EOF
  chmod 600 "$CONFIG_FILE"

  log_success "Configuration saved (device: $device_id)"
}

# Print success message
print_success() {
  local shell_config
  shell_config=$(detect_shell_config)

  echo ""
  echo -e "${GREEN}  ══════════════════════════════════════════${NC}"
  echo -e "${GREEN}         Installation Complete!${NC}"
  echo -e "${GREEN}  ══════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${DIM}1.${NC} Restart terminal or run: ${CYAN}source $shell_config${NC}"
  echo ""
  echo -e "  ${DIM}2.${NC} Sync your scripts:"
  echo -e "     ${CYAN}cs sync${NC}"
  echo -e "     ${CYAN}cs list${NC}"
  echo ""
  echo -e "  ${DIM}3.${NC} Install scripts:"
  echo -e "     ${CYAN}cs install <name>${NC}"
  echo ""
}

# Main
main() {
  print_banner

  echo -e "${BOLD}  Installing Config Sync${NC}"
  echo -e "${DIM}  ──────────────────────${NC}"
  echo ""

  ensure_git
  ensure_bun
  build_and_install
  configure_path
  configure_app

  print_success
}

main "$@"
