param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$allTypes = @(
    "root-lock",
    "frontend-lock",
    "system-tests-lock",
    "infrastructure-tests-lock",
    "root-node-modules",
    "frontend-node-modules",
    "system-tests-node-modules",
    "infrastructure-tests-node-modules",
    "scripts-env",
    "lint-env",
    "shop-api-env",
    "shop-operator-env"
)

$script:ErrorsFound = New-Object System.Collections.Generic.List[string]
$script:HasMismatch = $false
$script:HasMissing = $false
$Arguments = @($Arguments | Where-Object { $_ -ne "" })

function Get-CurrentPlatform {
    if ($env:WSL_DISTRO_NAME -or $env:WSL_INTEROP) {
        return "wsl"
    }

    return "win"
}

function Get-TypeInfo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform
    )

    $envFileName = if ($Platform -eq "win") { "win.env" } else { "wsl.env" }

    switch ($TypeName) {
        "root-lock" {
            return @{
                Kind = "File"
                Label = "root package-lock"
                ActivePath = Join-Path $repoRoot "package-lock.json"
                StoredPath = Join-Path $repoRoot "package-lock.$Platform.json"
                WinPath = Join-Path $repoRoot "package-lock.win.json"
                WslPath = Join-Path $repoRoot "package-lock.wsl.json"
            }
        }
        "frontend-lock" {
            $base = Join-Path $repoRoot "frontend"
            return @{
                Kind = "File"
                Label = "frontend package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                StoredPath = Join-Path $base "package-lock.$Platform.json"
                WinPath = Join-Path $base "package-lock.win.json"
                WslPath = Join-Path $base "package-lock.wsl.json"
            }
        }
        "system-tests-lock" {
            $base = Join-Path $repoRoot "system-tests"
            return @{
                Kind = "File"
                Label = "system-tests package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                StoredPath = Join-Path $base "package-lock.$Platform.json"
                WinPath = Join-Path $base "package-lock.win.json"
                WslPath = Join-Path $base "package-lock.wsl.json"
            }
        }
        "infrastructure-tests-lock" {
            $base = Join-Path $repoRoot "infrastructure/tests"
            return @{
                Kind = "File"
                Label = "infrastructure/tests package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                StoredPath = Join-Path $base "package-lock.$Platform.json"
                WinPath = Join-Path $base "package-lock.win.json"
                WslPath = Join-Path $base "package-lock.wsl.json"
            }
        }
        "root-node-modules" {
            return @{
                Kind = "Directory"
                Label = "root node_modules"
                ActivePath = Join-Path $repoRoot "node_modules"
                StoredPath = Join-Path $repoRoot "node_modules.$Platform"
                WinPath = Join-Path $repoRoot "node_modules.win"
                WslPath = Join-Path $repoRoot "node_modules.wsl"
            }
        }
        "frontend-node-modules" {
            $base = Join-Path $repoRoot "frontend"
            return @{
                Kind = "Directory"
                Label = "frontend node_modules"
                ActivePath = Join-Path $base "node_modules"
                StoredPath = Join-Path $base "node_modules.$Platform"
                WinPath = Join-Path $base "node_modules.win"
                WslPath = Join-Path $base "node_modules.wsl"
            }
        }
        "system-tests-node-modules" {
            $base = Join-Path $repoRoot "system-tests"
            return @{
                Kind = "Directory"
                Label = "system-tests node_modules"
                ActivePath = Join-Path $base "node_modules"
                StoredPath = Join-Path $base "node_modules.$Platform"
                WinPath = Join-Path $base "node_modules.win"
                WslPath = Join-Path $base "node_modules.wsl"
            }
        }
        "infrastructure-tests-node-modules" {
            $base = Join-Path $repoRoot "infrastructure/tests"
            return @{
                Kind = "Directory"
                Label = "infrastructure/tests node_modules"
                ActivePath = Join-Path $base "node_modules"
                StoredPath = Join-Path $base "node_modules.$Platform"
                WinPath = Join-Path $base "node_modules.win"
                WslPath = Join-Path $base "node_modules.wsl"
            }
        }
        "scripts-env" {
            $base = Join-Path $repoRoot "scripts"
            return @{
                Kind = "File"
                Label = "scripts env"
                ActivePath = Join-Path $base ".env"
                StoredPath = Join-Path $base $envFileName
                WinPath = Join-Path $base "win.env"
                WslPath = Join-Path $base "wsl.env"
            }
        }
        "lint-env" {
            $base = Join-Path $repoRoot "lint"
            return @{
                Kind = "File"
                Label = "lint env"
                ActivePath = Join-Path $base ".env"
                StoredPath = Join-Path $base $envFileName
                WinPath = Join-Path $base "win.env"
                WslPath = Join-Path $base "wsl.env"
            }
        }
        "shop-api-env" {
            $base = Join-Path $repoRoot "backend/apps/ShopAPI"
            return @{
                Kind = "File"
                Label = "ShopAPI env"
                ActivePath = Join-Path $base ".env"
                StoredPath = Join-Path $base $envFileName
                WinPath = Join-Path $base "win.env"
                WslPath = Join-Path $base "wsl.env"
            }
        }
        "shop-operator-env" {
            $base = Join-Path $repoRoot "backend/apps/ShopOperator"
            return @{
                Kind = "File"
                Label = "ShopOperator env"
                ActivePath = Join-Path $base ".env"
                StoredPath = Join-Path $base $envFileName
                WinPath = Join-Path $base "win.env"
                WslPath = Join-Path $base "wsl.env"
            }
        }
        default {
            throw "Unknown type: $TypeName"
        }
    }
}

