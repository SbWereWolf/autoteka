param(
  [Parameter(Mandatory = $true)]
  [string]$Subject,

  [Parameter(Mandatory = $true)]
  [string[]]$Body,

  [string]$AgentId = "assistant",
  [string]$ModelName = "gpt-5"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Format-TextWrap {
  param(
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][int]$Width
  )

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return @("")
  }

  $words = $Text -split "\s+"
  $lines = New-Object System.Collections.Generic.List[string]
  $current = ""

  foreach ($word in $words) {
    if ([string]::IsNullOrWhiteSpace($word)) {
      continue
    }

    if ([string]::IsNullOrEmpty($current)) {
      $current = $word
      continue
    }

    $candidate = "$current $word"
    if ($candidate.Length -le $Width) {
      $current = $candidate
    }
    else {
      $lines.Add($current)
      $current = $word
    }
  }

  if (-not [string]::IsNullOrEmpty($current)) {
    $lines.Add($current)
  }

  return $lines
}

if ($Subject.Length -gt 50) {
  throw "Subject is too long ($($Subject.Length)). Max: 50."
}

$bodySourceLines = New-Object System.Collections.Generic.List[string]
foreach ($part in $Body) {
  $splitLines = $part -split "(`r`n|`n|`r)"
  foreach ($line in $splitLines) {
    $bodySourceLines.Add($line)
  }
}

$bodySourceLines.Add("Created by $AgentId $ModelName")

$bodyLines = New-Object System.Collections.Generic.List[string]
foreach ($line in $bodySourceLines) {
  $wrapped = Format-TextWrap -Text $line -Width 70
  foreach ($wrappedLine in $wrapped) {
    $bodyLines.Add($wrappedLine)
  }
}

$messageLines = New-Object System.Collections.Generic.List[string]
$messageLines.Add($Subject)
$messageLines.Add("")
foreach ($line in $bodyLines) {
  $messageLines.Add($line)
}

$tmpName = "commit-message-$([guid]::NewGuid().ToString()).md"
$tmpPath = Join-Path ".git" $tmpName

try {
  $messageLines | Set-Content -Path $tmpPath -Encoding utf8

  & pwsh ./lint/lint.ps1 -Path $tmpPath
  if ($LASTEXITCODE -ne 0) {
    throw "Lint failed for commit message file: $tmpPath"
  }

  & git commit -F $tmpPath
  if ($LASTEXITCODE -ne 0) {
    throw "git commit failed."
  }
}
finally {
  if (Test-Path $tmpPath) {
    Remove-Item -Path $tmpPath -Force -ErrorAction SilentlyContinue
  }
}
