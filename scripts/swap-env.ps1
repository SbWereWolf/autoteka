param(
    [switch]$Status,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stateFile = Join-Path $repoRoot ".node-env.active"
$packageRoots = @(
    ".",
    "frontend",
    "system-tests",
    "infrastructure/tests"
)
$envRoots = @(
    "scripts",
    "lint",
    "backend/apps/ShopAPI",
    "backend/apps/ShopOperator"
)

function Get-TargetPlatform {
    if ($env:WSL_DISTRO_NAME -or $env:WSL_INTEROP) {
        return "wsl"
    }

    return "win"
}

function Get-StatePlatform {
    if (-not (Test-Path $stateFile)) {
        return $null
    }

    $value = (Get-Content $stateFile -Raw).Trim()
    if ($value -in @("win", "wsl")) {
        return $value
    }

    return $null
}

function Set-StatePlatform {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Platform
    )

    if ($DryRun) {
        Write-Host "[swap-env] dry-run write state '$Platform' -> '$stateFile'"
        return
    }

    Set-Content -Path $stateFile -Value $Platform -NoNewline
}

function Test-PathExistsAny {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return $null -ne (Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue)
}

function Get-PathItem {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    return Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue
}

function Get-LinkPlatform {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $item = Get-PathItem -Path $Path
    if ($null -eq $item -or [string]::IsNullOrWhiteSpace($item.LinkType)) {
        return $null
    }

    $target = @($item.Target | Select-Object -First 1)[0]
    if ([string]::IsNullOrWhiteSpace($target)) {
        return "other"
    }

    $targetName = [System.IO.Path]::GetFileName([string]$target)
    switch -Regex ($targetName) {
        '\.win(?:\.json)?$' { return "win" }
        '\.wsl(?:\.json)?$' { return "wsl" }
        default { return "other" }
    }
}

function Get-ActiveDescription {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $item = Get-PathItem -Path $Path
    if ($null -eq $item) {
        return "missing"
    }

    if (-not [string]::IsNullOrWhiteSpace($item.LinkType)) {
        $platform = Get-LinkPlatform -Path $Path
        if (Test-Path $Path) {
            return "symlink-$platform"
        }

        return "broken-symlink-$platform"
    }

    if ($item.PSIsContainer) {
        return "directory"
    }

    if ($item -is [System.IO.FileInfo]) {
        return "file"
    }

    return "other"
}

function Get-InferredPlatform {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ActiveDescription,
        [Parameter(Mandatory = $true)]
        [bool]$HasWinVariant,
        [Parameter(Mandatory = $true)]
        [bool]$HasWslVariant,
        [string]$StatePlatform
    )

    switch ($ActiveDescription) {
        "symlink-win" { return "win" }
        "broken-symlink-win" { return "win" }
        "symlink-wsl" { return "wsl" }
        "broken-symlink-wsl" { return "wsl" }
    }

    if ($ActiveDescription -ne "missing") {
        if ($HasWslVariant -and -not $HasWinVariant) {
            return "win"
        }

        if ($HasWinVariant -and -not $HasWslVariant) {
            return "wsl"
        }

        if ($StatePlatform) {
            return $StatePlatform
        }

        return "unknown-active"
    }

    if ($HasWinVariant -or $HasWslVariant) {
        return "stored-only"
    }

    return "empty"
}

function Invoke-Move {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    if ($DryRun) {
        Write-Host "[swap-env] dry-run move '$SourcePath' -> '$DestinationPath'"
        return
    }

    Move-Item -LiteralPath $SourcePath -Destination $DestinationPath
}

function Remove-LinkPath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ($DryRun) {
        Write-Host "[swap-env] dry-run remove link '$Path'"
        return
    }

    Remove-Item -LiteralPath $Path -Force
}

function Get-StatusLabel {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$TargetPlatform
    )

    if (Test-Path $Path -PathType Container) {
        return "directory:$TargetPlatform"
    }

    if (Test-Path $Path -PathType Leaf) {
        return "file:$TargetPlatform"
    }

    $item = Get-PathItem -Path $Path
    if ($null -ne $item -and -not [string]::IsNullOrWhiteSpace($item.LinkType)) {
        return "symlink:$TargetPlatform"
    }

    return "missing"
}

