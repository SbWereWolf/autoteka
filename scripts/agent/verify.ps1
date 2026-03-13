param(
    [switch]$Staged,
    [ValidateSet("check","apply")]
    [string]$LintMode = "check",
    [string]$TestProfile = "minimal"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../read-scripts-env.ps1"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host "[verify] $Name"
    $global:LASTEXITCODE = 0
    & $Script
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[verify] failed: $Name"
        exit 1
    }
}

function Start-VerifyProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    Write-Host "[verify] $Name (started)"
    return Start-Process `
        -FilePath $FilePath `
        -ArgumentList $Arguments `
        -WorkingDirectory $WorkingDirectory `
        -NoNewWindow `
        -PassThru
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
$shopOperatorDir = Join-Path $repoRoot "backend/apps/ShopOperator"
$scriptsEnvPath = Join-Path $repoRoot "scripts/.env"
$scriptsEnv = Read-ScriptsEnv -Path $scriptsEnvPath
$parallelWorkers = 2

if ($scriptsEnv.ContainsKey("TEST_PARALLEL_WORKERS")) {
    $rawWorkers = $scriptsEnv["TEST_PARALLEL_WORKERS"]
    if (-not [int]::TryParse($rawWorkers, [ref]$parallelWorkers) -or $parallelWorkers -lt 1) {
        Write-Error "[verify] invalid TEST_PARALLEL_WORKERS='$rawWorkers' in scripts/.env. Expected integer >= 1."
        exit 2
    }
}

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

if (-not (Test-Path (Join-Path $shopOperatorDir "vendor"))) {
    Write-Error "[verify] backend/apps/ShopOperator/vendor is missing."
    exit 3
}

Invoke-Step -Name "minimal tests (parallel)" -Script {
    $processes = @(
        Start-VerifyProcess `
            -Name "frontend unit tests" `
            -WorkingDirectory $frontendDir `
            -FilePath "npm" `
            -Arguments @("run", "test:unit:parallel", "--if-present")
        Start-VerifyProcess `
            -Name "backend quick tests (ShopAPI)" `
            -WorkingDirectory $shopApiDir `
            -FilePath "php" `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers")
        Start-VerifyProcess `
            -Name "backend quick tests (ShopOperator)" `
            -WorkingDirectory $shopOperatorDir `
            -FilePath "php" `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers")
    )

    $hasFailures = $false
    foreach ($process in $processes) {
        $process.WaitForExit()
        $process.Refresh()
        if ($process.ExitCode -ne 0) {
            Write-Error "[verify] failed: process id=$($process.Id), exit code=$($process.ExitCode)"
            $hasFailures = $true
        }
    }

    if ($hasFailures) {
        exit 1
    }
}

Write-Host "[verify] quick verification passed."
exit 0
