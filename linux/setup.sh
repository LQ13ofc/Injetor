#!/bin/bash
# Garante que erros interrompam o script
set -e

# Navega para a raiz do projeto
cd "$(dirname "$0")/.."

echo "====================================================="
echo "   NEXUS ULTIMATE - LINUX BUILDER (FFI-SAFE)"
echo "====================================================="

# 1. Cria a pasta native se não existir (evita o erro que deu no Windows)
mkdir -p native

# 2. Instala dependências de compilação do Linux
echo "[1/3] Instalando dependencias nativas..."
sudo apt-get update
sudo apt-get install -y build-essential python3 libffi-dev libusb-1.0-0-dev

# 3. Instalação do Node
echo "[2/3] Instalando node_modules..."
rm -rf node_modules
npm install

# 4. Build para Linux (AppImage)
echo "[3/3] Gerando pacote Linux..."
npx electron-builder --linux --x64

echo "====================================================="
echo "   CONCLUIDO: Verifique a pasta /dist"
echo "====================================================="