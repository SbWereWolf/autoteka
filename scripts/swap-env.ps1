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
$script:AggregateHints = $false
$script:SummaryHintActions = New-Object System.Collections.Generic.List[string]
$script:SummaryHintShown = $false
$Arguments = @($Arguments | Where-Object { $_ -ne "" })

function Get-CurrentPlatform {
    if ($env:WSL_DISTRO_NAME -or $env:WSL_INTEROP) {
        return "wsl"
    }

    return "win"
}

function Get-ScriptCommandPrefix {
    return "pwsh ./scripts/swap-env.ps1"
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
                CurrentEnvPath = Join-Path $repoRoot "package-lock.$Platform.json"
            }
        }
        "frontend-lock" {
            $base = Join-Path $repoRoot "frontend"
            return @{
                Kind = "File"
                Label = "frontend package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                CurrentEnvPath = Join-Path $base "package-lock.$Platform.json"
            }
        }
        "system-tests-lock" {
            $base = Join-Path $repoRoot "system-tests"
            return @{
                Kind = "File"
                Label = "system-tests package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                CurrentEnvPath = Join-Path $base "package-lock.$Platform.json"
            }
        }
        "infrastructure-tests-lock" {
            $base = Join-Path $repoRoot "infrastructure/tests"
            return @{
                Kind = "File"
                Label = "infrastructure/tests package-lock"
                ActivePath = Join-Path $base "package-lock.json"
                CurrentEnvPath = Join-Path $base "package-lock.$Platform.json"
            }
        }
        "root-node-modules" {
            return @{
                Kind = "Directory"
                Label = "root node_modules"
                ActivePath = Join-Path $repoRoot "node_modules"
                CurrentEnvPath = Join-Path $repoRoot "node_modules.$Platform"
            }
        }
        "frontend-node-modules" {
            $base = Join-Path $repoRoot "frontend"
            return @{
                Kind = "Directory"
                Label = "frontend node_modules"
                ActivePath = Join-Path $base "node_modules"
                CurrentEnvPath = Join-Path $base "node_modules.$Platform"
            }
        }
        "system-tests-node-modules" {
            $base = Join-Path $repoRoot "system-tests"
            return @{
                Kind = "Directory"
                Label = "system-tests node_modules"
                ActivePath = Join-Path $base "node_modules"
                CurrentEnvPath = Join-Path $base "node_modules.$Platform"
            }
        }
        "infrastructure-tests-node-modules" {
            $base = Join-Path $repoRoot "infrastructure/tests"
            return @{
                Kind = "Directory"
                Label = "infrastructure/tests node_modules"
                ActivePath = Join-Path $base "node_modules"
                CurrentEnvPath = Join-Path $base "node_modules.$Platform"
            }
        }
        "scripts-env" {
            $base = Join-Path $repoRoot "scripts"
            return @{
                Kind = "File"
                Label = "scripts env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
            }
        }
        "lint-env" {
            $base = Join-Path $repoRoot "lint"
            return @{
                Kind = "File"
                Label = "lint env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
            }
        }
        "shop-api-env" {
            $base = Join-Path $repoRoot "backend/apps/ShopAPI"
            return @{
                Kind = "File"
                Label = "ShopAPI env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
            }
        }
        "shop-operator-env" {
            $base = Join-Path $repoRoot "backend/apps/ShopOperator"
            return @{
                Kind = "File"
                Label = "ShopOperator env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
            }
        }
        default {
            throw "Unknown type: $TypeName"
        }
    }
}

function Get-TypeGroupInfo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName
    )

    switch ($TypeName) {
        { $_ -like "root-*" } {
            return @{ Order = 1; Label = "repo root" }
        }
        { $_ -like "frontend-*" } {
            return @{ Order = 2; Label = "frontend" }
        }
        { $_ -like "system-tests-*" } {
            return @{ Order = 3; Label = "system-tests" }
        }
        { $_ -like "infrastructure-tests-*" } {
            return @{ Order = 4; Label = "infrastructure/tests" }
        }
        "scripts-env" {
            return @{ Order = 5; Label = "scripts" }
        }
        "lint-env" {
            return @{ Order = 6; Label = "lint" }
        }
        "shop-api-env" {
            return @{ Order = 7; Label = "backend/apps/ShopAPI" }
        }
        "shop-operator-env" {
            return @{ Order = 8; Label = "backend/apps/ShopOperator" }
        }
        default {
            return @{ Order = 999; Label = "other" }
        }
    }
}

