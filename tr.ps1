# truncate-operational-docs.ps1
# Аналог Bash-команды `: > filename` для Windows PowerShell.
# По умолчанию очищает файлы:
#   - operational/PLAN.md
#   - operational/TODO.md
#   - operational/DECISIONS.md
#   - operational/EVIDENCE.md

[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [string[]] $Files = @(
        'operational/PLAN.md',
        'operational/TODO.md',
        'operational/DECISIONS.md',
        'operational/EVIDENCE.md'
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

foreach ($file in $Files) {
    if ([string]::IsNullOrWhiteSpace($file)) {
        throw 'Параметр -Files содержит пустое значение.'
    }

    $targetPath = if ([System.IO.Path]::IsPathRooted($file)) {
        $file
    }
    else {
        Join-Path -Path $PSScriptRoot -ChildPath $file
    }

    try {
        $parent = Split-Path -Path $targetPath -Parent
        if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
            New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }

        if (Test-Path -LiteralPath $targetPath -PathType Container) {
            throw "Ожидался путь к файлу, но получена директория: $targetPath"
        }

        if ($PSCmdlet.ShouldProcess($targetPath, 'Truncate file')) {
            if (-not (Test-Path -LiteralPath $targetPath -PathType Leaf)) {
                New-Item -ItemType File -Path $targetPath -Force | Out-Null
            }
            Set-Content -LiteralPath $targetPath -Value $null -NoNewline -Encoding utf8
            Write-Output "Очистка выполнена: $targetPath"
        }
    }
    catch {
        throw "Ошибка очистки '$file': $($_.Exception.Message)"
    }
}
