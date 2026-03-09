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

foreach ($file in $Files) {
    $parent = Split-Path -Path $file -Parent
    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    if ($PSCmdlet.ShouldProcess($file, 'Truncate file')) {
        [System.IO.File]::Create($file).Dispose()
        Write-Output "Очистка выполнена: $file"
    }
}
