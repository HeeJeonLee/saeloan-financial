# 새론금융대부중개 - GitHub 자동 동기화 스크립트
# 스크립트 위치 기준으로 동작 → 어떤 PC, 어떤 경로에서도 동작
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath
git pull origin main
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$status = git status --porcelain
if ($status) {
    git commit -m "자동저장: $timestamp"
    git push origin main
    Write-Host "$timestamp - 변경사항 자동 저장 완료"
} else {
    Write-Host "$timestamp - 변경사항 없음"
}

git pull origin main
git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
$status = git status --porcelain
if ($status) {
    git commit -m "자동저장: $timestamp"
    git push origin main
    Write-Host "$timestamp - 변경사항 자동 저장 완료"
} else {
    Write-Host "$timestamp - 변경사항 없음"
}
