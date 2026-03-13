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
    $resolvedCommand = Get-Command $FilePath -ErrorAction Stop | Select-Object -First 1
    $resolvedPath = if ($resolvedCommand.Path) { $resolvedCommand.Path } else { $resolvedCommand.Source }
    $startFilePath = $resolvedPath
    $startArguments = $Arguments
    $currentShellPath = (Get-Process -Id $PID).Path

    $isWindowsHost = $env:OS -eq "Windows_NT"
    if ($isWindowsHost -and $resolvedPath) {
        $extension = [System.IO.Path]::GetExtension($resolvedPath)
        switch ($extension.ToLowerInvariant()) {
            ".ps1" {
                $startFilePath = $currentShellPath
                $startArguments = @(
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", $resolvedPath
                ) + $Arguments
            }
            ".cmd" {
                $startFilePath = "cmd.exe"
                $startArguments = @("/d", "/c", $resolvedPath) + $Arguments
            }
            ".bat" {
                $startFilePath = "cmd.exe"
                $startArguments = @("/d", "/c", $resolvedPath) + $Arguments
            }
        }
    }

    return Start-Process `
        -FilePath $startFilePath `
        -ArgumentList $startArguments `
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
[int]$parallelWorkers = 2
$phpCommand = "php"

Invoke-Step -Name "activate node env" -Script {
    & (Join-Path $repoRoot "scripts/swap-env.ps1")
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$scriptsEnv = Read-ScriptsEnv -Path $scriptsEnvPath

if ($scriptsEnv.ContainsKey("TEST_PARALLEL_WORKERS")) {
    $rawWorkers = $scriptsEnv["TEST_PARALLEL_WORKERS"]
    $parsedParallelWorkers = 0
    if (-not [int]::TryParse($rawWorkers, [ref]$parsedParallelWorkers) -or $parsedParallelWorkers -lt 1) {
        Write-Error "[verify] invalid TEST_PARALLEL_WORKERS='$rawWorkers' in '$scriptsEnvPath'. Expected integer >= 1."
        exit 2
    }

    $parallelWorkers = $parsedParallelWorkers
}

if ($scriptsEnv.ContainsKey("SCRIPT_PHP_PATH")) {
    $configuredPhpPath = $scriptsEnv["SCRIPT_PHP_PATH"].Trim()
    if ([string]::IsNullOrWhiteSpace($configuredPhpPath)) {
        Write-Error "[verify] SCRIPT_PHP_PATH is empty in '$scriptsEnvPath'."
        exit 2
    }

    if (-not (Test-Path -LiteralPath $configuredPhpPath -PathType Leaf)) {
        Write-Error "[verify] SCRIPT_PHP_PATH '$configuredPhpPath' does not exist."
        exit 3
    }

    $phpCommand = $configuredPhpPath
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "[verify] npm not found."
    exit 3
}

if (-not (Get-Command $phpCommand -ErrorAction SilentlyContinue)) {
    Write-Error "[verify] php not found: $phpCommand"
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
            -FilePath $phpCommand `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers")
        Start-VerifyProcess `
            -Name "backend quick tests (ShopOperator)" `
            -WorkingDirectory $shopOperatorDir `
            -FilePath $phpCommand `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers")
    )

    $hasFailures = $false
    foreach ($process in $processes) {
        $process.WaitForExit()
        $process.Refresh()
        $exitCode = $process.ExitCode
        if ($null -eq $exitCode -and $process.HasExited) {
            $exitCode = 0
        }

        if ($exitCode -ne 0) {
            Write-Error "[verify] failed: process id=$($process.Id), exit code=$exitCode"
            $hasFailures = $true
        }
    }

    if ($hasFailures) {
        exit 1
    }
}

Write-Host "[verify] quick verification passed."
exit 0
