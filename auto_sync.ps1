# 새론금융대부중개 - GitHub 자동 동기화 스크립트
# (자동화 주기: 1분 단위로 단축, 실수 방지/보안 정책 안내 포함)
#
# ⚠️ Copilot이 파일 수정 후 자동으로 git add/commit/push를 실행하기 전 반드시 사용자에게 동의 여부를 묻고, 동의 시에만 실행합니다.
# (정책상 자동 커밋/푸시는 사용자의 명시적 동의가 필요합니다)
#
# Windows 작업 스케줄러/크론 등에서 1분마다 실행 권장

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
