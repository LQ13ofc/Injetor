#!/bin/bash
# setup.sh para Linux

# Volta para a raiz
cd "$(dirname "$0")/.."

echo "--- NEXUS-LINUX: AMBIENTE DE EXECUCAO ---"

# Instala dependencias de build do sistema (Debian/Ubuntu)
sudo apt-get update
sudo apt-get install -y build-essential python3 libusb-1.0-0-dev icnsutils graphicsmagick

echo "[1/2] Instalando node_modules..."
npm install

echo "[2/2] Gerando AppImage (x64)..."
npx electron-builder --linux AppImage --x64

echo "--- FINALIZADO: Verifique a pasta /dist ---"