param(
    [Parameter(Mandatory = $true)]
    [string]$Message,
    [ValidateSet("UserMessage", "ProposedPlan", "FinalAnswer")]
    [string]$Type = "ProposedPlan",
    [string]$AISystemName = "Codex",
    [string]$LLMName = "gpt-5"
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
