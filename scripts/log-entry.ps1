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

  [string]$LogId
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Warn {
  param([Parameter(Mandatory = $true)][string]$Text)
  [Console]::Error.WriteLine("[warn] $Text")
}

function Get-LogId {
  return ([guid]::NewGuid().ToString("N"))
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

function Read-Index {
  param([Parameter(Mandatory = $true)][string]$IndexPath)

  $map = [ordered]@{}

  if (-not (Test-Path -LiteralPath $IndexPath)) {
    return $map
  }

  try {
    foreach ($line in (Get-Content -LiteralPath $IndexPath -Encoding utf8)) {
      if ([string]::IsNullOrWhiteSpace($line)) {
        continue
      }

      $eqIdx = $line.IndexOf("=")
      if ($eqIdx -lt 1) {
        continue
      }

      $key = $line.Substring(0, $eqIdx).Trim()
      $value = $line.Substring($eqIdx + 1)
      if ([string]::IsNullOrWhiteSpace($key)) {
        continue
      }

      $map[$key] = $value
    }
  }
  catch {
    Write-Warn "Не удалось прочитать индекс ${IndexPath}: $($_.Exception.Message)"
  }

  return $map
}

function Write-Index {
  param(
    [Parameter(Mandatory = $true)][string]$IndexPath,
    [Parameter(Mandatory = $true)][hashtable]$Map
  )

  try {
    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($k in $Map.Keys) {
      $lines.Add("$k=$($Map[$k])")
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($IndexPath, $lines, $utf8NoBom)
  }
  catch {
    Write-Warn "Не удалось записать индекс ${IndexPath}: $($_.Exception.Message)"
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
$indexPath = Join-Path $logsRoot "log-index.map"
$currentLogId = $LogId
$targetFile = $null

try {
  New-Item -ItemType Directory -Path $logsRoot -Force | Out-Null
}
catch {
  Write-Warn "Не удалось создать корневой каталог логов ${logsRoot}: $($_.Exception.Message)"
}

$index = Read-Index -IndexPath $indexPath

if ([string]::IsNullOrWhiteSpace($currentLogId)) {
  $currentLogId = Get-LogId

  $now = Get-Date
  $dailyDir = Get-DailyLogDirectory -LogsRoot $logsRoot -Now $now
  try {
    New-Item -ItemType Directory -Path $dailyDir -Force | Out-Null
    $fileName = Get-LogFileName -AISystemName $AISystemName -LLMName $LLMName -DirectoryPath $dailyDir
    $targetFile = Join-Path $dailyDir $fileName

    if (-not (Test-Path -LiteralPath $targetFile)) {
      New-Item -ItemType File -Path $targetFile -Force | Out-Null
    }

    $relativeFromRepo = [System.IO.Path]::GetRelativePath($repoRoot, $targetFile)
    $index[$currentLogId] = $relativeFromRepo
    Write-Index -IndexPath $indexPath -Map $index
  }
  catch {
    Write-Warn "Не удалось создать новый log-файл: $($_.Exception.Message)"
  }
}
else {
  if ($index.Contains($currentLogId)) {
    $savedPath = [string]$index[$currentLogId]
    if ([System.IO.Path]::IsPathRooted($savedPath)) {
      $targetFile = $savedPath
    }
    else {
      $targetFile = Join-Path $repoRoot $savedPath
    }
  }
  else {
    Write-Warn "log_id не найден в индексе: $currentLogId"
  }
}

if (-not [string]::IsNullOrWhiteSpace($targetFile)) {
  Add-HeaderForEmptyFile -FilePath $targetFile
  $section = Get-SectionTitleByType -EntryType $Type
  Add-Entry -FilePath $targetFile -Section $section -Body $Message
  Invoke-LogLint -RepoRoot $repoRoot -FilePath $targetFile

  if ($Type -eq "ResultReport") {
    if ($index.Contains($currentLogId)) {
      $index.Remove($currentLogId)
      Write-Index -IndexPath $indexPath -Map $index
    }
  }
}

Write-Output $currentLogId
exit 0
