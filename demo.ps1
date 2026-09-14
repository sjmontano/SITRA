# Demo SITRA — corre TODO con un solo comando.
# Uso (desde la RAIZ del repo):
#   powershell -ExecutionPolicy Bypass -File .\demo.ps1
$ErrorActionPreference = "Stop"
$Contracts = Join-Path $PSScriptRoot "contracts"
Set-Location $Contracts

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " SITRA - Demostracion local (blockchain Hardhat)" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/4] Tests del contrato..." -ForegroundColor Yellow
npx hardhat test
if (-not $?) { throw "Fallaron los tests" }

Write-Host ""
Write-Host "[2/4] Demo 01 - UPDATE admin: DB reescribible vs append-only..." -ForegroundColor Yellow
npx hardhat run ../scripts/demo-ataques/01-update-admin.js
if (-not $?) { throw "Fallo demo 01" }

Write-Host ""
Write-Host "[3/4] Demo 02 - Transferencia ajena y firma falsificada..." -ForegroundColor Yellow
npx hardhat run ../scripts/demo-ataques/02-transferencia-ajena.js
if (-not $?) { throw "Fallo demo 02" }

Write-Host ""
Write-Host "[4/4] Demo 03 - Apagon del emisor..." -ForegroundColor Yellow
npx hardhat run ../scripts/demo-ataques/03-apagon-emisor.js
if (-not $?) { throw "Fallo demo 03" }

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " Demo completa OK." -ForegroundColor Green
Write-Host " Que mostrar al jurado:" -ForegroundColor Green
Write-Host "  - Demo 01: 'A reescrito' vs 'C intacto' (admin no borra en C)" -ForegroundColor Green
Write-Host "  - Demo 02: 'revert no-custodio' + 'revert sigFrom' (intruso fuera)" -ForegroundColor Green
Write-Host "  - Demo 03: 'Verificable sin emisor: true' (sigue vivo sin backend)" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