function Write-Usage {
    Write-Host "USAGE"
    Write-Host "  swap-env.ps1 [validate] [--dry-run] [-t <type> ...]"
    Write-Host "  swap-env.ps1 save [--dry-run] [-t <type> ...]"
    Write-Host "  swap-env.ps1 load [--dry-run] [-t <type> ...]"
    Write-Host "  swap-env.ps1 status [-t <type> ...]"
    Write-Host "  swap-env.ps1 --help"
    Write-Host ""
    Write-Host "Описание"
    Write-Host "  Скрипт работает только с артефактами текущей среды запуска."
    Write-Host "  Если типы не указаны, любая команда работает как '-t *'."
    Write-Host ""
    Write-Host "Команды"
    Write-Host "  validate  Проверяет active против current-env."
    Write-Host "  save      Копирует active -> current-env, если замена нужна."
    Write-Host "  load      Копирует current-env -> active, если замена нужна."
    Write-Host "  status    Показывает текущую среду, статусы и пути по группам."
    Write-Host ""
    Write-Host "Флаги"
    Write-Host "  -t, --type <type>  Повторяемый тип для обработки. '*' означает все типы."
    Write-Host "  --dry-run          Для validate/save/load: ничего не меняет, только показывает результат."
    Write-Host "  -h, --help         Показать эту справку."
    Write-Host ""
    Write-Host "Подробные пути и статусы доступны через '$(Get-ScriptCommandPrefix) status'."
}

function Write-Stderr {
    param([string]$Message)

    [Console]::Error.WriteLine($Message)
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

function Resolve-RequestedTypes {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$RequestedTypes
    )

    $resolvedTypes = New-Object System.Collections.Generic.List[string]

    foreach ($typeName in $RequestedTypes) {
        if ($typeName -eq "*") {
            foreach ($knownType in $allTypes) {
                if (-not $resolvedTypes.Contains($knownType)) {
                    $resolvedTypes.Add($knownType)
                }
            }
            continue
        }

        Ensure-KnownType -TypeName $typeName
        if (-not $resolvedTypes.Contains($typeName)) {
            $resolvedTypes.Add($typeName)
        }
    }

    return $resolvedTypes
}

function Try-ReadFileContent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return @{ Ok = $false; Status = "missing" }
    }

    try {
        $content = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
        return @{ Ok = $true; Status = "ok"; Content = $content }
    }
    catch {
        return @{ Ok = $false; Status = "unreadable" }
    }
}

function Try-ReadDirectoryList {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return @{ Ok = $false; Status = "missing" }
    }

    try {
        $basePath = [System.IO.Path]::GetFullPath($Path)
        $prefixLength = $basePath.Length + 1
        $items = [System.IO.Directory]::EnumerateDirectories($basePath, "*", [System.IO.SearchOption]::AllDirectories) |
            ForEach-Object {
                $_.Substring($prefixLength)
            } |
            Sort-Object
        return @{ Ok = $true; Status = "ok"; Items = @($items) }
    }
    catch {
        return @{ Ok = $false; Status = "unreadable" }
    }
}

function Get-TypeState {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform
    )

    $info = Get-TypeInfo -TypeName $TypeName -Platform $Platform
    $group = Get-TypeGroupInfo -TypeName $TypeName
    $activeResult = if ($info.Kind -eq "File") { Try-ReadFileContent -Path $info.ActivePath } else { Try-ReadDirectoryList -Path $info.ActivePath }
    $envResult = if ($info.Kind -eq "File") { Try-ReadFileContent -Path $info.CurrentEnvPath } else { Try-ReadDirectoryList -Path $info.CurrentEnvPath }

    $status = "same"
    if (-not $activeResult.Ok) {
        $status = if ($activeResult.Status -eq "missing") { "missing-active" } else { "unreadable-active" }
    }
    elseif (-not $envResult.Ok) {
        $status = if ($envResult.Status -eq "missing") { "missing-env" } else { "unreadable-env" }
    }
    elseif ($info.Kind -eq "File") {
        if ($activeResult.Content -ne $envResult.Content) {
            $status = "different"
        }
    }
    else {
        $activeJoined = [string]::Join("`n", $activeResult.Items)
        $envJoined = [string]::Join("`n", $envResult.Items)
        if ($activeJoined -ne $envJoined) {
            $status = "different"
        }
    }

    return [pscustomobject]@{
        TypeName = $TypeName
        Kind = $info.Kind
        Label = $info.Label
        GroupOrder = $group.Order
        GroupLabel = $group.Label
        ActivePath = $info.ActivePath
        CurrentEnvPath = $info.CurrentEnvPath
        Status = $status
    }
}

