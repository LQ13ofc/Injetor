#!/bin/bash
set -e

# Navega para a raiz do projeto
cd "$(dirname "$0")/.."

echo "====================================================="
echo "   NEXUS ULTIMATE - macOS BUILDER"
echo "====================================================="

# 1. Garante a pasta native
mkdir -p native

# 2. Verifica Xcode Tools (necessário para o ffi-napi)
if ! xcode-select -p &> /dev/null; then
    echo "[!] Instalando Xcode Command Line Tools..."
    xcode-select --install
    exit 1
fi

# 3. Instalação e Compilação
echo "[1/2] Instalando node_modules..."
rm -rf node_modules
npm install

# 4. Build Universal (M1/M2 e Intel)
echo "[2/2] Gerando DMG..."
npx electron-builder --mac --universal

echo "====================================================="
echo "   CONCLUIDO!"
echo "====================================================="