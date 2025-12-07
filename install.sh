#!/usr/bin/env bash
# Scripts Sync Installer
# curl -fsSL https://your-domain.com/install.sh | bash

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
INSTALL_DIR="$HOME/.scripts-sync"
BIN_DIR="$INSTALL_DIR/.bin"
CACHE_DIR="$INSTALL_DIR/cache"
CONFIG_FILE="$INSTALL_DIR/config.json"
BINARY_URL="${SCRIPTS_SYNC_URL:-https://github.com/your-org/scripts-sync/releases/latest/download/scripts-sync}"
DEFAULT_SERVER="https://scripts-sync-api.solamp.workers.dev"

# Banner
print_banner() {
  echo ""
  echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${NC}                                                                   ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}░██████╗░█████╗░██████╗░██╗██████╗░████████╗░██████╗${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝██╔════╝${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}╚█████╗░██║░░╚═╝██████╔╝██║██████╔╝░░░██║░░░╚█████╗░${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}░╚═══██╗██║░░██╗██╔══██╗██║██╔═══╝░░░░██║░░░░╚═══██╗${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}██████╔╝╚█████╔╝██║░░██║██║██║░░░░░░░░██║░░░██████╔╝${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}   ${BOLD}╚═════╝░░╚════╝░╚═╝░░╚═╝╚═╝╚═╝░░░░░░░░╚═╝░░░╚═════╝░${NC}        ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}                                                                   ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}                    ${GREEN}${BOLD}INSTALLATION${NC}                              ${CYAN}║${NC}"
  echo -e "${CYAN}║${NC}               ${YELLOW}⚡${NC} ${BOLD}SYNC${NC} ${DIM}• POWERED BY${NC} ${MAGENTA}${BOLD}LOGOS FLUX${NC} ${YELLOW}⚡${NC}               ${CYAN}║${NC}"
  echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
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
  log_info "Downloading scripts-sync..."

  local binary_path="$BIN_DIR/scripts-sync"

  if [[ "$DOWNLOADER" == curl* ]]; then
    curl -fsSL "$BINARY_URL" -o "$binary_path"
  else
    wget -qO "$binary_path" "$BINARY_URL"
  fi

  chmod +x "$binary_path"
  log_success "Downloaded scripts-sync binary"
}

# Configure PATH
configure_path() {
  local shell_config
  shell_config=$(detect_shell_config)

  log_info "Configuring PATH in $shell_config..."

  local path_line='
# Scripts Sync
export PATH="$HOME/.scripts-sync/.bin:$PATH"
'

  # Check if already configured
  if grep -q ".scripts-sync/.bin" "$shell_config" 2>/dev/null; then
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
  echo -e "     ${CYAN}scripts-sync auth${NC}    ${DIM}# Browser auth${NC}"
  echo -e "     ${CYAN}scripts-sync config${NC}  ${DIM}# Manual setup${NC}"
  echo ""
  echo -e "  ${DIM}3. Start syncing:${NC}"
  echo -e "     ${CYAN}scripts-sync list${NC}    ${DIM}# View scripts${NC}"
  echo -e "     ${CYAN}scripts-sync sync${NC}    ${DIM}# Sync all${NC}"
  echo -e "     ${CYAN}scripts-sync add my-script${NC}  ${DIM}# Create new${NC}"
  echo ""
  echo -e "  ${DIM}Run ${CYAN}scripts-sync --help${DIM} for all commands.${NC}"
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