function Add-SummaryHintAction {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("save", "load")]
        [string]$ActionName
    )

    if (-not $script:SummaryHintActions.Contains($ActionName)) {
        $script:SummaryHintActions.Add($ActionName)
    }
}

function Format-TypeArguments {
    param(
        [string[]]$TypeNames
    )

    if (-not $TypeNames -or $TypeNames.Count -eq 0) {
        return ""
    }

    $parts = foreach ($typeName in $TypeNames) {
        "-t $typeName"
    }

    return " " + ([string]::Join(" ", $parts))
}

function Get-CommandTemplate {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("save", "load", "status", "validate")]
        [string]$ActionName,
        [string[]]$TypeNames
    )

    $base = "$(Get-ScriptCommandPrefix) $ActionName"
    return $base + (Format-TypeArguments -TypeNames $TypeNames)
}

function Get-HelpHint {
    return "См. $(Get-ScriptCommandPrefix) -h."
}

function Get-HintText {
    param(
        [string[]]$ActionNames,
        [string[]]$TypeNames
    )

    if (-not $ActionNames -or $ActionNames.Count -eq 0) {
        return ""
    }

    if ($script:AggregateHints) {
        foreach ($actionName in $ActionNames) {
            Add-SummaryHintAction -ActionName $actionName
        }
        return ""
    }

    $commands = foreach ($actionName in $ActionNames) {
        Get-CommandTemplate -ActionName $actionName -TypeNames $TypeNames
    }

    if ($commands.Count -eq 1) {
        return " Команда: $($commands[0])."
    }

    return " Команды: $([string]::Join('; ', $commands))."
}

function Write-SummaryHints {
    if (-not $script:AggregateHints -or $script:SummaryHintShown -or $script:SummaryHintActions.Count -eq 0) {
        return
    }

    foreach ($actionName in $script:SummaryHintActions) {
        Write-Stderr "[swap-env] Для всего набора: $(Get-CommandTemplate -ActionName $actionName)."
    }

    $script:SummaryHintShown = $true
}

function Add-OperationalError {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string[]]$HintActions,
        [switch]$Missing,
        [switch]$Mismatch,
        [switch]$DryRun
    )

    $hint = Get-HintText -ActionNames $HintActions -TypeNames @($TypeName)
    if ($Missing) {
        $script:HasMissing = $true
    }
    if ($Mismatch) {
        $script:HasMismatch = $true
    }

    $prefix = if ($DryRun) { "[swap-env] dry-run: " } else { "[swap-env] " }
    $script:ErrorsFound.Add("${prefix}${TypeName}: ${Message}${hint}")
}

function Get-ValidateHintActions {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Status
    )

    switch ($Status) {
        "missing-active" { return @("load") }
        "unreadable-active" { return @("load") }
        "missing-env" { return @("save") }
        "unreadable-env" { return @("save") }
        "different" { return @("load", "save") }
        default { return @() }
    }
}

