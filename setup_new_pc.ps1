Write-Host "===== 새론금융 자동화 시스템 설치 시작 =====" -ForegroundColor Cyan

# 1. 프로젝트 클론
$desktop = [Environment]::GetFolderPath("Desktop")
$projectPath = "$desktop\saeloan-financial\saeloan-financial"

if (!(Test-Path $projectPath)) {
    Write-Host "GitHub에서 프로젝트 다운로드 중..." -ForegroundColor Yellow
    cd "$desktop"
    git clone https://github.com/HeeJeonLee/saeloan-financial.git "saeloan-financial"
    Write-Host "✅ 프로젝트 다운로드 완료" -ForegroundColor Green
} else {
    Write-Host "✅ 프로젝트 이미 존재 - 최신 내용 받는 중..." -ForegroundColor Green
    cd $projectPath
    git pull origin main
}

# 2. git 인코딩 설정
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8
git config --global core.quotepath false
Write-Host "✅ git 한글 인코딩 설정 완료" -ForegroundColor Green

# 3. 작업 스케줄러 등록 (5분마다 자동 동기화)
$scriptPath = "$projectPath\auto_sync.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""
$triggerBoot = New-ScheduledTaskTrigger -AtLogOn
$triggerRepeat = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) -Once -At (Get-Date)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "새론금융_자동동기화" -Action $action -Trigger $triggerBoot, $triggerRepeat -Settings $settings -RunLevel Highest -Force | Out-Null
Write-Host "✅ 5분마다 자동 동기화 스케줄러 등록 완료" -ForegroundColor Green

# 4. VS Code로 바로 열기
Write-Host "VS Code로 프로젝트 열기..." -ForegroundColor Yellow
code $projectPath

Write-Host ""
Write-Host "===== 설치 완료! =====" -ForegroundColor Cyan
Write-Host "이제 이 PC에서도 5분마다 자동으로 GitHub와 동기화됩니다." -ForegroundColor White
