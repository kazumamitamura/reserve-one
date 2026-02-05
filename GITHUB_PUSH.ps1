# Reserve-One: GitHub に新規リポジトリとしてプッシュするスクリプト
# 実行: プロジェクトフォルダで右クリック → PowerShell で開く → .\GITHUB_PUSH.ps1

$ErrorActionPreference = "Stop"

# カレントディレクトリをプロジェクトルートに
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "=== Reserve-One: GitHub 新規リポジトリ作成 ===" -ForegroundColor Cyan

# 1. Git 初期化（.git が無い場合のみ新規作成）
git init
git branch -M main

# 2. ファイル追加
git add .

# 3. 初回コミット
git commit -m "Initial commit: Reserve-One B2B予約システム MVP"

Write-Host ""
Write-Host "=== 次の手順 ===" -ForegroundColor Green
Write-Host "1. https://github.com/new を開く"
Write-Host "2. Repository name: reserve-one"
Write-Host "3. Description: B2B予約管理システム MVP (SelectType風)"
Write-Host "4. Public を選択"
Write-Host "5. Add a README file はチェック OFF（既にあります）"
Write-Host "6. Create repository をクリック"
Write-Host ""
Write-Host "7. 作成後、表示されるコマンドの代わりに以下を実行:"
Write-Host ""
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/reserve-one.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "   (YOUR_USERNAME をあなたのGitHubユーザー名に置き換えてください)"
Write-Host ""
