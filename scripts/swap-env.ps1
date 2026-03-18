param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = "Stop"
if ($null -eq $Arguments) {
    $Arguments = @()
} elseif ($Arguments -is [string]) {
    $Arguments = @($Arguments)
}
$Arguments = @($Arguments | Where-Object { $_ -ne "" })

. (Join-Path $PSScriptRoot "read-scripts-env.ps1")
$scriptsEnvPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path -LiteralPath $scriptsEnvPath -PathType Leaf)) {
    Write-Stderr "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути."
    exit 3
}
$scriptsEnv = Read-ScriptsEnv -Path $scriptsEnvPath
if (-not $scriptsEnv["AUTOTEKA_ROOT"]) {
    Write-Stderr "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути."
    exit 3
}
if (-not $scriptsEnv["INFRA_ROOT"]) {
    Write-Stderr "[swap-env] Отсутствует scripts/.env или переменные AUTOTEKA_ROOT, INFRA_ROOT. Скопируйте scripts/example.env в scripts/.env и задайте пути."
    exit 3
}
$repoRoot = $scriptsEnv["AUTOTEKA_ROOT"]
$script:InfraRoot = $scriptsEnv["INFRA_ROOT"]
$allTypes = @(
    "root-lock",
    "frontend-lock",
    "system-tests-env",
    "system-tests-lock",
    "infrastructure-tests-lock",
    "infrastructure-tests-env",
    "root-node-modules",
    "frontend-node-modules",
    "system-tests-node-modules",
    "infrastructure-tests-node-modules",
    "scripts-env",
    "lint-env",
    "shop-api-env",
    "shop-operator-env"
)

$script:ErrorsFound = New-Object System.Collections.ArrayList
$script:HasMismatch = $false
$script:HasMissing = $false
$script:AggregateHints = $false
$script:SummaryHintActions = New-Object System.Collections.Generic.List[string]
$script:SummaryHintShown = $false
$Arguments = @($Arguments | Where-Object { $_ -ne "" })

function Get-CurrentPlatform {
    if ($env:PWD -and $env:PWD.StartsWith("/")) {
        return "nix"
    }
    if ($env:OS -and $env:OS -match "Windows") {
        return "win"
    }
    throw "Не удалось определить платформу: задайте переменную окружения OS (со значением, содержащим Windows) или PWD (начинается с /)"
}

function Get-ScriptCommandPrefix {
    return "pwsh ./scripts/swap-env.ps1"
}