function Write-Usage {
    $platform = Get-CurrentPlatform

    Write-Host "USAGE"
    Write-Host "  swap-env.ps1 [validate] [--dry-run] [--type <type> ...]"
    Write-Host "  swap-env.ps1 save --type <type> [--type <type> ...]"
    Write-Host "  swap-env.ps1 load --type <type> [--type <type> ...]"
    Write-Host "  swap-env.ps1 --help"
    Write-Host ""
    Write-Host "Описание"
    Write-Host "  Скрипт определяет текущее окружение запуска ($platform) и работает"
    Write-Host "  только с артефактами этого окружения. Автоматического переключения"
    Write-Host "  между win и wsl нет."
    Write-Host ""
    Write-Host "Команды"
    Write-Host "  validate  Проверяет active-артефакты против текущего окружения."
    Write-Host "  save      Перезаписывает env-specific артефакт текущего окружения"
    Write-Host "            из active-артефакта."
    Write-Host "  load      Перезаписывает active-артефакт из env-specific артефакта"
    Write-Host "            текущего окружения."
    Write-Host ""
    Write-Host "Флаги"
    Write-Host "  --type <type>  Повторяемый тип для обработки."
    Write-Host "  --dry-run      Разрешён только для validate."
    Write-Host "  --help         Показать эту справку."
    Write-Host ""
    Write-Host "Типы и пути"

    foreach ($typeName in $allTypes) {
        $info = Get-TypeInfo -TypeName $typeName -Platform $platform
        Write-Host "  $typeName"
        Write-Host "    active: $($info.ActivePath)"
        Write-Host "    win:    $($info.WinPath)"
        Write-Host "    wsl:    $($info.WslPath)"
    }
}

function Add-ErrorMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [switch]$DryRun
    )

    if ($DryRun) {
        $script:ErrorsFound.Add("[swap-env] dry-run: $Message")
        return
    }

    $script:ErrorsFound.Add("[swap-env] $Message")
}

function Add-MissingError {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [switch]$DryRun
    )

    $script:HasMissing = $true
    Add-ErrorMessage -Message $Message -DryRun:$DryRun
}

function Add-MismatchError {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [switch]$DryRun
    )

    $script:HasMismatch = $true
    Add-ErrorMessage -Message $Message -DryRun:$DryRun
}

function Write-Stderr {
    param([string]$Message)

    [Console]::Error.WriteLine($Message)
}

function Get-MaxParallelJobs {
    $cpuCount = [Environment]::ProcessorCount
    $maxJobs = [Math]::Floor($cpuCount * 0.8)
    if ($maxJobs -lt 1) {
        return 1
    }

    return [int]$maxJobs
}

function Ensure-KnownType {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName
    )

    if ($allTypes -notcontains $TypeName) {
        throw "Unknown type: $TypeName"
    }
}

