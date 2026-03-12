param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

& "$PSScriptRoot/verify.ps1" -Staged -LintMode apply -TestProfile minimal
if ($LASTEXITCODE -ne 0) {
    Write-Error "Verification failed."
    exit 1
}

$forbidden = git diff --name-only --cached | Where-Object {
    $_ -like "operational/*" -or $_ -like "logs/*"
}

if ($forbidden) {
    Write-Error "Forbidden paths staged."
    exit 2
}

if (-not (Test-Path "scripts/commit-with-message.ps1")) {
    exit 3
}

& "scripts/commit-with-message.ps1" `
    -Subject $Message `
    -Body @("Apply one logical staged change via safe-commit.") `
    -AISystemName "Codex" `
    -LLMName "gpt-5"

exit $LASTEXITCODE
