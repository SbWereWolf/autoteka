param(
    [switch]$Staged,
    [ValidateSet("check","apply")]
    [string]$LintMode = "check",
    [string]$TestProfile = "minimal"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot/../read-scripts-env.ps1"

function Invoke-Step {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host "[verify] $Name"
    $global:LASTEXITCODE = 0
    & $Script
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[verify] failed: $Name"
        exit 1
    }
}

function Start-VerifyProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    Write-Host "[verify] $Name (started)"
    $resolvedCommand = Get-Command $FilePath -ErrorAction Stop | Select-Object -First 1
    $resolvedPath = if ($resolvedCommand.Path) { $resolvedCommand.Path } else { $resolvedCommand.Source }
    $startFilePath = $resolvedPath
    $startArguments = $Arguments
    $currentShellPath = (Get-Process -Id $PID).Path

    $isWindowsHost = $env:OS -eq "Windows_NT"
    if ($isWindowsHost -and $resolvedPath) {
        $extension = [System.IO.Path]::GetExtension($resolvedPath)
        switch ($extension.ToLowerInvariant()) {
            ".ps1" {
                $startFilePath = $currentShellPath
                $startArguments = @(
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", $resolvedPath
                ) + $Arguments
            }
            ".cmd" {
                $startFilePath = "cmd.exe"
                $startArguments = @("/d", "/c", $resolvedPath) + $Arguments
            }
            ".bat" {
                $startFilePath = "cmd.exe"
                $startArguments = @("/d", "/c", $resolvedPath) + $Arguments
            }
        }
    }

    if ($isWindowsHost) {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = $startFilePath
        $psi.WorkingDirectory = $WorkingDirectory
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true

        foreach ($arg in $startArguments) {
            [void]$psi.ArgumentList.Add($arg)
        }

        $process = New-Object System.Diagnostics.Process
        $process.StartInfo = $psi
        $process.Start() | Out-Null

        return $process
    }

    return Start-Process `
        -FilePath $startFilePath `
        -ArgumentList $startArguments `
        -WorkingDirectory $WorkingDirectory `
        -NoNewWindow `
        -PassThru
}

function Resolve-ExecutableCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $trimmedValue = $Value.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmedValue)) {
        Write-Error "[verify] $Label is empty."
        exit 2
    }

    $resolvedCommand = Get-Command $trimmedValue -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $resolvedCommand) {
        Write-Error "[verify] $Label '$trimmedValue' is not executable in the current environment."
        exit 3
    }

    if ($resolvedCommand.Path) {
        return $resolvedCommand.Path
    }

    return $resolvedCommand.Source
}

if ($TestProfile -ne "minimal") {
    Write-Error "[verify] unsupported profile: $TestProfile"
    exit 1
}

if ($LintMode -eq "apply") {
    Write-Warning "[verify] LintMode=apply is treated as check in quick profile."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$frontendDir = Join-Path $repoRoot "frontend"
$shopApiDir = Join-Path $repoRoot "backend/apps/ShopAPI"
$shopOperatorDir = Join-Path $repoRoot "backend/apps/ShopOperator"
$scriptsEnvPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot "scripts/.env"))
$verifyCachePath = Join-Path $repoRoot ".runtime/verify/minimal-src-cache.json"
[int]$parallelWorkers = 2
$phpCommand = "php"

function Get-SourceFingerprint {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Paths
    )

    $hash = [System.Security.Cryptography.SHA256]::Create()

    try {
        foreach ($path in ($Paths | Sort-Object)) {
            $normalizedPath = [System.IO.Path]::GetFullPath($path)
            $pathHeader = [System.Text.Encoding]::UTF8.GetBytes("##$normalizedPath`n")
            [void]$hash.TransformBlock($pathHeader, 0, $pathHeader.Length, $pathHeader, 0)

            if (-not (Test-Path -LiteralPath $normalizedPath -PathType Container)) {
                $missingBytes = [System.Text.Encoding]::UTF8.GetBytes("__missing__`n")
                [void]$hash.TransformBlock($missingBytes, 0, $missingBytes.Length, $missingBytes, 0)
                continue
            }

            $files = Get-ChildItem -LiteralPath $normalizedPath -File -Recurse | Sort-Object FullName
            foreach ($file in $files) {
                $relativePath = [System.IO.Path]::GetRelativePath($normalizedPath, $file.FullName).Replace("\", "/")
                $pathBytes = [System.Text.Encoding]::UTF8.GetBytes("$relativePath`n")
                [void]$hash.TransformBlock($pathBytes, 0, $pathBytes.Length, $pathBytes, 0)

                $fileStream = [System.IO.File]::OpenRead($file.FullName)
                try {
                    $buffer = New-Object byte[] 8192
                    while (($read = $fileStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                        [void]$hash.TransformBlock($buffer, 0, $read, $buffer, 0)
                    }
                }
                finally {
                    $fileStream.Dispose()
                }
            }
        }

        $finalBytes = [System.Text.Encoding]::UTF8.GetBytes("__end__")
        [void]$hash.TransformFinalBlock($finalBytes, 0, $finalBytes.Length)
        return ([System.BitConverter]::ToString($hash.Hash)).Replace("-", "").ToLowerInvariant()
    }
    finally {
        $hash.Dispose()
    }
}