function Switch-Entry {
    param(
        [Parameter(Mandatory = $true)]
        [string]$EntryLabel,
        [Parameter(Mandatory = $true)]
        [string]$ActivePath,
        [Parameter(Mandatory = $true)]
        [string]$WinVariantPath,
        [Parameter(Mandatory = $true)]
        [string]$WslVariantPath,
        [string]$StatePlatform,
        [Parameter(Mandatory = $true)]
        [ValidateSet("win", "wsl")]
        [string]$TargetPlatform
    )

    $activeDescription = Get-ActiveDescription -Path $ActivePath
    $hasWinVariant = Test-PathExistsAny -Path $WinVariantPath
    $hasWslVariant = Test-PathExistsAny -Path $WslVariantPath
    $inferredPlatform = Get-InferredPlatform `
        -ActiveDescription $activeDescription `
        -HasWinVariant $hasWinVariant `
        -HasWslVariant $hasWslVariant `
        -StatePlatform $StatePlatform

    $currentVariantPath = switch ($inferredPlatform) {
        "win" { $WinVariantPath }
        "wsl" { $WslVariantPath }
        default { $null }
    }
    $targetVariantPath = if ($TargetPlatform -eq "win") { $WinVariantPath } else { $WslVariantPath }

    if ($activeDescription -like "symlink-*" -or $activeDescription -like "broken-symlink-*") {
        Remove-LinkPath -Path $ActivePath
        $activeDescription = "missing"
    }

    if ($activeDescription -in @("directory", "file", "other")) {
        if ($inferredPlatform -eq "unknown-active") {
            throw "Cannot migrate active $EntryLabel '$ActivePath': current platform is unknown. Set .node-env.active to 'win' or 'wsl' and retry."
        }

        if ($inferredPlatform -eq $TargetPlatform) {
            if (Test-PathExistsAny -Path $targetVariantPath) {
                throw "Cannot keep active $EntryLabel '$ActivePath': target variant '$targetVariantPath' already exists."
            }

            return Get-StatusLabel -Path $ActivePath -TargetPlatform $TargetPlatform
        }

        if ([string]::IsNullOrWhiteSpace($currentVariantPath)) {
            throw "Cannot switch active $EntryLabel '$ActivePath': current platform is not resolved."
        }

        if (Test-PathExistsAny -Path $currentVariantPath) {
            throw "Cannot switch active $EntryLabel '$ActivePath': current variant '$currentVariantPath' already exists."
        }

        Invoke-Move -SourcePath $ActivePath -DestinationPath $currentVariantPath
    }

    if (Test-PathExistsAny -Path $targetVariantPath) {
        Invoke-Move -SourcePath $targetVariantPath -DestinationPath $ActivePath
    }

    return Get-StatusLabel -Path $ActivePath -TargetPlatform $TargetPlatform
}

$targetPlatform = Get-TargetPlatform
$statePlatform = Get-StatePlatform

