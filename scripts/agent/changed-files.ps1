param(
    [switch]$Staged,
    [switch]$Json
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    exit 3
}

if ($Staged) {
    $files = git diff --name-only --cached
} else {
    $files = git status --porcelain=v1 | ForEach-Object {
        $_.Substring(3)
    }
}

if ($Json) {
    $files | ConvertTo-Json
} else {
    $files
}

exit 0