function Validate-Type {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$State,
        [switch]$DryRun
    )

    switch ($State.Status) {
        "same" { return }
        "missing-active" {
            Add-OperationalError -TypeName $State.TypeName -Message "active-артефакт отсутствует." -HintActions (Get-ValidateHintActions -Status $State.Status) -Missing -DryRun:$DryRun
            return
        }
        "unreadable-active" {
            Add-OperationalError -TypeName $State.TypeName -Message "active-артефакт не читается." -HintActions (Get-ValidateHintActions -Status $State.Status) -Missing -DryRun:$DryRun
            return
        }
        "missing-env" {
            Add-OperationalError -TypeName $State.TypeName -Message "артефакт текущей среды отсутствует." -HintActions (Get-ValidateHintActions -Status $State.Status) -Missing -DryRun:$DryRun
            return
        }
        "unreadable-env" {
            Add-OperationalError -TypeName $State.TypeName -Message "артефакт текущей среды не читается." -HintActions (Get-ValidateHintActions -Status $State.Status) -Missing -DryRun:$DryRun
            return
        }
        "different" {
            Add-OperationalError -TypeName $State.TypeName -Message "active и current-env различаются." -HintActions (Get-ValidateHintActions -Status $State.Status) -Mismatch -DryRun:$DryRun
            return
        }
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
                        throw "delete-failed"
                    }
                }
                else {
                    throw "delete-failed"
                }
            }
        }

        New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
        $rsyncCmd = Get-Command rsync -ErrorAction SilentlyContinue
        if ($rsyncCmd) {
            & $rsyncCmd.Source -a --delete "$SourcePath/" "$DestinationPath/"
            if ($LASTEXITCODE -ne 0) {
                throw "copy-failed"
            }
            return
        }

        & /bin/sh -c 'cp -a -- "$1"/. "$2"/' sh $SourcePath $DestinationPath
        if ($LASTEXITCODE -ne 0) {
            throw "copy-failed"
        }
        return
    }

    if (Test-Path -LiteralPath $DestinationPath) {
        Remove-Item -LiteralPath $DestinationPath -Recurse -Force
    }

    Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Recurse -Force
}

function Invoke-SaveOrLoadType {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("save", "load")]
        [string]$ActionName,
        [Parameter(Mandatory = $true)]
        [pscustomobject]$State,
        [switch]$DryRun
    )

    $typeName = $State.TypeName
    $sameHint = Get-HintText -ActionNames @($ActionName) -TypeNames @($typeName)

    if ($ActionName -eq "save") {
        switch ($State.Status) {
            "missing-active" {
                Add-OperationalError -TypeName $typeName -Message "active-артефакт отсутствует." -HintActions @("load") -Missing
                return
            }
            "unreadable-active" {
                Add-OperationalError -TypeName $typeName -Message "active-артефакт не читается." -HintActions @("load") -Missing
                return
            }
            "same" {
                Write-Host "[swap-env] ${typeName}: active и current-env уже совпадают, замена не нужна.${sameHint}"
                return
            }
            default {
                if ($DryRun) {
                    Write-Host "[swap-env] dry-run: ${typeName}: будет выполнено active -> current-env."
                    return
                }

                try {
                    if ($State.Kind -eq "File") {
                        Copy-FileForce -SourcePath $State.ActivePath -DestinationPath $State.CurrentEnvPath
                    }
                    else {
                        Copy-DirectoryForce -SourcePath $State.ActivePath -DestinationPath $State.CurrentEnvPath
                    }
                    Write-Host "[swap-env] ${typeName}: active -> current-env выполнено."
                }
                catch {
                    Add-OperationalError -TypeName $typeName -Message "не удалось заменить артефакт current-env." -HintActions @("save") -Mismatch
                }
                return
            }
        }
    }

    switch ($State.Status) {
        "missing-env" {
            Add-OperationalError -TypeName $typeName -Message "артефакт текущей среды отсутствует." -HintActions @("save") -Missing
            return
        }
        "unreadable-env" {
            Add-OperationalError -TypeName $typeName -Message "артефакт текущей среды не читается." -HintActions @("save") -Missing
            return
        }
        "same" {
            Write-Host "[swap-env] ${typeName}: active и current-env уже совпадают, замена не нужна.${sameHint}"
            return
        }
        default {
            if ($DryRun) {
                Write-Host "[swap-env] dry-run: ${typeName}: будет выполнено active <- current-env."
                return
            }

            try {
                if ($State.Kind -eq "File") {
                    Copy-FileForce -SourcePath $State.CurrentEnvPath -DestinationPath $State.ActivePath
                }
                else {
                    Copy-DirectoryForce -SourcePath $State.CurrentEnvPath -DestinationPath $State.ActivePath
                }
                Write-Host "[swap-env] ${typeName}: active <- current-env выполнено."
            }
            catch {
                Add-OperationalError -TypeName $typeName -Message "не удалось заменить active-артефакт." -HintActions @("load") -Mismatch
            }
            return
        }
    }
}

