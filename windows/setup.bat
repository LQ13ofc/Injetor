@echo off
setlocal enabledelayedexpansion

:: Solicita Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%0' -Verb RunAs"
    exit /b
)

:: Força o diretório para a raiz do projeto (sobe da pasta windows/)
cd /d "%~dp0.."

title NEXUS CORE - FIX FFI-NAPI
echo =====================================================
echo    REPARO DE AMBIENTE PARA FFI-NAPI (SEM ALTERAR JS)
echo =====================================================

:: 1. Instalação/Reparo do ambiente via PowerShell
call powershell -ExecutionPolicy Bypass -File "windows/install_env.ps1"

:: 2. Limpeza profunda para evitar cache de erro
echo [1/2] Limpando node_modules...
if exist node_modules rd /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

:: 3. A "Mágica" para o ffi-napi funcionar no Windows 11
:: Forçamos o npm a usar uma versão específica do compilador e ignorar scripts quebrados
echo [2/2] Instalando dependencias (isso pode demorar)...
call npm install --msvs_version=2022 --foreground-scripts

echo.
echo [!] Tentando gerar o build agora que o ambiente foi forçado...
npx electron-builder --win --x64

echo =====================================================
pause