function New-VerifyBlock {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Key,
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string[]]$SourcePaths,
        [Parameter(Mandatory = $true)]
        [string]$WorkingDirectory,
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    return @{
        Key = $Key
        Name = $Name
        SourcePaths = $SourcePaths
        WorkingDirectory = $WorkingDirectory
        FilePath = $FilePath
        Arguments = $Arguments
        Fingerprint = (Get-SourceFingerprint -Paths $SourcePaths)
    }
}
function Load-VerifyCache {
    if (-not (Test-Path -LiteralPath $verifyCachePath -PathType Leaf)) {
        return @{}
    }

    try {
        $raw = Get-Content -LiteralPath $verifyCachePath -Raw
        if ([string]::IsNullOrWhiteSpace($raw)) {
            return @{}
        }

        $parsed = ConvertFrom-Json $raw -AsHashtable
        if ($parsed) {
            return $parsed
        }

        return @{}
    }
    catch {
        Write-Warning "[verify] failed to read cache '$verifyCachePath'; continuing without cache."
        return @{}
    }
}

function Save-VerifyCache {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Cache
    )

    $cacheDir = Split-Path -Parent $verifyCachePath
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
    $Cache | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $verifyCachePath -NoNewline
}

Invoke-Step -Name "validate platform artifacts" -Script {
    & (Join-Path $repoRoot "scripts/swap-env.ps1")
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

$scriptsEnv = Read-ScriptsEnv -Path $scriptsEnvPath

if ($scriptsEnv.ContainsKey("TEST_PARALLEL_WORKERS")) {
    $rawWorkers = $scriptsEnv["TEST_PARALLEL_WORKERS"]
    $parsedParallelWorkers = 0
    if (-not [int]::TryParse($rawWorkers, [ref]$parsedParallelWorkers) -or $parsedParallelWorkers -lt 1) {
        Write-Error "[verify] invalid TEST_PARALLEL_WORKERS='$rawWorkers' in '$scriptsEnvPath'. Expected integer >= 1."
        exit 2
    }

    $parallelWorkers = $parsedParallelWorkers
}

if ($scriptsEnv.ContainsKey("SCRIPT_PHP_PATH")) {
    $configuredPhpPath = $scriptsEnv["SCRIPT_PHP_PATH"].Trim()
    if (-not [string]::IsNullOrWhiteSpace($configuredPhpPath)) {
        $phpCommand = Resolve-ExecutableCommand -Value $configuredPhpPath -Label "SCRIPT_PHP_PATH"
    }
}

$npmCommand = Resolve-ExecutableCommand -Value "npm" -Label "npm"
$phpCommand = Resolve-ExecutableCommand -Value $phpCommand -Label "php"

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Error "[verify] frontend/node_modules is missing."
    exit 3
}

if (-not (Test-Path (Join-Path $shopApiDir "vendor"))) {
    Write-Error "[verify] backend/apps/ShopAPI/vendor is missing."
    exit 3
}

if (-not (Test-Path (Join-Path $shopOperatorDir "vendor"))) {
    Write-Error "[verify] backend/apps/ShopOperator/vendor is missing."
    exit 3
}

Invoke-Step -Name "minimal tests (parallel)" -Script {
    $cache = Load-VerifyCache
    $blocks = @(
        (New-VerifyBlock `
            -Key "frontend-unit" `
            -Name "frontend unit tests" `
            -SourcePaths @((Join-Path $frontendDir "src")) `
            -WorkingDirectory $frontendDir `
            -FilePath $npmCommand `
            -Arguments @("run", "test:unit:parallel", "--if-present"))
        (New-VerifyBlock `
            -Key "shop-api-quick" `
            -Name "backend quick tests (ShopAPI)" `
            -SourcePaths @(
                (Join-Path $shopApiDir "app"),
                (Join-Path $repoRoot "backend/packages/SchemaDefinition/src")
            ) `
            -WorkingDirectory $shopApiDir `
            -FilePath $phpCommand `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers"))
        (New-VerifyBlock `
            -Key "shop-operator-quick" `
            -Name "backend quick tests (ShopOperator)" `
            -SourcePaths @(
                (Join-Path $shopOperatorDir "app"),
                (Join-Path $repoRoot "backend/packages/SchemaDefinition/src")
            ) `
            -WorkingDirectory $shopOperatorDir `
            -FilePath $phpCommand `
            -Arguments @("artisan", "test", "--parallel", "--processes=$parallelWorkers"))
    )

    $processEntries = @()
    foreach ($block in $blocks) {
        $cachedFingerprint = if ($cache.ContainsKey($block.Key)) { [string]$cache[$block.Key] } else { $null }
        if ($cachedFingerprint -and $cachedFingerprint -eq $block.Fingerprint) {
            Write-Host "[verify] $($block.Name) (cache hit: src unchanged)"
            continue
        }

        $processEntries += [pscustomobject]@{
            Block = $block
            Process = Start-VerifyProcess `
                -Name $block.Name `
                -WorkingDirectory $block.WorkingDirectory `
                -FilePath $block.FilePath `
                -Arguments $block.Arguments
        }
    }

    $hasFailures = $false
    foreach ($entry in $processEntries) {
        $process = $entry.Process
        $process.WaitForExit()
        $process.Refresh()
        $exitCode = $process.ExitCode
        if ($null -eq $exitCode -and $process.HasExited) {
            $exitCode = 0
        }

        if ($exitCode -ne 0) {
            Write-Error "[verify] failed: $($entry.Block.Name) (process id=$($process.Id), exit code=$exitCode)"
            $hasFailures = $true
            continue
        }

        $cache[$entry.Block.Key] = $entry.Block.Fingerprint
    }

    if ($hasFailures) {
        exit 1
    }

    Save-VerifyCache -Cache $cache
}

Write-Host "[verify] quick verification passed."
exit 0
