$ErrorActionPreference = "Continue"
Write-Host "[NEXUS] Preparando Compiladores C++..." -ForegroundColor Cyan

# VS Build Tools e Python
winget install --id Microsoft.VisualStudio.2022.BuildTools --silent --override "--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" --accept-package-agreements --accept-source-agreements
winget install --id Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements

Write-Host "[!] AGUARDANDO VS_INSTALLER CONCLUIR..." -ForegroundColor Yellow
while (Get-Process -Name "vs_installer", "vs_setup_bootstrapper" -ErrorAction SilentlyContinue) {
    Write-Host "." -NoNewline -ForegroundColor White
    Start-Sleep -Seconds 10
}

# Configura o Python no NPM
$pythonPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe"
if (Test-Path $pythonPath) { npm config set python "$pythonPath" --global }
Write-Host "`n[OK] Ambiente Windows Pronto." -ForegroundColor Green