function Ensure-FileReadable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [switch]$DryRun
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Add-MissingError -Message "${Label}: ожидался файл '$Path', но он не найден или не читается." -DryRun:$DryRun
        return $false
    }

    try {
        Get-Content -LiteralPath $Path -Raw -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        Add-MissingError -Message "${Label}: ожидался читаемый файл '$Path', но его не удалось прочитать." -DryRun:$DryRun
        return $false
    }
}

function Ensure-DirectoryReadable {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [switch]$DryRun
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        Add-MissingError -Message "${Label}: ожидалась директория '$Path', но она не найдена или не читается." -DryRun:$DryRun
        return $false
    }

    try {
        [System.IO.Directory]::EnumerateDirectories($Path, "*", [System.IO.SearchOption]::AllDirectories) |
            Select-Object -First 1 | Out-Null
        return $true
    }
    catch {
        Add-MissingError -Message "${Label}: ожидалась читаемая директория '$Path', но её не удалось прочитать." -DryRun:$DryRun
        return $false
    }
}

function Get-NormalizedDirectoryList {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $basePath = [System.IO.Path]::GetFullPath($Path)
    $prefixLength = $basePath.Length + 1

    return [System.IO.Directory]::EnumerateDirectories($basePath, "*", [System.IO.SearchOption]::AllDirectories) |
        ForEach-Object {
            $_.Substring($prefixLength)
        } |
        Sort-Object
}

function Validate-Type {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform,
        [switch]$DryRun
    )

    $info = Get-TypeInfo -TypeName $TypeName -Platform $Platform

    if ($info.Kind -eq "File") {
        if (-not (Ensure-FileReadable -Path $info.ActivePath -Label "$($info.Label) active" -DryRun:$DryRun)) {
            return
        }
        if (-not (Ensure-FileReadable -Path $info.StoredPath -Label "$TypeName ($Platform)" -DryRun:$DryRun)) {
            return
        }

        $activeContent = Get-Content -LiteralPath $info.ActivePath -Raw -ErrorAction Stop
        $storedContent = Get-Content -LiteralPath $info.StoredPath -Raw -ErrorAction Stop
        if ($activeContent -ne $storedContent) {
            Add-MismatchError -Message "${TypeName}: active '$($info.ActivePath)' не совпадает с '$($info.StoredPath)'. Синхронизируйте файлы вручную." -DryRun:$DryRun
            return
        }

        return
    }

    if (-not (Ensure-DirectoryReadable -Path $info.ActivePath -Label "$($info.Label) active" -DryRun:$DryRun)) {
        return
    }
    if (-not (Ensure-DirectoryReadable -Path $info.StoredPath -Label "$TypeName ($Platform)" -DryRun:$DryRun)) {
        return
    }

    try {
        $activeListing = @(Get-NormalizedDirectoryList -Path $info.ActivePath)
    }
    catch {
        Add-MissingError -Message "${TypeName}: не удалось прочитать структуру директорий '$($info.ActivePath)'." -DryRun:$DryRun
        return
    }

    try {
        $storedListing = @(Get-NormalizedDirectoryList -Path $info.StoredPath)
    }
    catch {
        Add-MissingError -Message "${TypeName}: не удалось прочитать структуру директорий '$($info.StoredPath)'." -DryRun:$DryRun
        return
    }

    $activeJoined = [string]::Join("`n", $activeListing)
    $storedJoined = [string]::Join("`n", $storedListing)
    if ($activeJoined -ne $storedJoined) {
        Add-MismatchError -Message "${TypeName}: структура директорий '$($info.ActivePath)' не совпадает с '$($info.StoredPath)'. Синхронизируйте директории вручную." -DryRun:$DryRun
        return
    }

}

function Copy-FileForce {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    $parent = Split-Path -Parent $DestinationPath
    if ($parent) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
}

