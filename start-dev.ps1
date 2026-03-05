param(
    [switch]$SkipDockerDesktop
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Wait-DockerReady {
    param([int]$TimeoutSeconds = 120)

    $startedAt = Get-Date
    while ((Get-Date) -lt $startedAt.AddSeconds($TimeoutSeconds)) {
        docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        Start-Sleep -Seconds 3
    }

    return $false
}

if (-not (Test-Command "docker")) {
    throw "Docker CLI no está disponible. Instala Docker Desktop y vuelve a intentar."
}

if (-not (Test-Command "npm")) {
    throw "npm no está disponible. Instala Node.js y vuelve a intentar."
}

if (-not (Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue)) {
    if (-not $SkipDockerDesktop) {
        $dockerDesktopPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerDesktopPath) {
            Write-Host "Iniciando Docker Desktop..."
            Start-Process -FilePath $dockerDesktopPath
        }
    }
}

Write-Host "Esperando a que Docker Engine esté listo..."
if (-not (Wait-DockerReady -TimeoutSeconds 150)) {
    throw "Docker no respondió dentro del tiempo esperado. Revisa Docker Desktop."
}

Write-Host "Levantando servicios Docker..."
if (Test-Command "docker-compose") {
    docker-compose up -d
}
else {
    docker compose up -d
}

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

if (-not (Test-Path $backendPath)) {
    throw "No se encontró la carpeta backend en: $backendPath"
}

if (-not (Test-Path $frontendPath)) {
    throw "No se encontró la carpeta frontend en: $frontendPath"
}

Write-Host "Abriendo backend en una nueva ventana..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm run dev"

Write-Host "Abriendo frontend en una nueva ventana..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "Todo iniciado."
Write-Host "Backend: http://localhost:3000"
Write-Host "Frontend: http://localhost:5173"