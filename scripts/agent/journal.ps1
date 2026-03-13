param(
    [Parameter(Mandatory = $true)]
    [string]$Message,
    [Parameter(Mandatory = $true)]
    [ValidateSet("UserMessage", "ProposedPlan", "FinalAnswer")]
    [string]$Type,
    [Parameter(Mandatory = $true)]
    [string]$AISystemName,
    [Parameter(Mandatory = $true)]
    [string]$LLMName
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path "scripts/log-entry.ps1")) {
    exit 3
}

& "scripts/log-entry.ps1" `
    -Type $Type `
    -Message $Message `
    -AISystemName $AISystemName `
    -LLMName $LLMName

exit $LASTEXITCODE