function Copy-DirectoryForce {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    $parent = Split-Path -Parent $DestinationPath
    if ($parent) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    if ((Get-CurrentPlatform) -eq "wsl" -and (Test-Path -LiteralPath "/bin/sh")) {
        if (Test-Path -LiteralPath $DestinationPath) {
            & /bin/sh -c 'rm -rf -- "$1"' sh $DestinationPath
            if ($LASTEXITCODE -ne 0) {
                $cmdExe = Get-Command cmd.exe -ErrorAction SilentlyContinue
                $wslPathCmd = Get-Command wslpath -ErrorAction SilentlyContinue
                if ($cmdExe -and $wslPathCmd -and $DestinationPath -match '^/mnt/[a-zA-Z]/') {
                    $windowsPath = & $wslPathCmd.Source -w $DestinationPath
                    & $cmdExe.Source /d /c "rd /s /q `"$windowsPath`""
                    if ($LASTEXITCODE -ne 0) {
                        throw "Не удалось удалить директорию '$DestinationPath' через rm -rf и cmd.exe."
                    }
                }
                else {
                    throw "Не удалось удалить директорию '$DestinationPath' через rm -rf."
                }
            }
        }
        New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
        $rsyncCmd = Get-Command rsync -ErrorAction SilentlyContinue
        if ($rsyncCmd) {
            & $rsyncCmd.Source -a --delete "$SourcePath/" "$DestinationPath/"
            if ($LASTEXITCODE -ne 0) {
                throw "Не удалось скопировать директорию '$SourcePath' в '$DestinationPath' через rsync."
            }
            return
        }

        & /bin/sh -c 'cp -a -- "$1"/. "$2"/' sh $SourcePath $DestinationPath
        if ($LASTEXITCODE -ne 0) {
            throw "Не удалось скопировать директорию '$SourcePath' в '$DestinationPath' через cp -a."
        }
        return
    }

    if (Test-Path -LiteralPath $DestinationPath) {
        Remove-Item -LiteralPath $DestinationPath -Recurse -Force
    }

    Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Recurse -Force
}

function Save-Type {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform
    )

    $info = Get-TypeInfo -TypeName $TypeName -Platform $Platform
    if ($info.Kind -eq "File") {
        if (-not (Ensure-FileReadable -Path $info.ActivePath -Label "$($info.Label) active")) {
            return
        }

        Copy-FileForce -SourcePath $info.ActivePath -DestinationPath $info.StoredPath
        Write-Host "[swap-env] ${TypeName}: сохранено '$($info.ActivePath)' -> '$($info.StoredPath)'"
        return
    }

    if (-not (Ensure-DirectoryReadable -Path $info.ActivePath -Label "$($info.Label) active")) {
        return
    }

    Copy-DirectoryForce -SourcePath $info.ActivePath -DestinationPath $info.StoredPath
    Write-Host "[swap-env] ${TypeName}: сохранено '$($info.ActivePath)' -> '$($info.StoredPath)'"
}

function Load-Type {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform
    )

    $info = Get-TypeInfo -TypeName $TypeName -Platform $Platform
    if ($info.Kind -eq "File") {
        if (-not (Ensure-FileReadable -Path $info.StoredPath -Label "$TypeName ($Platform)")) {
            return
        }

        Copy-FileForce -SourcePath $info.StoredPath -DestinationPath $info.ActivePath
        Write-Host "[swap-env] ${TypeName}: загружено '$($info.StoredPath)' -> '$($info.ActivePath)'"
        return
    }

    if (-not (Ensure-DirectoryReadable -Path $info.StoredPath -Label "$TypeName ($Platform)")) {
        return
    }

    Copy-DirectoryForce -SourcePath $info.StoredPath -DestinationPath $info.ActivePath
    Write-Host "[swap-env] ${TypeName}: загружено '$($info.StoredPath)' -> '$($info.ActivePath)'"
}

function Invoke-ParallelValidate {
    param(
        [string[]]$TypeNames,
        [ValidateSet("win", "wsl")]
        [string]$Platform,
        [switch]$DryRun
    )

    $directoryTypes = @($TypeNames | Where-Object { (Get-TypeInfo -TypeName $_ -Platform $Platform).Kind -eq "Directory" })
    $fileTypes = @($TypeNames | Where-Object { (Get-TypeInfo -TypeName $_ -Platform $Platform).Kind -eq "File" })
    $orderedTypes = @($directoryTypes + $fileTypes)
    $maxJobs = Get-MaxParallelJobs
    $pwshPath = (Get-Process -Id $PID).Path
    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("swap-env-" + [Guid]::NewGuid().ToString("N"))
    $running = New-Object System.Collections.Generic.List[object]
    $hasMissing = $false
    $hasMismatch = $false
    $hasInternalError = $false

    [System.IO.Directory]::CreateDirectory($tempDir) | Out-Null

    $collectResult = {
        param($JobInfo)

        $JobInfo.Process.WaitForExit()
        $JobInfo.Process.Refresh()
        $status = $JobInfo.Process.ExitCode

        if (Test-Path -LiteralPath $JobInfo.StdOut) {
            $stdout = Get-Content -LiteralPath $JobInfo.StdOut -Raw
            if (-not [string]::IsNullOrWhiteSpace($stdout)) {
                Write-Host $stdout.TrimEnd()
            }
        }

        if (Test-Path -LiteralPath $JobInfo.StdErr) {
            $stderr = Get-Content -LiteralPath $JobInfo.StdErr -Raw
            if (-not [string]::IsNullOrWhiteSpace($stderr)) {
                Write-Stderr $stderr.TrimEnd()
            }
        }

        switch ($status) {
            0 { return }
            1 { $script:parallelHasMismatch = $true; return }
            3 { $script:parallelHasMissing = $true; return }
            default { $script:parallelHasInternalError = $true; return }
        }
    }

    $script:parallelHasMissing = $false
    $script:parallelHasMismatch = $false
    $script:parallelHasInternalError = $false

    for ($index = 0; $index -lt $orderedTypes.Count; $index++) {
        $typeName = $orderedTypes[$index]
        $stdoutPath = Join-Path $tempDir "$index.stdout"
        $stderrPath = Join-Path $tempDir "$index.stderr"
        $arguments = @("-NoProfile", "-File", $PSCommandPath, "__validate-type", $typeName)
        if ($DryRun) {
            $arguments += "--dry-run"
        }

        $process = Start-Process `
            -FilePath $pwshPath `
            -ArgumentList $arguments `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath

        $running.Add([pscustomobject]@{
            Process = $process
            StdOut = $stdoutPath
            StdErr = $stderrPath
        }) | Out-Null

        if ($running.Count -ge $maxJobs) {
            & $collectResult $running[0]
            $running.RemoveAt(0)
        }
    }

    while ($running.Count -gt 0) {
        & $collectResult $running[0]
        $running.RemoveAt(0)
    }

    Remove-Item -LiteralPath $tempDir -Recurse -Force

    $hasMissing = $script:parallelHasMissing
    $hasMismatch = $script:parallelHasMismatch
    $hasInternalError = $script:parallelHasInternalError

    if ($hasInternalError) {
        exit 2
    }
    if ($hasMissing) {
        exit 3
    }
    if ($hasMismatch) {
        exit 1
    }

    if ($DryRun) {
        Write-Host "[swap-env] dry-run: все запрошенные типы синхронизированы для среды '$Platform'."
    }
    else {
        Write-Host "[swap-env] validate: все запрошенные типы синхронизированы для среды '$Platform'."
    }

    exit 0
}

$commandName = "validate"
$selectedTypes = New-Object System.Collections.Generic.List[string]
$dryRun = $false

if ($Arguments.Count -gt 0) {
    switch ($Arguments[0]) {
        "__validate-type" {
            $commandName = "__validate-type"
            if ($Arguments.Count -gt 1) {
                $Arguments = $Arguments[1..($Arguments.Count - 1)]
            }
            else {
                $Arguments = @()
            }
        }
        "validate" {
            $commandName = "validate"
            if ($Arguments.Count -gt 1) {
                $Arguments = $Arguments[1..($Arguments.Count - 1)]
            }
            else {
                $Arguments = @()
            }
        }
        "save" {
            $commandName = "save"
            if ($Arguments.Count -gt 1) {
                $Arguments = $Arguments[1..($Arguments.Count - 1)]
            }
            else {
                $Arguments = @()
            }
        }
        "load" {
            $commandName = "load"
            if ($Arguments.Count -gt 1) {
                $Arguments = $Arguments[1..($Arguments.Count - 1)]
            }
            else {
                $Arguments = @()
            }
        }
        "--help" {
            Write-Usage
            exit 0
        }
        "-h" {
            Write-Usage
            exit 0
        }
    }
}

if ($commandName -eq "__validate-type") {
    if ($Arguments.Count -lt 1 -or $Arguments.Count -gt 2) {
        Write-Stderr "[swap-env] Внутренняя команда __validate-type ожидает type и опциональный --dry-run."
        exit 2
    }

    $internalType = $Arguments[0]
    try {
        Ensure-KnownType -TypeName $internalType
    }
    catch {
        Write-Stderr "[swap-env] Неподдерживаемый тип: $internalType"
        exit 2
    }

    if ($Arguments.Count -eq 2) {
        if ($Arguments[1] -notin @("--dry-run", "-DryRun")) {
            Write-Stderr "[swap-env] Внутренняя команда __validate-type поддерживает только --dry-run."
            exit 2
        }
        $dryRun = $true
    }

    $platform = Get-CurrentPlatform
    Validate-Type -TypeName $internalType -Platform $platform -DryRun:$dryRun

    if ($script:ErrorsFound.Count -gt 0) {
        foreach ($message in $script:ErrorsFound) {
            Write-Stderr $message
        }
    }

    if ($script:HasMissing) {
        exit 3
    }
    if ($script:HasMismatch) {
        exit 1
    }

    exit 0
}

for ($index = 0; $index -lt $Arguments.Count; $index++) {
    $argument = $Arguments[$index]
    if ([string]::IsNullOrWhiteSpace($argument)) {
        continue
    }
    switch ($argument) {
        "--help" {
            Write-Usage
            exit 0
        }
        "-h" {
            Write-Usage
            exit 0
        }
        "--dry-run" {
            $dryRun = $true
        }
        "-DryRun" {
            $dryRun = $true
        }
        "--type" {
            if ($index + 1 -ge $Arguments.Count) {
                Write-Stderr "[swap-env] После --type ожидается значение."
                exit 2
            }

            $typeName = $Arguments[$index + 1]
            try {
                Ensure-KnownType -TypeName $typeName
            }
            catch {
                Write-Stderr "[swap-env] Неподдерживаемый тип: $typeName"
                exit 2
            }
            $selectedTypes.Add($typeName)
            $index++
        }
        { $_ -like "--type=*" } {
            $typeName = $argument.Substring(7)
            try {
                Ensure-KnownType -TypeName $typeName
            }
            catch {
                Write-Stderr "[swap-env] Неподдерживаемый тип: $typeName"
                exit 2
            }
            $selectedTypes.Add($typeName)
        }
        "-Help" {
            Write-Usage
            exit 0
        }
        default {
            Write-Stderr "[swap-env] Неподдерживаемый аргумент: $argument"
            exit 2
        }
    }
}

if ($commandName -ne "validate" -and $dryRun) {
    Write-Stderr "[swap-env] --dry-run поддерживается только для validate."
    exit 2
}

if ($selectedTypes.Count -eq 0) {
    if ($commandName -eq "validate") {
        foreach ($typeName in $allTypes) {
            $selectedTypes.Add($typeName)
        }
    }
    else {
        Write-Stderr "[swap-env] Для команды $commandName нужен хотя бы один --type."
        exit 2
    }
}

$platform = Get-CurrentPlatform

if ($commandName -eq "validate") {
    Invoke-ParallelValidate -TypeNames $selectedTypes -Platform $platform -DryRun:$dryRun
}

foreach ($typeName in $selectedTypes) {
    switch ($commandName) {
        "save" {
            Save-Type -TypeName $typeName -Platform $platform
        }
        "load" {
            Load-Type -TypeName $typeName -Platform $platform
        }
    }
}

if ($script:ErrorsFound.Count -gt 0) {
    foreach ($message in $script:ErrorsFound) {
        Write-Stderr $message
    }
}

if ($script:HasMissing) {
    exit 3
}

if ($script:HasMismatch) {
    exit 1
}

if ($commandName -eq "validate") {
    if ($dryRun) {
        Write-Host "[swap-env] dry-run: все запрошенные типы синхронизированы для среды '$platform'."
    }
    else {
        Write-Host "[swap-env] validate: все запрошенные типы синхронизированы для среды '$platform'."
    }
}

exit 0
