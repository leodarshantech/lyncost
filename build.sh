#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.cargo/bin:$HOME/.local/bin:$PATH"

echo "==> Checking required build tools..."
MISSING=""
for tool in gcc pkg-config cargo node npm; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        MISSING="$MISSING $tool"
    fi
done

# Distro-aware package hint
get_install_hint() {
    if [ -f /etc/arch-release ] || grep -qi "arch" /etc/os-release 2>/dev/null; then
        echo "  sudo pacman -S --needed base-devel webkit2gtk-4.1 gtk3 openssl libsoup3 nodejs npm rustup"
    elif [ -f /etc/debian_version ] || grep -qi "ubuntu\|debian" /etc/os-release 2>/dev/null; then
        echo "  sudo apt update && sudo apt install -y build-essential libwebkit2gtk-4.1-dev libgtk-3-dev libssl-dev libsoup-3.0-dev nodejs npm cargo"
    else
        echo "  sudo dnf install -y gcc gcc-c++ webkit2gtk4.1-devel gtk3-devel openssl-devel libsoup3-devel nodejs npm cargo"
    fi
}

if [ -n "$MISSING" ]; then
    echo "Error: Missing required build dependencies:$MISSING"
    echo "Please install them first with:"
    get_install_hint
    exit 1
fi

if ! pkg-config --exists webkit2gtk-4.1 gtk+-3.0; then
    echo "Error: Missing WebKitGTK / GTK3 development headers."
    echo "Please install them with:"
    get_install_hint
    exit 1
fi

echo "==> Building frontend assets and native binary..."
cd "$ROOT_DIR"
npm run release

echo "==> Creating release distribution packages..."
bash packaging/build_packages.sh

echo "==> Installing Lyncost locally..."
bash install.sh

echo ""
echo "✨ Lyncost build & installation completed successfully!"
echo "Launch it via terminal: lyncost"
echo "Or search for 'Lyncost' in your application menu."
