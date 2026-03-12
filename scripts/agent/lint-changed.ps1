param(
    [ValidateSet("check","apply")]
    [string]$Mode = "check",
    [switch]$Staged
)

$ErrorActionPreference = "Stop"

$files = & "$PSScriptRoot/changed-files.ps1" @(
if ($Staged) { "-Staged" }
)

if (-not $files) {
    exit 0
}

$hasNode = Test-Path "package.json"
$hasComposer = Test-Path "composer.json"

if ($hasNode -and (Get-Command npm -ErrorAction SilentlyContinue)) {
    if ($Mode -eq "check") {
        npm run lint --if-present
    } else {
        npm run lint:fix --if-present
    }
}

if ($hasComposer -and (Get-Command vendor/bin/php-cs-fixer -ErrorAction SilentlyContinue)) {
    if ($Mode -eq "check") {
        vendor/bin/php-cs-fixer fix --dry-run --diff
    } else {
        vendor/bin/php-cs-fixer fix
    }
}

exit $LASTEXITCODE
