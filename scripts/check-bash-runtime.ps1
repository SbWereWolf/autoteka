Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/resolve-bash-runtime.ps1"

function Invoke-BashRuntimeCheck {
  param(
    [string]$EnvPath = "$PSScriptRoot/.env"
  )

  $bashPath = Resolve-BashRuntime -EnvPath $EnvPath
  Write-Output "Using bash: $bashPath"

  & $bashPath -lc "echo ok"
  if ($LASTEXITCODE -ne 0) {
    throw "Bash runtime command failed."
  }

  $scriptContent = Get-Content -LiteralPath "$PSScriptRoot/commit-with-message.sh" -Raw
  $scriptContent | & $bashPath -n
  if ($LASTEXITCODE -ne 0) {
    throw "Bash syntax check failed for scripts/commit-with-message.sh"
  }

  Write-Output "Bash runtime check passed."
}

if ($MyInvocation.InvocationName -ne ".") {
  Invoke-BashRuntimeCheck
}
