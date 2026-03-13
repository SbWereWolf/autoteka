param(
    [switch]$Staged,
    [ValidateSet("check","apply")]
    [string]$LintMode = "check",
    [string]$TestProfile = "minimal"
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host "[verify] $Name"
    & $Script
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[verify] failed: $Name"
        exit 1
    }
}

if ($TestProfile -ne "minimal") {
    Write-Error "[verify] unsupported profile: $TestProfile"
    exit 1
}

if ($LintMode -eq "apply") {
    Write-Warning "[verify] LintMode=apply is treated as check in quick profile."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$frontendDir = Join-Path $repoRoot "frontend"
$shopApiDir = Join-Path $repoRoot "backend/apps/ShopAPI"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "[verify] npm not found."
    exit 3
}

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Error "[verify] php not found."
    exit 3
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Error "[verify] frontend/node_modules is missing."
    exit 3
}

if (-not (Test-Path (Join-Path $shopApiDir "vendor"))) {
    Write-Error "[verify] backend/apps/ShopAPI/vendor is missing."
    exit 3
}

Invoke-Step -Name "frontend unit tests" -Script {
    Push-Location $frontendDir
    try {
        & npm run test --if-present
    } finally {
        Pop-Location
    }
}

Invoke-Step -Name "backend quick tests (ShopAPI)" -Script {
    Push-Location $shopApiDir
    try {
        & php artisan test
    } finally {
        Pop-Location
    }
}

Write-Host "[verify] quick verification passed."
exit 0
