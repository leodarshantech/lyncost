#!/usr/bin/env bash
# ==============================================================================
# Lyncost One-Line Linux Uninstaller
# https://github.com/leodarshantech/lyncost
# ==============================================================================
set -e

PURGE_DATA=false

for arg in "$@"; do
    case "$arg" in
        --purge|--wipe|--wipe-data|-p|--all)
            PURGE_DATA=true
            ;;
    esac
done

if [ -t 1 ]; then
    BOLD="\033[1m"
    DIM="\033[2m"
    RESET="\033[0m"
    PURPLE="\033[38;2;168;85;247m"
    ROYAL="\033[38;2;147;51;234m"
    GREEN="\033[38;2;34;197;94m"
    RED="\033[38;2;239;68;68m"
    AMBER="\033[38;2;245;158;11m"
    CYAN="\033[38;2;56;189;248m"
    WHITE="\033[1;37m"
else
    BOLD=""
    DIM=""
    RESET=""
    PURPLE=""
    ROYAL=""
    GREEN=""
    RED=""
    AMBER=""
    CYAN=""
    WHITE=""
fi

clear 2>/dev/null || true

echo -e "${ROYAL}${BOLD}"
cat << "BANNER"
  ██╗     ██╗   ██╗███╗   ██╗ ██████╗  ██████╗ ███████╗████████╗
  ██║     ╚██╗ ██╔╝████╗  ██║██╔════╝ ██╔═══██╗██╔════╝╚══██╔══╝
  ██║      ╚████╔╝ ██╔██╗ ██║██║      ██║   ██║███████╗   ██║   
  ██║       ╚██╔╝  ██║╚██╗██║██║      ██║   ██║╚════██║   ██║   
  ███████╗   ██║   ██║ ╚████║╚██████╗ ╚██████╔╝███████║   ██║   
  ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝   ╚═╝   
BANNER
echo -e "${RESET}"
if [ "$PURGE_DATA" = true ]; then
    echo -e " ${RED}${BOLD}Lyncost Linux Uninstaller (PURGE MODE: Complete Data Wipe)${RESET}"
else
    echo -e " ${PURPLE}${BOLD}Lyncost Linux Uninstaller${RESET}"
fi
echo -e "${ROYAL}────────────────────────────────────────────────────────────────${RESET}"
echo ""

DATA_DIR="$HOME/.local/share/com.lyncost.desktop"
if [ "$PURGE_DATA" = false ] && [ -t 0 ] && [ -d "$DATA_DIR" ]; then
    echo -e " ${AMBER}${BOLD}Data Vault Detected:${RESET} ${DIM}$DATA_DIR${RESET}"
    read -r -p "$(echo -e " Do you also want to permanently wipe all financial data and backups? [y/N]: ")" wipe_choice
    case "${wipe_choice,,}" in
        y|yes)
            PURGE_DATA=true
            ;;
    esac
    echo ""
fi

TOTAL_STEPS=3
if [ "$PURGE_DATA" = true ]; then
    TOTAL_STEPS=4
fi

echo -e " ${ROYAL}${BOLD}[1/${TOTAL_STEPS}]${RESET} Removing executable binary..."
rm -f "$HOME/.local/bin/lyncost"
echo -e "     ${GREEN}${BOLD}✓${RESET} ~/.local/bin/lyncost removed"

echo -e " ${ROYAL}${BOLD}[2/${TOTAL_STEPS}]${RESET} Removing desktop launcher and icons..."
rm -f "$HOME/.local/share/applications/lyncost.desktop"
rm -f "$HOME/.local/share/icons/hicolor/"*"/apps/lyncost."* 2>/dev/null || true
rm -f "$HOME/.local/share/pixmaps/lyncost.png" 2>/dev/null || true
echo -e "     ${GREEN}${BOLD}✓${RESET} System icons and desktop launcher removed"

echo -e " ${ROYAL}${BOLD}[3/${TOTAL_STEPS}]${RESET} Refreshing desktop icon database..."
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
fi
echo -e "     ${GREEN}${BOLD}✓${RESET} System caches refreshed"

if [ "$PURGE_DATA" = true ]; then
    echo -e " ${ROYAL}${BOLD}[4/${TOTAL_STEPS}]${RESET} Wiping all local data, databases, and backups..."
    rm -rf "$HOME/.local/share/com.lyncost.desktop"
    rm -rf "$HOME/.config/com.lyncost.desktop" 2>/dev/null || true
    rm -rf "$HOME/.cache/com.lyncost.desktop" 2>/dev/null || true
    echo -e "     ${RED}${BOLD}✓${RESET} All financial databases, history, and backups permanently deleted."
fi

echo ""
echo -e "${ROYAL}╭──────────────────────────────────────────────────────────────────╮${RESET}"
if [ "$PURGE_DATA" = true ]; then
    echo -e "${ROYAL}│${RESET}   ${GREEN}${BOLD}✓ Lyncost and ALL data wiped cleanly from your system!${RESET}         ${ROYAL}│${RESET}"
else
    echo -e "${ROYAL}│${RESET}   ${GREEN}${BOLD}✓ Lyncost application uninstalled cleanly!${RESET}                     ${ROYAL}│${RESET}"
fi
echo -e "${ROYAL}╰──────────────────────────────────────────────────────────────────╯${RESET}"
echo ""

if [ "$PURGE_DATA" = false ]; then
    echo -e " ${GREEN}🛡️ Note:${RESET} ${DIM}Your local SQLite database is preserved safely in:${RESET}"
    echo -e "   ${CYAN}$HOME/.local/share/com.lyncost.desktop/${RESET}"
    echo ""
    echo -e " ${DIM}To completely wipe your data at any time, run:${RESET}"
    echo -e "   curl -fsSL https://raw.githubusercontent.com/leodarshantech/lyncost/main/uninstall.sh | bash -s -- --purge"
    echo ""
fi

echo -e " ${DIM}If you ever want to reinstall:${RESET}"
echo -e "   curl -fsSL https://raw.githubusercontent.com/leodarshantech/lyncost/main/install.sh | bash"
echo ""
