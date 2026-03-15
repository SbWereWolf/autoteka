Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Read-ScriptsEnv {
  param(
    [string]$Path = "scripts/.env"
  )

  $values = @{}

  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  $lineNo = 0
  foreach ($rawLine in [System.IO.File]::ReadAllLines($Path)) {
    $lineNo += 1
    $line = $rawLine.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith("#")) {
      continue
    }

    $eqPos = $line.IndexOf("=")
    if ($eqPos -lt 1) {
      Write-Warning "Skip invalid env line $lineNo in '$Path': $rawLine"
      continue
    }

    $key = $line.Substring(0, $eqPos).Trim()
    $value = $line.Substring($eqPos + 1).Trim()

    if ($key.Length -eq 0) {
      Write-Warning "Skip env line with empty key at $lineNo in '$Path'."
      continue
    }

    $values[$key] = $value
  }

  return $values
}
