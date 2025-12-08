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
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="$HOME/.config-sync"
BIN_DIR="$INSTALL_DIR/.bin"
CACHE_DIR="$INSTALL_DIR/cache"
CONFIG_FILE="$INSTALL_DIR/config.json"
BINARY_URL="${CONFIG_SYNC_URL:-https://github.com/CyberBrown/config-sync/releases/latest/download/config-sync}"
DEFAULT_SERVER="https://config-sync-api.solamp.workers.dev"

# Banner
print_banner() {
  local BRIGHT_MAGENTA='\e[95m'
  local BRIGHT_CYAN='\e[96m'

  echo ""
  echo -e "${BRIGHT_MAGENTA}        ██╗      ██████╗  ██████╗  ██████╗ ███████╗${NC}"
  echo -e "${BRIGHT_MAGENTA}        ██║     ██╔═══██╗██╔════╝ ██╔═══██╗██╔════╝${NC}"
  echo -e "${MAGENTA}        ██║     ██║   ██║██║  ███╗██║   ██║███████╗${NC}"
  echo -e "${MAGENTA}        ██║     ██║   ██║██║   ██║██║   ██║╚════██║${NC}"
  echo -e "${MAGENTA}        ███████╗╚██████╔╝╚██████╔╝╚██████╔╝███████║${NC}"
  echo -e "${MAGENTA}        ╚══════╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝${NC}"
  echo ""
  echo -e "${BRIGHT_CYAN}                ███████╗██╗     ██╗   ██╗██╗  ██╗${NC}"
  echo -e "${BRIGHT_CYAN}                ██╔════╝██║     ██║   ██║╚██╗██╔╝${NC}"
  echo -e "${CYAN}                █████╗  ██║     ██║   ██║ ╚███╔╝ ${NC}"
  echo -e "${CYAN}                ██╔══╝  ██║     ██║   ██║ ██╔██╗ ${NC}"
  echo -e "${CYAN}                ██║     ███████╗╚██████╔╝██╔╝ ██╗${NC}"
  echo -e "${CYAN}                ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝${NC}"
  echo ""
  echo -e "${DIM}                           Φ⥁○⧖∵${NC}"
  echo ""
  echo -e "${DIM}                   ⚡ config-sync installer ⚡${NC}"
  echo ""
}

# Functions
log_info() {
  echo -e "${DIM}  $1${NC}"
}

log_success() {
  echo -e "${GREEN}  ✓ $1${NC}"
}

log_error() {
  echo -e "${RED}  ✗ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}  ! $1${NC}"
}

# Detect shell config file
detect_shell_config() {
  if [[ "$SHELL" == *"zsh"* ]]; then
    echo "$HOME/.zshrc"
  elif [[ "$SHELL" == *"bash"* ]]; then
    if [[ -f "$HOME/.bashrc" ]]; then
      echo "$HOME/.bashrc"
    else
      echo "$HOME/.bash_profile"
    fi
  else
    echo "$HOME/.profile"
  fi
}

# Check dependencies
check_dependencies() {
  log_info "Checking dependencies..."

  # Check for curl or wget
  if command -v curl &> /dev/null; then
    DOWNLOADER="curl -fsSL"
  elif command -v wget &> /dev/null; then
    DOWNLOADER="wget -qO-"
  else
    log_error "Neither curl nor wget found. Please install one of them."
    exit 1
  fi

  log_success "Dependencies OK"
}

# Create directory structure
create_directories() {
  log_info "Creating directory structure..."

  mkdir -p "$INSTALL_DIR"
  mkdir -p "$BIN_DIR"
  mkdir -p "$CACHE_DIR"

  log_success "Created $INSTALL_DIR"
}

# Download binary
download_binary() {
  log_info "Downloading config-sync..."

  local binary_path="$BIN_DIR/cs"

  # Use subshell to prevent set -e from exiting on curl failure
  if (curl -fsSL "$BINARY_URL" -o "$binary_path" 2>/dev/null); then
    chmod +x "$binary_path"
    log_success "Downloaded config-sync binary"
  else
    log_warning "Binary not available yet (no release). Skipping..."
  fi
}

# Configure PATH
configure_path() {
  local shell_config
  shell_config=$(detect_shell_config)

  log_info "Configuring PATH in $shell_config..."

  local path_line='
# Config Sync
export PATH="$HOME/.config-sync/.bin:$PATH"
'

  # Check if already configured
  if grep -q ".config-sync/.bin" "$shell_config" 2>/dev/null; then
    log_success "PATH already configured"
  else
    echo "$path_line" >> "$shell_config"
    log_success "Added to $shell_config"
  fi
}

# Initial configuration
initial_config() {
  echo ""
  echo -e "${BOLD}  Configuration${NC}"
  echo -e "${DIM}  ─────────────${NC}"
  echo ""

  # Server URL
  echo -e "${DIM}  Server URL (press Enter for default):${NC}"
  echo -e "${DIM}  Default: $DEFAULT_SERVER${NC}"
  read -r -p "  > " server_url
  server_url="${server_url:-$DEFAULT_SERVER}"

  # API Key
  echo ""
  echo -e "${DIM}  API Key (or press Enter to configure later):${NC}"
  read -r -s -p "  > " api_key
  echo ""

  # Generate device ID
  local device_id
  device_id="$(hostname)-$(openssl rand -hex 3 2>/dev/null || head -c 6 /dev/urandom | xxd -p)"

  # Write config
  cat > "$CONFIG_FILE" << EOF
{
  "serverUrl": "$server_url",
  "apiKey": "$api_key",
  "deviceId": "$device_id"
}
EOF

  log_success "Configuration saved"
}

# Print success message
print_success() {
  echo ""
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║${NC}                                                                   ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}                    ${BOLD}Installation Complete!${NC}                        ${GREEN}║${NC}"
  echo -e "${GREEN}║${NC}                                                                   ${GREEN}║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "  ${BOLD}Quick Start:${NC}"
  echo ""
  echo -e "  ${DIM}1. Restart your terminal or run:${NC}"
  echo -e "     ${CYAN}source $(detect_shell_config)${NC}"
  echo ""
  echo -e "  ${DIM}2. Configure authentication:${NC}"
  echo -e "     ${CYAN}cs auth${NC}    ${DIM}# Browser auth${NC}"
  echo -e "     ${CYAN}cs config${NC}  ${DIM}# Manual setup${NC}"
  echo ""
  echo -e "  ${DIM}3. Start syncing:${NC}"
  echo -e "     ${CYAN}cs list${NC}    ${DIM}# View items${NC}"
  echo -e "     ${CYAN}cs sync${NC}    ${DIM}# Sync all${NC}"
  echo -e "     ${CYAN}cs add my-script${NC}  ${DIM}# Create new${NC}"
  echo ""
  echo -e "  ${DIM}Run ${CYAN}cs --help${DIM} for all commands.${NC}"
  echo ""
}

# Main installation
main() {
  print_banner

  check_dependencies
  create_directories
  download_binary
  configure_path
  initial_config

  print_success
}

main "$@"
