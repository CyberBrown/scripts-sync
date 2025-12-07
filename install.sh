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
BINARY_URL="${SCRIPTS_SYNC_URL:-https://github.com/CyberBrown/scripts-sync/releases/latest/download/scripts-sync}"
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
    curl -fsSL "$BINARY_URL" -o "$binary_path" 2>/dev/null || {
      log_warning "Binary not available yet (no release). Skipping..."
      return 0
    }
  else
    wget -qO "$binary_path" "$BINARY_URL" 2>/dev/null || {
      log_warning "Binary not available yet (no release). Skipping..."
      return 0
    }
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

# Setup Kando pie menu
setup_kando() {
  echo ""
  echo -e "${BOLD}  Kando Pie Menu Setup${NC}"
  echo -e "${DIM}  ─────────────────────${NC}"
  echo ""

  # Check if Kando is installed
  if ! flatpak list 2>/dev/null | grep -q "menu.kando.Kando"; then
    echo -e "${DIM}  Installing Kando via Flatpak...${NC}"
    flatpak install -y flathub menu.kando.Kando 2>/dev/null || {
      log_warning "Could not install Kando. Install manually from flathub."
      return 1
    }
  fi

  local KANDO_CONFIG="$HOME/.var/app/menu.kando.Kando/config/kando"
  mkdir -p "$KANDO_CONFIG/icon-themes/custom"

  # Download Proton Pass icon if available
  if [ -f "/usr/share/pixmaps/proton-pass.png" ]; then
    cp /usr/share/pixmaps/proton-pass.png "$KANDO_CONFIG/icon-themes/custom/proton-pass.svg" 2>/dev/null
  fi

  # Create menus.json with useful defaults
  cat > "$KANDO_CONFIG/menus.json" << 'KANDOEOF'
{
  "menus": [
    {
      "shortcut": "Control+Space",
      "shortcutID": "main-menu",
      "centered": false,
      "root": {
        "type": "submenu",
        "name": "Quick Menu",
        "icon": "apps",
        "iconTheme": "material-symbols-rounded",
        "children": [
          {
            "type": "command",
            "name": "Terminal",
            "icon": "terminal",
            "iconTheme": "material-symbols-rounded",
            "data": {
              "command": "x-terminal-emulator"
            }
          },
          {
            "type": "command",
            "name": "Browser",
            "icon": "globe",
            "iconTheme": "material-symbols-rounded",
            "data": {
              "command": "x-www-browser"
            }
          },
          {
            "type": "command",
            "name": "Files",
            "icon": "folder_open",
            "iconTheme": "material-symbols-rounded",
            "data": {
              "command": "xdg-open ~"
            }
          },
          {
            "type": "command",
            "name": "Settings",
            "icon": "settings",
            "iconTheme": "material-symbols-rounded",
            "data": {
              "command": "gnome-control-center"
            }
          },
          {
            "type": "submenu",
            "name": "Web Links",
            "icon": "public",
            "iconTheme": "material-symbols-rounded",
            "children": [
              {
                "type": "uri",
                "name": "GitHub",
                "icon": "github",
                "iconTheme": "simple-icons",
                "data": {
                  "uri": "https://github.com"
                }
              },
              {
                "type": "uri",
                "name": "Claude",
                "icon": "anthropic",
                "iconTheme": "simple-icons",
                "data": {
                  "uri": "https://claude.ai/new"
                }
              }
            ]
          }
        ]
      }
    }
  ],
  "collections": []
}
KANDOEOF

  log_success "Kando configured (Ctrl+Space to open)"
}

# Setup middle mouse button mapping
setup_mouse_mapping() {
  echo ""
  echo -e "${BOLD}  Mouse Button Mapping${NC}"
  echo -e "${DIM}  ─────────────────────${NC}"
  echo ""

  # Check if input-remapper is installed
  if ! command -v input-remapper-control &> /dev/null; then
    echo -e "${DIM}  Installing input-remapper...${NC}"
    sudo apt install -y input-remapper 2>/dev/null || {
      log_warning "Could not install input-remapper. Install manually."
      return 1
    }
  fi

  # Detect mouse device
  local mouse_name
  mouse_name=$(grep -E "^N:" /proc/bus/input/devices | grep -i mouse | head -1 | sed 's/N: Name="//' | sed 's/"//')

  if [ -z "$mouse_name" ]; then
    mouse_name=$(grep -B1 "mouse0" /proc/bus/input/devices | grep "N: Name" | sed 's/N: Name="//' | sed 's/"//')
  fi

  if [ -z "$mouse_name" ]; then
    log_warning "Could not detect mouse. Configure manually with input-remapper-gtk"
    return 1
  fi

  log_info "Detected mouse: $mouse_name"

  # Create config directories
  mkdir -p "$HOME/.config/input-remapper-2/presets/$mouse_name"
  sudo mkdir -p "/root/.config/input-remapper-2/presets/$mouse_name" 2>/dev/null

  # Create preset for middle click -> Ctrl+Space
  local preset='{
    "input_combination": [
      {
        "type": 1,
        "code": 274,
        "origin_hash": "'"$mouse_name"'"
      }
    ],
    "target_uinput": "keyboard",
    "output_symbol": "KEY_LEFTCTRL + KEY_SPACE",
    "mapping_type": "key_macro"
  }'

  echo "[$preset]" > "$HOME/.config/input-remapper-2/presets/$mouse_name/kando.json"
  sudo cp "$HOME/.config/input-remapper-2/presets/$mouse_name/kando.json" "/root/.config/input-remapper-2/presets/$mouse_name/" 2>/dev/null

  # Create autoload config
  cat > "$HOME/.config/input-remapper-2/config.json" << EOF
{
  "version": "2.1.1",
  "autoload": {
    "$mouse_name": "kando"
  }
}
EOF
  sudo cp "$HOME/.config/input-remapper-2/config.json" /root/.config/input-remapper-2/ 2>/dev/null

  # Start and load
  sudo systemctl restart input-remapper-daemon 2>/dev/null
  sleep 1
  input-remapper-control --command autoload 2>/dev/null

  log_success "Middle mouse button → Ctrl+Space (Kando)"
}

# Optional extras menu
setup_extras() {
  echo ""
  echo -e "${BOLD}  Optional Extras${NC}"
  echo -e "${DIM}  ────────────────${NC}"
  echo ""
  echo -e "  ${DIM}Would you like to set up these optional extras?${NC}"
  echo ""
  echo -e "  ${CYAN}1)${NC} Kando pie menu (Ctrl+Space quick launcher)"
  echo -e "  ${CYAN}2)${NC} Middle mouse button → Opens Kando"
  echo -e "  ${CYAN}3)${NC} Both"
  echo -e "  ${CYAN}4)${NC} Skip"
  echo ""
  read -r -p "  Choice [4]: " extras_choice
  extras_choice="${extras_choice:-4}"

  case "$extras_choice" in
    1)
      setup_kando
      ;;
    2)
      setup_mouse_mapping
      ;;
    3)
      setup_kando
      setup_mouse_mapping
      ;;
    4|*)
      log_info "Skipping extras"
      ;;
  esac
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
  setup_extras

  print_success
}

main "$@"
