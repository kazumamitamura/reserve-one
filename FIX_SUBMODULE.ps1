# サブモジュール関連のエラーを解消するスクリプト
# 使用例: git push で "submodule" や "nested git" の警告が出た場合に実行

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "=== サブモジュール解消 ===" -ForegroundColor Cyan

# 1. .gitmodules があれば削除
if (Test-Path ".gitmodules") {
    Remove-Item .gitmodules -Force
    Write-Host ".gitmodules を削除しました" -ForegroundColor Green
} else {
    Write-Host ".gitmodules はありません" -ForegroundColor Gray
}

# 2. 誤ってサブモジュール化したフォルダを Git の管理から外す
# 警告が出ているフォルダ名をここに追加（例: "some-subfolder"）
$foldersToUncache = @(
    "node_modules"
    ".next"
    "build"
)
foreach ($folder in $foldersToUncache) {
    if (Test-Path $folder) {
        git rm -r --cached $folder -ErrorAction SilentlyContinue 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "$folder をキャッシュから削除しました" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "完了。次を実行してください:" -ForegroundColor Yellow
Write-Host "  git add ."
Write-Host "  git commit -m 'fix: submodule cache'"
Write-Host "  git push"
Write-Host ""
