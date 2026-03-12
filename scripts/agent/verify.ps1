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

function Wait-Healthcheck {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [int]$TimeoutSec = 30
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (Get-Command curl.exe -ErrorAction SilentlyContinue) {
            $status = (& curl.exe -s -o NUL -w "%{http_code}" --max-time 2 $Url).Trim()
            if ($status -match '^\d+$') {
                $code = [int]$status
                if ($code -ge 200 -and $code -lt 500) {
                    return $true
                }
            }
        } else {
            try {
                $response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 2 -UseBasicParsing
                if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                    return $true
                }
            } catch {
            }
        }

        Start-Sleep -Seconds 1
    }

    return $false
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
$systemTestsDir = Join-Path $repoRoot "system-tests"
$baseUrl = "http://127.0.0.1:8081"
$healthUrl = "$baseUrl/up"

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

if (-not (Test-Path (Join-Path $systemTestsDir "node_modules"))) {
    Write-Error "[verify] system-tests/node_modules is missing."
    exit 3
}

if ($env:OS -eq "Windows_NT") {
    $rollupWinBinary = Join-Path $systemTestsDir "node_modules/@rollup/rollup-win32-x64-msvc"
    if (-not (Test-Path $rollupWinBinary)) {
        Write-Error "[verify] missing optional dependency @rollup/rollup-win32-x64-msvc in system-tests. Run: cd system-tests && npm i"
        exit 3
    }
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

$ownsRuntime = $false
$serveProcess = $null
$stdoutLog = Join-Path $env:TEMP "verify-shopapi-serve.out.log"
$stderrLog = Join-Path $env:TEMP "verify-shopapi-serve.err.log"

try {
    if (-not (Wait-Healthcheck -Url $healthUrl -TimeoutSec 3)) {
        Write-Host "[verify] start local ShopAPI runtime at $baseUrl"
        Push-Location $shopApiDir
        try {
            $serveProcess = Start-Process `
                -FilePath "php" `
                -ArgumentList @("artisan", "serve", "--host=127.0.0.1", "--port=8081") `
                -RedirectStandardOutput $stdoutLog `
                -RedirectStandardError $stderrLog `
                -PassThru
            $ownsRuntime = $true
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "[verify] detected running runtime at $baseUrl"
    }

    if (-not (Wait-Healthcheck -Url $healthUrl -TimeoutSec 45)) {
        Write-Error "[verify] ShopAPI healthcheck is not ready: $healthUrl"
        exit 1
    }

    Invoke-Step -Name "system-tests quick-local" -Script {
        $oldBaseUrl = $env:BASE_URL
        $env:BASE_URL = $baseUrl
        Push-Location $systemTestsDir
        try {
            & npm run test:quick-local
        } finally {
            Pop-Location
            $env:BASE_URL = $oldBaseUrl
        }
    }
} finally {
    if ($ownsRuntime -and $serveProcess) {
        if (-not $serveProcess.HasExited) {
            Stop-Process -Id $serveProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "[verify] quick verification passed."
exit 0
