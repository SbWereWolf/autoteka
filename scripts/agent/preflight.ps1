param(
    [switch]$Json
)

$ErrorActionPreference = "Stop"

function Exit-With($code, $payload) {
    if ($Json -and $payload) {
        $payload | ConvertTo-Json -Depth 5
    }
    exit $code
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Exit-With 3 @{ error = "git_not_found" }
}

try {
    $root = git rev-parse --show-toplevel 2>$null
} catch {
    Exit-With 4 @{ error = "not_a_git_repo" }
}

$status = git status --porcelain=v1
$branch = git rev-parse --abbrev-ref HEAD
$hasNode = Test-Path "package.json"
$hasComposer = Test-Path "composer.json"

$result = @{
    repo_root     = $root
    branch        = $branch
    has_changes   = ($status.Length -gt 0)
    has_node      = $hasNode
    has_composer  = $hasComposer
    timestamp     = (Get-Date).ToString("o")
}

Exit-With 0 $result
