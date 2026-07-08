# ─── Restoku 6-Layer TDR (Test-Driven Refactoring) PowerShell Suite ───

$ErrorActionPreference = "Stop"

function Write-Header ($title) {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Cyan -NoNewline
    Write-Host ""
    Write-Host " 🛡️  $title" -ForegroundColor Cyan -NoNewline
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Cyan
}

function Write-Step ($stepNum, $title) {
    Write-Host ""
    Write-Host "[Step $stepNum] $title..." -ForegroundColor Blue
}

Write-Header "RESTOKU 6-LAYER TDR (TEST-DRIVEN REFACTORING) SUITE"

# Step 1: Run SaaS Architecture Linter via Node script
Write-Step 1 "SaaS Architecture & Multi-Tenant Linter"
node scripts/tdr.mjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ TDR Suite Failed at Step 1 or subsequent steps! Check output above." -ForegroundColor Red
    exit 1
}

exit 0
