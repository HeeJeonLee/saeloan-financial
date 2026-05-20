cd "c:\Users\ADmin\Desktop\saeloan-financial\saeloan-financial"
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