function Get-TypeInfo {
    param(
        [Parameter(Mandatory = $true)]
        [string]$TypeName,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "nix")]
        [string]$Platform
    )

    $envFileName = if ($Platform -eq "win") { "win.env" } else { "nix.env" }

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
            $base = Join-Path $script:InfraRoot "tests"
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
        "system-tests-env" {
            $base = Join-Path $repoRoot "system-tests"
            return @{
                Kind = "File"
                Label = "system-tests env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
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
            $base = Join-Path $script:InfraRoot "tests"
            return @{
                Kind = "Directory"
                Label = "infrastructure/tests node_modules"
                ActivePath = Join-Path $base "node_modules"
                CurrentEnvPath = Join-Path $base "node_modules.$Platform"
            }
        }
        "infrastructure-tests-env" {
            $base = Join-Path $script:InfraRoot "tests"
            return @{
                Kind = "File"
                Label = "infrastructure/tests env"
                ActivePath = Join-Path $base ".env"
                CurrentEnvPath = Join-Path $base $envFileName
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
        "scripts-env" {
            return @{ Order = 1; Label = "scripts" }
        }
        "lint-env" {
            return @{ Order = 2; Label = "lint" }
        }
        "shop-api-env" {
            return @{ Order = 3; Label = "shop-api" }
        }
        "shop-operator-env" {
            return @{ Order = 4; Label = "shop-operator" }
        }
        { $_ -like "root-*" } {
            return @{ Order = 5; Label = "root" }
        }
        "system-tests-env" {
            return @{ Order = 6; Label = "system-tests" }
        }
        "system-tests-lock" {
            return @{ Order = 6; Label = "system-tests" }
        }
        { $_ -like "system-tests-node-modules" } {
            return @{ Order = 6; Label = "system-tests" }
        }
        { $_ -like "infrastructure-tests-*" } {
            return @{ Order = 7; Label = "infrastructure-tests" }
        }
        { $_ -like "frontend-*" } {
            return @{ Order = 8; Label = "frontend" }
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

$script:StatusMaxLen = 17
$script:LabelMaxLen = 11

function Get-StatusColor {
    param([string]$Status)

    if ($env:NO_COLOR) {
        return ""
    }
    if (-not (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue)) {
        return ""
    }

    $map = @{
        "same"              = $PSStyle.Foreground.FromRgb(0x4C, 0xAF, 0x50)
        "missing-active"    = $PSStyle.Foreground.FromRgb(0xFF, 0xC1, 0x07)
        "unreadable-active" = $PSStyle.Foreground.FromRgb(0xC0, 0x84, 0xFC)
        "missing-current-env"       = $PSStyle.Foreground.FromRgb(0xFF, 0xC1, 0x07)
        "unreadable-current-env"    = $PSStyle.Foreground.FromRgb(0xC0, 0x84, 0xFC)
        "different"         = $PSStyle.Foreground.FromRgb(0xFF, 0xC1, 0x07)
    }
    $fg = $map[$Status]
    if (-not $fg) {
        return ""
    }
    return $fg
}

function Format-StatusLine {
    param(
        [Parameter(Mandatory = $true)]
        [string]$StatusActive,
        [Parameter(Mandatory = $true)]
        [string]$StatusCurrentEnv,
        [Parameter(Mandatory = $true)]
        [string]$TypeName
    )

    $reset = if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { $PSStyle.Reset } else { "" }
    $colorActive = Get-StatusColor -Status $StatusActive
    $colorEnv = Get-StatusColor -Status $StatusCurrentEnv
    $padActive = " " * [Math]::Max(0, $script:StatusMaxLen - $StatusActive.Length)
    $padEnv = " " * [Math]::Max(0, $script:StatusMaxLen - $StatusCurrentEnv.Length)
    $partActive = if ($colorActive) { "$colorActive$StatusActive$reset" } else { $StatusActive }
    $partEnv = if ($colorEnv) { "$colorEnv$StatusCurrentEnv$reset" } else { $StatusCurrentEnv }
    return "  $partActive$padActive $partEnv$padEnv $TypeName"
}

function Get-RelativePath {
    param(
        [string]$Path,
        [string]$BasePath
    )

    $infraNorm = $script:InfraRoot.TrimEnd('\', '/')
    $pathNorm = $Path.TrimEnd('\', '/')
    $sep = [System.IO.Path]::DirectorySeparatorChar
    if ($pathNorm.StartsWith($infraNorm + $sep) -or $pathNorm -eq $infraNorm) {
        $suffix = if ($pathNorm.Length -gt $infraNorm.Length) {
            $pathNorm.Substring($infraNorm.Length + 1)
        } else {
            ""
        }
        $rel = "infrastructure" + $sep + $suffix
        return $rel.Replace('\', '/')
    }

    try {
        return [System.IO.Path]::GetRelativePath($BasePath, $Path).Replace('\', '/')
    }
    catch {
        $norm = $BasePath.TrimEnd('\', '/')
        if ($Path.StartsWith($norm + $sep)) {
            return $Path.Substring($norm.Length + 1).Replace('\', '/')
        }
        return $Path
    }
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

function Sort-StatesByGroupOrder {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject[]]$States
    )

    return @($States | Sort-Object { (Get-TypeGroupInfo -TypeName $_.TypeName).Order }, TypeName)
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
        [ValidateSet("win", "nix")]
        [string]$Platform
    )

    $info = Get-TypeInfo -TypeName $TypeName -Platform $Platform
    $group = Get-TypeGroupInfo -TypeName $TypeName
    $activeResult = if ($info.Kind -eq "File") { Try-ReadFileContent -Path $info.ActivePath } else { Try-ReadDirectoryList -Path $info.ActivePath }
    $envResult = if ($info.Kind -eq "File") { Try-ReadFileContent -Path $info.CurrentEnvPath } else { Try-ReadDirectoryList -Path $info.CurrentEnvPath }

    $statusActive = "same"
    $statusCurrentEnv = "same"
    if (-not $activeResult.Ok) {
        $statusActive = if ($activeResult.Status -eq "missing") { "missing-active" } else { "unreadable-active" }
    }
    if (-not $envResult.Ok) {
        $statusCurrentEnv = if ($envResult.Status -eq "missing") { "missing-current-env" } else { "unreadable-current-env" }
    }
    if ($activeResult.Ok -and $envResult.Ok) {
        $contentDiffers = $false
        if ($info.Kind -eq "File") {
            $contentDiffers = $activeResult.Content -ne $envResult.Content
        } else {
            $activeJoined = [string]::Join("`n", $activeResult.Items)
            $envJoined = [string]::Join("`n", $envResult.Items)
            $contentDiffers = $activeJoined -ne $envJoined
        }
        if ($contentDiffers) {
            $statusActive = "different"
            $statusCurrentEnv = "different"
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
        StatusActive = $statusActive
        StatusCurrentEnv = $statusCurrentEnv
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

    $commands = @(foreach ($actionName in $ActionNames) {
        Get-CommandTemplate -ActionName $actionName -TypeNames $TypeNames
    })

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
        [string]$StatusActive = "same",
        [string]$StatusCurrentEnv = "same",
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

    [void]$script:ErrorsFound.Add([pscustomobject]@{
        TypeName         = $TypeName
        StatusActive     = $StatusActive
        StatusCurrentEnv = $StatusCurrentEnv
        Message          = $Message
        Hint             = $hint
        DryRun           = $DryRun
    })
}

function Get-ValidateHintActions {
    param(
        [string]$StatusActive,
        [string]$StatusCurrentEnv
    )

    $actions = [System.Collections.Generic.List[string]]::new()
    if ($StatusActive -in @("missing-active", "unreadable-active") -and -not $actions.Contains("load")) { $actions.Add("load") | Out-Null }
    if ($StatusCurrentEnv -in @("missing-current-env", "unreadable-current-env") -and -not $actions.Contains("save")) { $actions.Add("save") | Out-Null }
    if ($StatusActive -eq "different" -or $StatusCurrentEnv -eq "different") {
        if (-not $actions.Contains("load")) { $actions.Add("load") | Out-Null }
        if (-not $actions.Contains("save")) { $actions.Add("save") | Out-Null }
    }
    return @($actions)
}

function Validate-Type {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject]$State,
        [switch]$DryRun
    )

    if ($State.StatusActive -eq "same" -and $State.StatusCurrentEnv -eq "same") { return }

    $isMissing = $State.StatusActive -in @("missing-active", "unreadable-active") -or $State.StatusCurrentEnv -in @("missing-current-env", "unreadable-current-env")
    $isMismatch = $State.StatusActive -eq "different" -or $State.StatusCurrentEnv -eq "different"
    $hintActions = Get-ValidateHintActions -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv
    $statusDisplay = "$($State.StatusActive) $($State.StatusCurrentEnv)"
    Add-OperationalError -TypeName $State.TypeName -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv -HintActions $hintActions -Missing:$isMissing -Mismatch:$isMismatch -DryRun:$DryRun
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

    if ((Get-CurrentPlatform) -eq "nix" -and (Test-Path -LiteralPath "/bin/sh")) {
        if (Test-Path -LiteralPath $DestinationPath) {
            & /bin/sh -c 'rm -rf -- "$1"' sh $DestinationPath
            if ($LASTEXITCODE -ne 0) {
                throw "delete-failed"
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

    if ($ActionName -eq "save") {
        if ($State.StatusActive -in @("missing-active", "unreadable-active")) {
            Add-OperationalError -TypeName $typeName -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv -HintActions @("load") -Missing
            return
        }
        if ($State.StatusActive -eq "same" -and $State.StatusCurrentEnv -eq "same") {
            return
        }
        $actionLine = "  active  -> current-env выполнено."
        if ($DryRun) {
            $actionLine = "  active  -> current-env будет выполнено."
        }
        Write-Host (Format-StatusLine -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv -TypeName $typeName)
        if (-not $DryRun) {
            Write-Host "[swap-env] ${typeName}: копирование..."
        }
        if ($DryRun) {
            Write-Host $actionLine
            return
        }
        try {
            if ($State.Kind -eq "File") {
                Copy-FileForce -SourcePath $State.ActivePath -DestinationPath $State.CurrentEnvPath
            }
            else {
                Copy-DirectoryForce -SourcePath $State.ActivePath -DestinationPath $State.CurrentEnvPath
            }
            Write-Host $actionLine
        }
        catch {
            Add-OperationalError -TypeName $typeName -Message "не удалось заменить артефакт current-env." -HintActions @("save") -Mismatch
        }
        return
    }

    if ($State.StatusCurrentEnv -in @("missing-current-env", "unreadable-current-env")) {
        Add-OperationalError -TypeName $typeName -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv -HintActions @("save") -Missing
        return
    }
    if ($State.StatusActive -eq "same" -and $State.StatusCurrentEnv -eq "same") {
        return
    }
    $actionLine = "  active <-  current-env выполнено."
    if ($DryRun) {
        $actionLine = "  active <-  current-env будет выполнено."
    }
    Write-Host (Format-StatusLine -StatusActive $State.StatusActive -StatusCurrentEnv $State.StatusCurrentEnv -TypeName $typeName)
    if (-not $DryRun) {
        Write-Host "[swap-env] ${typeName}: копирование..."
    }
    if ($DryRun) {
        Write-Host $actionLine
        return
    }
    try {
        if ($State.Kind -eq "File") {
            Copy-FileForce -SourcePath $State.CurrentEnvPath -DestinationPath $State.ActivePath
        }
        else {
            Copy-DirectoryForce -SourcePath $State.CurrentEnvPath -DestinationPath $State.ActivePath
        }
        Write-Host $actionLine
    }
    catch {
        Add-OperationalError -TypeName $typeName -Message "не удалось заменить active-артефакт." -HintActions @("load") -Mismatch
    }
}

function Write-StatusReport {
    param(
        [Parameter(Mandatory = $true)]
        [pscustomobject[]]$States,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "nix")]
        [string]$Platform
    )

    $reset = if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { $PSStyle.Reset } else { "" }

    Write-Host "[swap-env] status:   '$Platform'"
    Write-Host "[swap-env] validate: active <-> current-env"
    Write-Host "[swap-env] save:     active  -> current-env"
    Write-Host "[swap-env] load:     active <-  current-env"
    Write-Host "[swap-env] AUTOTEKA_ROOT: $repoRoot"
    Write-Host "[swap-env] INFRA_ROOT:    $script:InfraRoot"

    $groupColor = Get-StatusColor -Status "different"
    foreach ($group in ($States | Group-Object GroupLabel | Sort-Object { ($_.Group | Select-Object -First 1).GroupOrder })) {
        Write-Host ""
        $groupLine = "[swap-env] group: $($group.Name)"
        if ($groupColor) { Write-Host "$groupColor$groupLine$reset" } else { Write-Host $groupLine }
        foreach ($state in ($group.Group | Sort-Object TypeName)) {
            $colorActive = Get-StatusColor -Status $state.StatusActive
            $colorEnv = Get-StatusColor -Status $state.StatusCurrentEnv
            $padActive = " " * [Math]::Max(0, $script:StatusMaxLen - $state.StatusActive.Length)
            $padEnv = " " * [Math]::Max(0, $script:StatusMaxLen - $state.StatusCurrentEnv.Length)
            $partActive = if ($colorActive) { "$colorActive$($state.StatusActive)$reset" } else { $state.StatusActive }
            $partEnv = if ($colorEnv) { "$colorEnv$($state.StatusCurrentEnv)$reset" } else { $state.StatusCurrentEnv }
            $activeRel = Get-RelativePath -Path $state.ActivePath -BasePath $repoRoot
            $envRel = Get-RelativePath -Path $state.CurrentEnvPath -BasePath $repoRoot
            $activeLabel = "active".PadRight($script:LabelMaxLen)
            $envLabel = "current-env".PadRight($script:LabelMaxLen)

            Write-Host ""
            Write-Host "  $partActive$padActive $partEnv$padEnv $($state.TypeName)"
            Write-Host "    ${activeLabel}: $activeRel"
            Write-Host "    ${envLabel}: $envRel"
        }
    }
}

$commandName = "validate"
$requestedTypes = New-Object System.Collections.Generic.List[string]
$dryRun = $false

$argsCount = @($Arguments).Count
if ($argsCount -gt 0) {
    switch ($Arguments[0]) {
        "validate" {
            $commandName = "validate"
            $Arguments = if ($argsCount -gt 1) { @($Arguments)[1..($argsCount - 1)] } else { @() }
        }
        "save" {
            $commandName = "save"
            $Arguments = if ($argsCount -gt 1) { @($Arguments)[1..($argsCount - 1)] } else { @() }
        }
        "load" {
            $commandName = "load"
            $Arguments = if ($argsCount -gt 1) { @($Arguments)[1..($argsCount - 1)] } else { @() }
        }
        "status" {
            $commandName = "status"
            $Arguments = if ($argsCount -gt 1) { @($Arguments)[1..($argsCount - 1)] } else { @() }
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

$argumentsArray = @($Arguments)
for ($index = 0; $index -lt $argumentsArray.Count; $index++) {
    $argument = $argumentsArray[$index]
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
            if ($index + 1 -ge $argumentsArray.Count) {
                Write-Stderr "[swap-env] После --type ожидается значение. $(Get-HelpHint)"
                exit 2
            }

            $requestedTypes.Add($argumentsArray[$index + 1])
            $index++
        }
        "-t" {
            if ($index + 1 -ge $argumentsArray.Count) {
                Write-Stderr "[swap-env] После -t ожидается значение. $(Get-HelpHint)"
                exit 2
            }

            $requestedTypes.Add($argumentsArray[$index + 1])
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
$states = @(foreach ($typeName in $selectedTypes) {
    Get-TypeState -TypeName $typeName -Platform $platform
})
$states = Sort-StatesByGroupOrder -States $states

switch ($commandName) {
    "status" {
        Write-StatusReport -States @($states) -Platform $platform
        exit 0
    }
    "validate" {
        foreach ($state in $states) {
            Validate-Type -State $state -DryRun:$dryRun
        }
    }
    "save" {
        $performedAny = @($states | Where-Object { $_.StatusActive -ne "same" -or $_.StatusCurrentEnv -ne "same" })
        if ($performedAny.Count -eq 0) {
            Write-Host "[swap-env] Совпадение полное, запись active  -> current-env не требуется."
        } else {
            $reset = if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { $PSStyle.Reset } else { "" }
            $groupColor = Get-StatusColor -Status "different"
            $grouped = $states | Group-Object { (Get-TypeGroupInfo -TypeName $_.TypeName).Label }
            foreach ($group in $grouped) {
                $performedInGroup = @($group.Group | Where-Object { $_.StatusActive -ne "same" -or $_.StatusCurrentEnv -ne "same" })
                if ($performedInGroup.Count -eq 0) { continue }
                Write-Host ""
                $groupLine = "[swap-env] group: $($group.Name)"
                if ($groupColor) { Write-Host "$groupColor$groupLine$reset" } else { Write-Host $groupLine }
                foreach ($state in ($group.Group | Sort-Object TypeName)) {
                    Invoke-SaveOrLoadType -ActionName "save" -State $state -DryRun:$dryRun
                }
            }
        }
    }
    "load" {
        $performedAny = @($states | Where-Object { $_.StatusActive -ne "same" -or $_.StatusCurrentEnv -ne "same" })
        if ($performedAny.Count -eq 0) {
            Write-Host "[swap-env] Совпадение полное, запись active <-  current-env не требуется."
        } else {
            $reset = if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { $PSStyle.Reset } else { "" }
            $groupColor = Get-StatusColor -Status "different"
            $grouped = $states | Group-Object { (Get-TypeGroupInfo -TypeName $_.TypeName).Label }
            foreach ($group in $grouped) {
                $performedInGroup = @($group.Group | Where-Object { $_.StatusActive -ne "same" -or $_.StatusCurrentEnv -ne "same" })
                if ($performedInGroup.Count -eq 0) { continue }
                Write-Host ""
                $groupLine = "[swap-env] group: $($group.Name)"
                if ($groupColor) { Write-Host "$groupColor$groupLine$reset" } else { Write-Host $groupLine }
                foreach ($state in ($group.Group | Sort-Object TypeName)) {
                    Invoke-SaveOrLoadType -ActionName "load" -State $state -DryRun:$dryRun
                }
            }
        }
    }
}

if ($commandName -eq "validate") {
    Write-Host "[swap-env] среда: '$platform'"
}

if ($script:ErrorsFound.Count -gt 0) {
    $maxTypeLen = ($script:ErrorsFound | ForEach-Object { $_.TypeName.Length } | Measure-Object -Maximum).Maximum
    $reset = if (Get-Variable -Name PSStyle -Scope Global -ErrorAction SilentlyContinue) { $PSStyle.Reset } else { "" }
    Write-Stderr "[swap-env] Ниже список различий. Для полной информации: $(Get-ScriptCommandPrefix) status"
    foreach ($err in $script:ErrorsFound) {
        $prefix = if ($err.DryRun) { "[swap-env] dry-run: " } else { "[swap-env] " }
        $padded = $err.TypeName.PadRight($maxTypeLen)
        if ($err.Message) {
            [Console]::Error.WriteLine("${prefix}${padded}: $($err.Message)$($err.Hint)")
        }
        else {
            $colorActive = Get-StatusColor -Status $err.StatusActive
            $colorEnv = Get-StatusColor -Status $err.StatusCurrentEnv
            $padActive = " " * [Math]::Max(0, $script:StatusMaxLen - $err.StatusActive.Length)
            $padEnv = " " * [Math]::Max(0, $script:StatusMaxLen - $err.StatusCurrentEnv.Length)
            $partActive = if ($colorActive) { "$colorActive$($err.StatusActive)$reset" } else { $err.StatusActive }
            $partEnv = if ($colorEnv) { "$colorEnv$($err.StatusCurrentEnv)$reset" } else { $err.StatusCurrentEnv }
            [Console]::Error.WriteLine("${prefix}${padded}: $partActive$padActive $partEnv$padEnv$($err.Hint)")
        }
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
            Write-Host "[swap-env] dry-run: различий нет."
        }
        else {
            Write-Host "[swap-env] validate: различий нет."
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
