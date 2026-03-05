param(
  [Parameter(Mandatory = $true)]
  [string]$Subject,

  [Parameter(Mandatory = $true)]
  [string[]]$Body,

  [Parameter(Mandatory = $true)]
  [string]$Platform,

  [string]$Model = "gpt-5",

  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-SlugPart {
  param(
    [Parameter(Mandatory = $true)][string]$Value,
    [Parameter(Mandatory = $true)][string]$Name
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "$Name is required."
  }

  if ($Value -notmatch "^[A-Za-z0-9._-]{1,64}$") {
    throw "$Name has invalid format: '$Value'. Allowed: [A-Za-z0-9._-], max 64."
  }
}

function Format-ListItemWrap {
  param(
    [Parameter(Mandatory = $true)][int]$Number,
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][int]$Width
  )

  $normalized = ($Text -replace "(`r`n|`n|`r)", " ") -replace "\s+", " "
  $normalized = $normalized.Trim()
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    throw "Body item #$Number is empty after normalization."
  }

  $prefix = "$Number. "
  $indent = " " * $prefix.Length
  $words = $normalized -split "\s+"
  $result = New-Object System.Collections.Generic.List[string]
  $current = $prefix
  $currentLimit = $Width

  foreach ($word in $words) {
    if ([string]::IsNullOrWhiteSpace($word)) {
      continue
    }

    $candidate = if ($current.Trim().Length -eq 0) { "$indent$word" } else { "$current$word" }
    if ($candidate.Length -le $currentLimit) {
      $current = "$candidate "
    }
    else {
      $result.Add($current.TrimEnd())
      $current = "$indent$word "
    }
  }

  if (-not [string]::IsNullOrWhiteSpace($current)) {
    $result.Add($current.TrimEnd())
  }

  return $result
}

function Write-CanonicalMessage {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$SubjectLine,
    [Parameter(Mandatory = $true)][System.Collections.Generic.List[string]]$BodyLines,
    [Parameter(Mandatory = $true)][string]$AuthorLine
  )

  $normalizedBody = New-Object System.Collections.Generic.List[string]
  foreach ($line in $BodyLines) {
    if (-not [string]::IsNullOrWhiteSpace($line)) {
      $normalizedBody.Add($line.TrimEnd())
    }
  }

  if ($normalizedBody.Count -eq 0) {
    throw "Commit body is empty after normalization."
  }

  $normalized = New-Object System.Collections.Generic.List[string]
  $normalized.Add($SubjectLine.TrimEnd())
  $normalized.Add("")
  foreach ($line in $normalizedBody) {
    $normalized.Add($line)
  }
  $normalized.Add($AuthorLine.TrimEnd())

  $content = ([string]::Join("`n", $normalized)) + "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $content, $utf8NoBom)
}

if ($Subject.Length -gt 50) {
  throw "Subject is too long ($($Subject.Length)). Max: 50."
}

if ($Body.Count -eq 0) {
  throw "At least one Body item is required."
}

Assert-SlugPart -Value $Platform -Name "Platform"
Assert-SlugPart -Value $Model -Name "Model"

$identityName = "$Platform-$Model"
$identityEmail = "$identityName@local"

$bodyLines = New-Object System.Collections.Generic.List[string]

for ($i = 0; $i -lt $Body.Count; $i++) {
  $wrappedItemLines = Format-ListItemWrap -Number ($i + 1) -Text $Body[$i] -Width 70
  foreach ($wrappedLine in $wrappedItemLines) {
    $bodyLines.Add($wrappedLine)
  }
}
$authorLine = "Author: $identityName"

$tmpName = ".commit-message-$([guid]::NewGuid().ToString()).md"
$tmpPath = Join-Path "." $tmpName

try {
  Write-CanonicalMessage -Path $tmpPath -SubjectLine $Subject -BodyLines $bodyLines -AuthorLine $authorLine

  & npx prettier --write $tmpPath
  if ($LASTEXITCODE -ne 0) { throw "Prettier failed: $tmpPath" }

  Write-CanonicalMessage -Path $tmpPath -SubjectLine $Subject -BodyLines $bodyLines -AuthorLine $authorLine

  if ($DryRun) {
    Write-Output "Dry run mode: commit was not created."
    Write-Output "Author: $identityName <$identityEmail>"
    Write-Output "Commit message:"
    Get-Content $tmpPath
    return
  }

  $oldAuthorName = $env:GIT_AUTHOR_NAME
  $oldAuthorEmail = $env:GIT_AUTHOR_EMAIL
  $oldCommitterName = $env:GIT_COMMITTER_NAME
  $oldCommitterEmail = $env:GIT_COMMITTER_EMAIL
  try {
    $env:GIT_AUTHOR_NAME = $identityName
    $env:GIT_AUTHOR_EMAIL = $identityEmail
    $env:GIT_COMMITTER_NAME = $identityName
    $env:GIT_COMMITTER_EMAIL = $identityEmail

    & git -c "user.name=$identityName" -c "user.email=$identityEmail" commit --author "$identityName <$identityEmail>" -F $tmpPath
    if ($LASTEXITCODE -ne 0) {
      throw "git commit failed."
    }
  }
  finally {
    $env:GIT_AUTHOR_NAME = $oldAuthorName
    $env:GIT_AUTHOR_EMAIL = $oldAuthorEmail
    $env:GIT_COMMITTER_NAME = $oldCommitterName
    $env:GIT_COMMITTER_EMAIL = $oldCommitterEmail
  }
}
finally {
  if (Test-Path $tmpPath) {
    Remove-Item -Path $tmpPath -Force -ErrorAction SilentlyContinue
  }
}