function Write-StatusReport {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject[]]$States,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$Platform
    )

    Write-Host "[swap-env] status: среда '$Platform'"
    Write-Host "[swap-env] validate: active <-> current-env"
    Write-Host "[swap-env] save: active -> current-env"
    Write-Host "[swap-env] load: active <- current-env"

    foreach ($group in ($States | Group-Object GroupLabel | Sort-Object { ($_.Group | Select-Object -First 1).GroupOrder })) {
        Write-Host "[swap-env] group: $($group.Name)"
        foreach ($state in ($group.Group | Sort-Object TypeName)) {
            Write-Host "  $($state.TypeName) [$($state.Status)]"
            Write-Host "    active: $($state.ActivePath)"
            Write-Host "    current-env: $($state.CurrentEnvPath)"
        }
    }
}

$commandName = "validate"
$requestedTypes = New-Object System.Collections.Generic.List[string]
$dryRun = $false

if ($Arguments.Count -gt 0) {
    switch ($Arguments[0]) {
        "validate" {
            $commandName = "validate"
            $Arguments = if ($Arguments.Count -gt 1) { $Arguments[1..($Arguments.Count - 1)] } else { @() }
        }
        "save" {
            $commandName = "save"
            $Arguments = if ($Arguments.Count -gt 1) { $Arguments[1..($Arguments.Count - 1)] } else { @() }
        }
        "load" {
            $commandName = "load"
            $Arguments = if ($Arguments.Count -gt 1) { $Arguments[1..($Arguments.Count - 1)] } else { @() }
        }
        "status" {
            $commandName = "status"
            $Arguments = if ($Arguments.Count -gt 1) { $Arguments[1..($Arguments.Count - 1)] } else { @() }
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
                Write-Stderr "[swap-env] После --type ожидается значение. $(Get-HelpHint)"
                exit 2
            }

            $requestedTypes.Add($Arguments[$index + 1])
            $index++
        }
        "-t" {
            if ($index + 1 -ge $Arguments.Count) {
                Write-Stderr "[swap-env] После -t ожидается значение. $(Get-HelpHint)"
                exit 2
            }

            $requestedTypes.Add($Arguments[$index + 1])
            $index++
        }
        { $_ -like "--type=*" } {
            $requestedTypes.Add($argument.Substring(7))
        }
        { $_ -like "-t=*" } {
            $requestedTypes.Add($argument.Substring(3))
        }
        default {
            Write-Stderr "[swap-env] Неподдерживаемый аргумент: $argument. $(Get-HelpHint)"
            exit 2
        }
    }
}

if ($requestedTypes.Count -eq 0) {
    $requestedTypes.Add("*")
}

try {
    $selectedTypes = @(Resolve-RequestedTypes -RequestedTypes $requestedTypes.ToArray())
}
catch {
    $unknownType = $_.Exception.Message -replace "^Unknown type:\s*", ""
    Write-Stderr "[swap-env] Неподдерживаемый тип: $unknownType. $(Get-HelpHint)"
    exit 2
}

$script:AggregateHints = ($selectedTypes.Count -eq $allTypes.Count)
$platform = Get-CurrentPlatform
$states = foreach ($typeName in $selectedTypes) {
    Get-TypeState -TypeName $typeName -Platform $platform
}

switch ($commandName) {
    "status" {
        Write-StatusReport -States $states -Platform $platform
        exit 0
    }
    "validate" {
        foreach ($state in $states) {
            Validate-Type -State $state -DryRun:$dryRun
        }
    }
    "save" {
        foreach ($state in $states) {
            Invoke-SaveOrLoadType -ActionName "save" -State $state -DryRun:$dryRun
        }
    }
    "load" {
        foreach ($state in $states) {
            Invoke-SaveOrLoadType -ActionName "load" -State $state -DryRun:$dryRun
        }
    }
}

if ($script:ErrorsFound.Count -gt 0) {
    foreach ($message in $script:ErrorsFound) {
        Write-Stderr $message
    }
}

Write-SummaryHints

if ($script:HasMissing) {
    exit 3
}

if ($script:HasMismatch) {
    exit 1
}

switch ($commandName) {
    "validate" {
        if ($dryRun) {
            Write-Host "[swap-env] dry-run: все запрошенные типы синхронизированы для среды '$platform'."
        }
        else {
            Write-Host "[swap-env] validate: все запрошенные типы синхронизированы для среды '$platform'."
        }
    }
    "save" {
        if ($dryRun) {
            Write-Host "[swap-env] dry-run: обработка save завершена для среды '$platform'."
        }
    }
    "load" {
        if ($dryRun) {
            Write-Host "[swap-env] dry-run: обработка load завершена для среды '$platform'."
        }
    }
}

exit 0
