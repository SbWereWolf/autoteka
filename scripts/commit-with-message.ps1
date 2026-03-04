param(
  [Parameter(Mandatory = $true)]
  [string]$Subject,

  [Parameter(Mandatory = $true)]
  [string[]]$Body,

  [string]$AgentId = "assistant",
  [string]$ModelName = "gpt-5",
  [string]$CommitUserName = "assistant",
  [string]$CommitUserEmail = "assistant@local"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-CommitIdentity {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Email
  )

  $safeName = if ($Name -match "^[A-Za-z0-9._-]{1,64}$") { $Name } else { "assistant" }
  $safeEmail = if ($Email -match "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$") { $Email } else { "assistant@local" }

  return @{
    Name = $safeName
    Email = $safeEmail
  }
}

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
for ($i = 0; $i -lt $Body.Count; $i++) {
  $part = $Body[$i]
  $splitLines = $part -split "(`r`n|`n|`r)"
  foreach ($line in $splitLines) {
    $bodySourceLines.Add($line)
  }
  if ($i -lt $Body.Count - 1) {
    $bodySourceLines.Add("")
  }
}

if ($bodySourceLines.Count -gt 0 -and $bodySourceLines[$bodySourceLines.Count - 1] -ne "") {
  $bodySourceLines.Add("")
}
$bodySourceLines.Add("Author: $AgentId $ModelName")

$bodyLines = New-Object System.Collections.Generic.List[string]
foreach ($line in $bodySourceLines) {
  if ($line -eq "") {
    $bodyLines.Add("")
    continue
  }
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

$tmpName = ".commit-message-$([guid]::NewGuid().ToString()).md"
$tmpPath = Join-Path "." $tmpName

try {
  $messageText = ([string]::Join("`n", $messageLines)) + "`n"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($tmpPath, $messageText, $utf8NoBom)

  & npx prettier --write $tmpPath
  if ($LASTEXITCODE -ne 0) { throw "Prettier failed: $tmpPath" }

  & npx markdownlint-cli --fix --disable MD041 $tmpPath
  if ($LASTEXITCODE -ne 0) { throw "markdownlint --fix failed: $tmpPath" }

  & npx markdownlint-cli --disable MD041 $tmpPath
  if ($LASTEXITCODE -ne 0) { throw "markdownlint failed: $tmpPath" }

  $identity = Resolve-CommitIdentity -Name $CommitUserName -Email $CommitUserEmail
  $effectiveCommitUserName = $identity.Name
  $effectiveCommitUserEmail = $identity.Email

  $oldAuthorName = $env:GIT_AUTHOR_NAME
  $oldAuthorEmail = $env:GIT_AUTHOR_EMAIL
  $oldCommitterName = $env:GIT_COMMITTER_NAME
  $oldCommitterEmail = $env:GIT_COMMITTER_EMAIL
  try {
    $env:GIT_AUTHOR_NAME = $effectiveCommitUserName
    $env:GIT_AUTHOR_EMAIL = $effectiveCommitUserEmail
    $env:GIT_COMMITTER_NAME = $effectiveCommitUserName
    $env:GIT_COMMITTER_EMAIL = $effectiveCommitUserEmail

    & git -c "user.name=$effectiveCommitUserName" -c "user.email=$effectiveCommitUserEmail" commit --author "$effectiveCommitUserName <$effectiveCommitUserEmail>" -F $tmpPath
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