foreach ($relativeRoot in $packageRoots) {
    $packageRoot = if ($relativeRoot -eq ".") { $repoRoot } else { Join-Path $repoRoot $relativeRoot }

    if (-not (Test-Path (Join-Path $packageRoot "package.json"))) {
        continue
    }

    $activeNodeModules = Join-Path $packageRoot "node_modules"
    $activeLock = Join-Path $packageRoot "package-lock.json"
    $winNodeModules = Join-Path $packageRoot "node_modules.win"
    $wslNodeModules = Join-Path $packageRoot "node_modules.wsl"
    $winLock = Join-Path $packageRoot "package-lock.win.json"
    $wslLock = Join-Path $packageRoot "package-lock.wsl.json"

    $nodeModulesDescription = Get-ActiveDescription -Path $activeNodeModules
    $lockDescription = Get-ActiveDescription -Path $activeLock
    $hasWinNodeModules = Test-PathExistsAny -Path $winNodeModules
    $hasWslNodeModules = Test-PathExistsAny -Path $wslNodeModules
    $hasWinLock = Test-PathExistsAny -Path $winLock
    $hasWslLock = Test-PathExistsAny -Path $wslLock
    $nodeModulesPlatform = Get-InferredPlatform `
        -ActiveDescription $nodeModulesDescription `
        -HasWinVariant $hasWinNodeModules `
        -HasWslVariant $hasWslNodeModules `
        -StatePlatform $statePlatform
    $lockPlatform = Get-InferredPlatform `
        -ActiveDescription $lockDescription `
        -HasWinVariant $hasWinLock `
        -HasWslVariant $hasWslLock `
        -StatePlatform $statePlatform

    if ($Status) {
        $summary = @(
            "target=$targetPlatform"
            "state=" + $(if ($statePlatform) { $statePlatform } else { "missing" })
            "node_modules=$nodeModulesDescription"
            "node_modules.current=$nodeModulesPlatform"
            "node_modules.win=" + $(if ($hasWinNodeModules) { "present" } else { "missing" })
            "node_modules.wsl=" + $(if ($hasWslNodeModules) { "present" } else { "missing" })
            "package-lock=$lockDescription"
            "package-lock.current=$lockPlatform"
            "package-lock.win=" + $(if ($hasWinLock) { "present" } else { "missing" })
            "package-lock.wsl=" + $(if ($hasWslLock) { "present" } else { "missing" })
        )
        Write-Host "[swap-env] $relativeRoot -> $($summary -join ', ')"
        continue
    }

    $nodeModulesStatus = Switch-Entry `
        -EntryLabel "node_modules" `
        -ActivePath $activeNodeModules `
        -WinVariantPath $winNodeModules `
        -WslVariantPath $wslNodeModules `
        -StatePlatform $statePlatform `
        -TargetPlatform $targetPlatform
    $lockStatus = Switch-Entry `
        -EntryLabel "package-lock" `
        -ActivePath $activeLock `
        -WinVariantPath $winLock `
        -WslVariantPath $wslLock `
        -StatePlatform $statePlatform `
        -TargetPlatform $targetPlatform
    Write-Host "[swap-env] $relativeRoot -> node_modules=$nodeModulesStatus, package-lock=$lockStatus"
}

foreach ($relativeRoot in $envRoots) {
    $envRoot = Join-Path $repoRoot $relativeRoot
    $activeEnv = Join-Path $envRoot ".env"
    $winEnv = Join-Path $envRoot "win.env"
    $wslEnv = Join-Path $envRoot "wsl.env"

    $envDescription = Get-ActiveDescription -Path $activeEnv
    $hasWinEnv = Test-PathExistsAny -Path $winEnv
    $hasWslEnv = Test-PathExistsAny -Path $wslEnv
    $envPlatform = Get-InferredPlatform `
        -ActiveDescription $envDescription `
        -HasWinVariant $hasWinEnv `
        -HasWslVariant $hasWslEnv `
        -StatePlatform $statePlatform

    if ($Status) {
        $summary = @(
            "target=$targetPlatform"
            "state=" + $(if ($statePlatform) { $statePlatform } else { "missing" })
            ".env=$envDescription"
            ".env.current=$envPlatform"
            "win.env=" + $(if ($hasWinEnv) { "present" } else { "missing" })
            "wsl.env=" + $(if ($hasWslEnv) { "present" } else { "missing" })
        )
        Write-Host "[swap-env] $relativeRoot -> $($summary -join ', ')"
        continue
    }

    $envStatus = Switch-Entry `
        -EntryLabel ".env" `
        -ActivePath $activeEnv `
        -WinVariantPath $winEnv `
        -WslVariantPath $wslEnv `
        -StatePlatform $statePlatform `
        -TargetPlatform $targetPlatform
    Write-Host "[swap-env] $relativeRoot -> .env=$envStatus"
}

if (-not $Status) {
    Set-StatePlatform -Platform $targetPlatform
}
