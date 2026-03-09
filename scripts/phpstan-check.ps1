param(
  [string[]]$Modules = @(
    "backend/apps/API",
    "backend/apps/DatabaseOperator",
    "backend/packages/SchemaDefinition"
  )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
  param([string]$Message)
  Write-Host "[phpstan-check] $Message"
}

function Resolve-PhpstanBinary {
  param([string]$ModulePath)

  $bat = Join-Path $ModulePath "vendor/bin/phpstan.bat"
  $sh = Join-Path $ModulePath "vendor/bin/phpstan"

  if (Test-Path $bat) { return $bat }
  if (Test-Path $sh) { return $sh }
  return $null
}

$repoRoot = (Get-Location).Path
$hasErrors = $false

foreach ($module in $Modules) {
  $modulePath = Join-Path $repoRoot $module
  $composerPath = Join-Path $modulePath "composer.json"
  $configPath = Join-Path $modulePath "phpstan.neon"

  if (-not (Test-Path $modulePath)) {
    Write-Log "ERROR: module not found: $module"
    $hasErrors = $true
    continue
  }

  if (-not (Test-Path $composerPath)) {
    Write-Log "ERROR: composer.json not found: $module"
    $hasErrors = $true
    continue
  }

  if (-not (Test-Path $configPath)) {
    Write-Log "ERROR: phpstan.neon not found: $module"
    $hasErrors = $true
    continue
  }

  $phpstan = Resolve-PhpstanBinary -ModulePath $modulePath
  if (-not $phpstan) {
    Write-Log "ERROR: phpstan binary not found in $module/vendor/bin"
    $hasErrors = $true
    continue
  }

  Write-Log "Running: $module"
  Push-Location $modulePath
  try {
    & $phpstan analyse --configuration "phpstan.neon" --no-progress
    if ($LASTEXITCODE -ne 0) {
      Write-Log "ERROR: phpstan failed for $module"
      $hasErrors = $true
    }
    else {
      Write-Log "OK: $module"
    }
  }
  finally {
    Pop-Location
  }
}

if ($hasErrors) {
  exit 1
}

exit 0
