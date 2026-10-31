$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build
if ($LASTEXITCODE -ne 0) { throw "Docker Compose failed. Ensure Docker Desktop is running." }
