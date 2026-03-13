param(
    [Parameter(Mandatory=$true)]
    [string]$Message,

    [Parameter(Mandatory = $true)]
    [string[]]$Body,

    [Parameter(Mandatory = $true)]
    [string]$AISystemName,

    [Parameter(Mandatory = $true)]
    [string]$LLMName = ""
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
    -Body $Body `
    -AISystemName $AISystemName `
    -LLMName $LLMName

exit $LASTEXITCODE
