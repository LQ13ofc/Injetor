@echo off
setlocal enabledelayedexpansion

:: Verifica Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%0' -Verb RunAs"
    exit /b
)

:: Sobe um nível para a raiz do projeto
cd /d "%~dp0.."

title NEXUS ULTIMATE - WINDOWS BUILDER
echo =====================================================
echo    DETECCAO DE HARDWARE: WINDOWS
echo =====================================================

:: Instala ambiente (Python/VS Build Tools)
powershell -ExecutionPolicy Bypass -File "windows/install_env.ps1"

:: Executa o build baseado na arquitetura
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    echo [INFO] Detectado Windows x64. Iniciando Build...
    npm run build:win64
) else (
    echo [INFO] Detectado Windows x32. Iniciando Build...
    npm run build:win32
)

echo =====================================================
echo    BUILD CONCLUIDO. VERIFIQUE A PASTA /DIST
echo =====================================================
pause