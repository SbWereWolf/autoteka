Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. "$PSScriptRoot/read-scripts-env.ps1"

function Resolve-BashRuntime {
  param(
    [string]$EnvPath = "$PSScriptRoot/.env"
  )

  $checkedSources = New-Object System.Collections.Generic.List[string]
  $envValues = Read-ScriptsEnv -Path $EnvPath

  if ($envValues.ContainsKey("SCRIPT_BASH_PATH")) {
    $bashPath = $envValues["SCRIPT_BASH_PATH"].Trim()
    if ($bashPath.Length -gt 0) {
      $checkedSources.Add("SCRIPT_BASH_PATH=$bashPath")
      if (Test-Path -LiteralPath $bashPath) {
        return (Resolve-Path -LiteralPath $bashPath).Path
      }
      throw "Bash path from SCRIPT_BASH_PATH does not exist: '$bashPath'"
    }
  }

  $checkedSources.Add("PATH:bash")
  $cmd = Get-Command bash -ErrorAction SilentlyContinue
  if ($null -ne $cmd -and -not [string]::IsNullOrWhiteSpace($cmd.Source)) {
    return $cmd.Source
  }

  throw "Unable to resolve bash runtime. Checked: $([string]::Join(', ', $checkedSources))"
}

if ($MyInvocation.InvocationName -ne ".") {
  Resolve-BashRuntime
}
