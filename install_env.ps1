# install_env.ps1 - MONITOR DE INSTALAÇÃO REAL
$ErrorActionPreference = "Continue"

Write-Host "[NEXUS] Iniciando instalacao pesada do VS Build Tools..." -ForegroundColor Cyan

# Inicia a instalação
winget install --id Microsoft.VisualStudio.2022.BuildTools --silent --override "--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" --accept-package-agreements --accept-source-agreements

Write-Host "[NEXUS] O instalador do Visual Studio iniciou em segundo plano." -ForegroundColor Yellow
Write-Host "[NEXUS] AGUARDANDO CONCLUSAO... NAO FECHE ESTA JANELA!" -ForegroundColor Red

# Loop de monitoramento: Enquanto o processo do instalador estiver vivo, o script espera
$isInstalling = $true
while ($isInstalling) {
    $process = Get-Process -Name "vs_installer", "vs_installershell" -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        $isInstalling = $false
        Write-Host "`n[OK] Instalador do Visual Studio finalizou o trabalho." -ForegroundColor Green
    }
}

# Configura o Python
$pythonExe = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe"
if (Test-Path $pythonExe) {
    npm config set python "$pythonExe" --global
    Write-Host "[NEXUS] Python vinculado ao NPM com sucesso." -ForegroundColor Green
}
