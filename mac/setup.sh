#!/bin/bash
# setup.sh para macOS

# Volta para a raiz
cd "$(dirname "$0")/.."

echo "--- NEXUS-MAC: AMBIENTE DE EXECUCAO ---"

# Verifica se o Homebrew existe para instalar dependencias
if ! command -v brew &> /dev/null; then
    echo "Homebrew nao encontrado. Instale em brew.sh para dependencias nativas."
else
    brew install python@3.11
fi

echo "[1/2] Instalando node_modules..."
npm install

# Detecta Arquitetura
ARCH=$(uname -m)
if [ "$ARCH" == "arm64" ]; then
    echo "[2/2] Gerando DMG para Apple Silicon (ARM64)..."
    npx electron-builder --mac --arm64
else
    echo "[2/2] Gerando DMG para Intel (x64)..."
    npx electron-builder --mac --x64
fi

echo "--- FINALIZADO ---"