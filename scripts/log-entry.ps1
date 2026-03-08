param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("UserRequest", "ProposedPlan", "ResultReport")]
  [string]$Type,

  [Parameter(Mandatory = $true)]
  [string]$Message,

  [Parameter(Mandatory = $true)]
  [string]$AISystemName,

  [Parameter(Mandatory = $true)]
  [string]$LLMName,

  [string]$LogFilename
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Warn {
  param([Parameter(Mandatory = $true)][string]$Text)
  [Console]::Error.WriteLine("[warn] $Text")
}

function Get-SectionTitleByType {
  param([Parameter(Mandatory = $true)][string]$EntryType)

  switch ($EntryType) {
    "UserRequest" { return "Запрос пользователя" }
    "ProposedPlan" { return "Предложенный план" }
    "ResultReport" { return "Доклад" }
    default { return "Запись" }
  }
}

function Get-LogFileName {
  param(
    [Parameter(Mandatory = $true)][string]$AISystemName,
    [Parameter(Mandatory = $true)][string]$LLMName,
    [Parameter(Mandatory = $true)][string]$DirectoryPath
  )

  $unix = [int64][DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

  do {
    $rand = Get-Random -Minimum 1111 -Maximum 10000
    $name = "$unix-$rand-$AISystemName-$LLMName.md"
    $candidate = Join-Path $DirectoryPath $name
  } while (Test-Path -LiteralPath $candidate)

  return $name
}

function Get-DateFromLogFilename {
  param(
    [Parameter(Mandatory = $true)][string]$FileName,
    [Parameter(Mandatory = $true)][datetime]$FallbackDate
  )

  if ($FileName -match '^(?<UnixTs>\d+)') {
    try {
      $unix = [int64]$matches.UnixTs
      $utcDate = [DateTimeOffset]::FromUnixTimeSeconds($unix).UtcDateTime
      return $utcDate.ToLocalTime()
    }
    catch {
      return $FallbackDate
    }
  }

  return $FallbackDate
}

function Get-DailyLogDirectory {
  param(
    [Parameter(Mandatory = $true)][string]$LogsRoot,
    [Parameter(Mandatory = $true)][datetime]$Now
  )

  $yearDir = Join-Path $LogsRoot $Now.ToString("yyyy")
  $monthDir = Join-Path $yearDir $Now.ToString("MM")
  $dayDir = Join-Path $monthDir $Now.ToString("dd")
  return $dayDir
}

function Add-HeaderForEmptyFile {
  param([Parameter(Mandatory = $true)][string]$FilePath)

  try {
    $exists = Test-Path -LiteralPath $FilePath
    $size = if ($exists) { (Get-Item -LiteralPath $FilePath).Length } else { 0 }

    if (-not $exists -or $size -eq 0) {
      $stamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"
      $header = "# $stamp"
      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($FilePath, "$header`n`n", $utf8NoBom)
    }
  }
  catch {
    Write-Warn "Не удалось добавить заголовок в ${FilePath}: $($_.Exception.Message)"
  }
}

function Add-Entry {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Section,
    [Parameter(Mandatory = $true)][string]$Body
  )

  try {
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $entry = "## $Section`n$Body`n`n"
    [System.IO.File]::AppendAllText($FilePath, $entry, $utf8NoBom)
  }
  catch {
    Write-Warn "Не удалось дописать запись в ${FilePath}: $($_.Exception.Message)"
  }
}

function Invoke-LogLint {
  param(
    [Parameter(Mandatory = $true)][string]$RepoRoot,
    [Parameter(Mandatory = $true)][string]$FilePath
  )

  try {
    $lintScript = Join-Path $RepoRoot "lint/lint.ps1"
    if (-not (Test-Path -LiteralPath $lintScript)) {
      Write-Warn "Линтер не найден: $lintScript"
      return
    }

    $lintOutput = & pwsh $lintScript -Path $FilePath -Mode Warn 2>&1
    if ($lintOutput) {
      foreach ($line in $lintOutput) {
        Write-Warn ([string]$line)
      }
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Warn "Линтер вернул код $LASTEXITCODE для $FilePath"
    }
  }
  catch {
    Write-Warn "Сбой запуска линтера для ${FilePath}: $($_.Exception.Message)"
  }
}

$repoRoot = (Get-Location).Path
$logsRoot = Join-Path $repoRoot "logs"
$currentLogFilename = $LogFilename
$targetFile = $null

try {
  New-Item -ItemType Directory -Path $logsRoot -Force | Out-Null
}
catch {
  Write-Warn "Не удалось создать корневой каталог логов ${logsRoot}: $($_.Exception.Message)"
}

if ([string]::IsNullOrWhiteSpace($currentLogFilename)) {
  $now = Get-Date
  $dailyDir = Get-DailyLogDirectory -LogsRoot $logsRoot -Now $now
  try {
    New-Item -ItemType Directory -Path $dailyDir -Force | Out-Null
    $currentLogFilename = Get-LogFileName -AISystemName $AISystemName -LLMName $LLMName -DirectoryPath $dailyDir
    $targetFile = Join-Path $dailyDir $currentLogFilename

    if (-not (Test-Path -LiteralPath $targetFile)) {
      New-Item -ItemType File -Path $targetFile -Force | Out-Null
    }
  }
  catch {
    Write-Warn "Не удалось создать новый log-файл: $($_.Exception.Message)"
  }
}
else {
  $currentLogFilename = [System.IO.Path]::GetFileName($currentLogFilename)

  if ([string]::IsNullOrWhiteSpace($currentLogFilename)) {
    $now = Get-Date
    $dailyDir = Get-DailyLogDirectory -LogsRoot $logsRoot -Now $now
    $currentLogFilename = Get-LogFileName -AISystemName $AISystemName -LLMName $LLMName -DirectoryPath $dailyDir
    $targetFile = Join-Path $dailyDir $currentLogFilename
  }
  else {
    $nowForLog = Get-Date
    $targetDate = Get-DateFromLogFilename -FileName $currentLogFilename -FallbackDate $nowForLog
    $targetDir = Get-DailyLogDirectory -LogsRoot $logsRoot -Now $targetDate

    try {
      New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
      $targetFile = Join-Path $targetDir $currentLogFilename

      if (-not (Test-Path -LiteralPath $targetFile)) {
        New-Item -ItemType File -Path $targetFile -Force | Out-Null
      }
    }
    catch {
      Write-Warn "Не удалось создать log-файл по имени ${currentLogFilename}: $($_.Exception.Message)"
    }
  }
}

if (-not [string]::IsNullOrWhiteSpace($targetFile)) {
  Add-HeaderForEmptyFile -FilePath $targetFile
  $section = Get-SectionTitleByType -EntryType $Type
  Add-Entry -FilePath $targetFile -Section $section -Body $Message
  Invoke-LogLint -RepoRoot $repoRoot -FilePath $targetFile
}

Write-Output $currentLogFilename
exit 0
