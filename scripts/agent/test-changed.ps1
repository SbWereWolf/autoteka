param(
    [string]$Profile = "minimal"
)

$ErrorActionPreference = "Stop"

if (Test-Path "package.json") {
    if (-not (Test-Path "node_modules")) {
        exit 3
    }

    if (Get-Command npm -ErrorAction SilentlyContinue) {
        if ($Profile -eq "minimal") {
            npm test --if-present
        } else {
            npm run test:full --if-present
        }
    }
}

if (Test-Path "composer.json") {
    if (-not (Test-Path "vendor")) {
        exit 3
    }

    if (Get-Command vendor/bin/phpunit -ErrorAction SilentlyContinue) {
        vendor/bin/phpunit
    }
}

exit $LASTEXITCODE
