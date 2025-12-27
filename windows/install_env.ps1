# install_env.ps1
$ErrorActionPreference = "Continue"

Write-Host "[NEXUS] Verificando requisitos de hardware para FFI..." -ForegroundColor Cyan

# 1. Garante que o Python 3.11 está presente (obrigatório para compilação nativa)
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Python não encontrado. Instalando..." -ForegroundColor Yellow
    winget install --id Python.Python.3.11 --silent --accept-package-agreements
}

# 2. Garante que as ferramentas de Build C++ estão completas
# Adicionamos o 'vctools' e 'atlmfc' que o ffi-napi usa para pré-processamento
Write-Host "[!] Injetando componentes de compilação no Visual Studio..." -ForegroundColor Yellow
winget install --id Microsoft.VisualStudio.2022.BuildTools --silent --override "--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.VC.ATLMFC --includeRecommended" --accept-package-agreements

Write-Host "[!] AGUARDANDO FINALIZACAO DO INSTALADOR..." -ForegroundColor Red
while (Get-Process -Name "vs_installer", "vs_setup_bootstrapper" -ErrorAction SilentlyContinue) {
    Write-Host "." -NoNewline -ForegroundColor White
    Start-Sleep -Seconds 5
}

# 3. Configuração do NPM para apontar para o Python instalado
$pythonPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe"
if (Test-Path $pythonPath) {
    npm config set python "$pythonPath" --global
}

Write-Host "`n[OK] Ambiente pronto para o FFI-NAPI." -ForegroundColor Green