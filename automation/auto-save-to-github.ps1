while ($true) {
    # Check if there are any changes to commit
    $status = git status --porcelain
    if ($status) {
        Write-Host "변경 사항 감지됨. GitHub에 자동 저장 시작..."
        git add .
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git commit -m "chore: 자동 저장 ($timestamp)"
        git push
        Write-Host "자동 저장 완료: $timestamp"
    } else {
        Write-Host "변경 사항 없음. 1분 후 다시 확인합니다."
    }
    
    # Wait for 60 seconds
    Start-Sleep -Seconds 60
}
