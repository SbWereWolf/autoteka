param(
  [Parameter(Mandatory = $true, ValueFromPipeline = $true)]
  [string[]]$Path,

  [ValidateSet("Strict","Warn","DryRun")]
  [string]$Mode = "Warn"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --------------------------------------------------
# INIT
# --------------------------------------------------

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir "lint-rules.yml"
$WinEnvPath = Join-Path $ScriptDir "win.env"
$NixEnvPath = Join-Path $ScriptDir "nix.env"

if (-not (Test-Path $ConfigPath)) {
  Write-Error "lint-rules.yml not found"
  exit 1
}

function Write-Log {
  param([string]$Message)
  Write-Host "[lint] $Message"
}

function Test-IsWsl {
  if (-not $IsLinux) {
    return $false
  }

  if ($env:WSL_DISTRO_NAME) {
    return $true
  }

  try {
    return (Get-Content "/proc/version" -Raw) -match "(?i)microsoft"
  }
  catch {
    return $false
  }
}

$IsWsl = Test-IsWsl

# --------------------------------------------------
# LOAD ENV
# --------------------------------------------------

$EnvPath = $null

if ($IsWindows -or $IsWsl) {
  if (Test-Path $WinEnvPath) {
    $EnvPath = $WinEnvPath
  }
}
else {
  if (Test-Path $NixEnvPath) {
    $EnvPath = $NixEnvPath
  }
}

if ($EnvPath) {
  Write-Log "Loading env: $EnvPath"

  Get-Content $EnvPath | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
      $name  = $matches[1].Trim()
      $value = $matches[2].Trim()
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}
else {
  Write-Log "Env file not found, continuing with current environment"
}

# --------------------------------------------------
# LOAD YAML
# --------------------------------------------------

if (-not (Get-Module -ListAvailable powershell-yaml)) {
  Install-Module powershell-yaml -Scope CurrentUser -Force
}

Import-Module powershell-yaml -ErrorAction Stop
$Config = ConvertFrom-Yaml (Get-Content $ConfigPath -Raw)

# --------------------------------------------------
# UTILITIES
# --------------------------------------------------

function Convert-InputPath {
  param([string]$InputPath)

  if ($InputPath -match '^[A-Za-z]:\\') {
    if ($IsWindows) {
      return $InputPath
    }

    if ($IsWsl) {
      $wslpathCmd = Get-Command wslpath -ErrorAction SilentlyContinue

      if ($wslpathCmd) {
        $converted = & $wslpathCmd.Source -u $InputPath 2>$null
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($converted)) {
          return $converted.Trim()
        }

        Write-Log "wslpath failed for path: $InputPath"
        return $InputPath
      }

      Write-Log "wslpath not found, cannot convert Windows path in WSL: $InputPath"
      return $InputPath
    }
  }

  return $InputPath
}

function Expand-EnvVariables {
  param([string]$Command)

  $missingVars = New-Object System.Collections.Generic.List[string]

  $expanded = [regex]::Replace(
    $Command,
    '\$\{([A-Za-z0-9_]+)\}',
    {
      param($match)

      $varName = $match.Groups[1].Value
      $value = [System.Environment]::GetEnvironmentVariable($varName)

      if ([string]::IsNullOrWhiteSpace($value)) {
        if (-not $missingVars.Contains($varName)) {
          [void]$missingVars.Add($varName)
        }
        return ""
      }

      return $value
    }
  )

  [pscustomobject]@{
    Expanded = $expanded
    MissingVars = $missingVars
  }
}

function Invoke-ExternalCommand {
  param(
    [Parameter(Mandatory)][string]$CommandLine,
    [Parameter(Mandatory)][string]$File
  )

  $expansion = Expand-EnvVariables $CommandLine

  if ($expansion.MissingVars.Count -gt 0) {
    $missing = ($expansion.MissingVars -join ", ")
    Write-Log "SKIP (empty env): $CommandLine | missing: $missing"
    return
  }

  $Expanded = $expansion.Expanded.Trim()
  if ([string]::IsNullOrWhiteSpace($Expanded)) {
    Write-Log "SKIP (empty command after env expansion): $CommandLine"
    return
  }

  if ($Mode -eq "DryRun") {
    Write-Log "DRYRUN: $Expanded `"$File`""
    return
  }

  $FullCommand = "$Expanded `"$File`""
  Write-Log "Running: $FullCommand"

  if ($IsWindows) {
    $cmdRunner = Get-Command cmd.exe -ErrorAction SilentlyContinue
    if ($cmdRunner) {
      & $cmdRunner.Source /c $FullCommand
    }
    else {
      throw "cmd.exe not found on Windows host"
    }
  }
  else {
    bash -lc "$FullCommand"
  }

  if ($LASTEXITCODE -ne 0) {
    $msg = "Command failed ($LASTEXITCODE): $FullCommand"

    if ($Mode -eq "Strict") {
      throw $msg
    }

    Write-Log "WARN: $msg"
  }
}

function Get-RuleForFile {
  param([string]$FilePath)

  $extension = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
  $fileName  = [System.IO.Path]::GetFileName($FilePath).ToLowerInvariant()

  foreach ($key in $Config.rules.Keys) {

    $normalizedKey = $key.ToLowerInvariant()

    if ($normalizedKey -eq $extension) {
      return $Config.rules[$key]
    }

    # для Makefile и Dockerfile без расширения
    if ([string]::IsNullOrWhiteSpace($extension) -and
      $normalizedKey -eq $fileName) {

      return $Config.rules[$key]
    }
  }

  return $null
}

function Invoke-FileLint {
  param([string]$FilePath)

  if (-not (Test-Path $FilePath)) {
    Write-Log "Skipping missing file: $FilePath"
    return
  }

  $Resolved = (Resolve-Path $FilePath).Path
  $Rule = Get-RuleForFile $Resolved

  if (-not $Rule) {
    Write-Log "No rule for: $Resolved"
    return
  }

  try {
    # FORMAT
    if ($Rule.ContainsKey("format")) {
      $formatRule = $Rule["format"]
      if ($formatRule -is [System.Collections.IEnumerable] -and -not ($formatRule -is [string])) {
        foreach ($fmtCmd in $formatRule) {
          Invoke-ExternalCommand $fmtCmd $Resolved
        }
      }
      else {
        Invoke-ExternalCommand $formatRule $Resolved
      }
    }

    # LINT
    if ($Rule.ContainsKey("lint")) {
      foreach ($cmd in $Rule["lint"]) {
        Invoke-ExternalCommand $cmd $Resolved
      }
    }

    Write-Log "OK: $Resolved"
  }
  catch {
    Write-Log "ERROR: $($_.Exception.Message)"

    if ($Mode -eq "Strict") {
      throw
    }
  }
}

# --------------------------------------------------
# MAIN
# --------------------------------------------------

try {

  foreach ($inputPath in $Path) {

    $NormalizedPath = Convert-InputPath $inputPath
    $Resolved = Resolve-Path -Path $NormalizedPath -ErrorAction SilentlyContinue

    if (-not $Resolved) {
      Write-Log "Skipping missing path: $inputPath"
      continue
    }

    foreach ($entry in $Resolved) {

      if (Test-Path $entry.Path -PathType Container) {

        Get-ChildItem -Path $entry.Path -Recurse -File | ForEach-Object {
          Invoke-FileLint $_.FullName
        }

      }
      else {

        Invoke-FileLint $entry.Path

      }
    }
  }

}
catch {

  Write-Log "ERROR: $($_.Exception.Message)"

  if ($Mode -eq "Strict") {
    exit 1
  }
}

exit 0
