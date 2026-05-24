// audit-logger.js
// 파일 생성/수정/삭제/저장 시 Git 커밋/푸시 및 감사 리포트 자동 기록
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function gitCommitAndPush(filePath, message) {
  try {
    execSync(`git add "${filePath}"`);
    execSync(`git commit -m "${message}"`);
    execSync('git push');
    return true;
  } catch (e) {
    return false;
  }
}

function logAudit(filePath, action, summary) {
  const logPath = path.join(__dirname, '../audit-log.json');
  const now = new Date().toISOString();
  let logs = [];
  if (fs.existsSync(logPath)) logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  logs.push({ filePath, action, summary, time: now });
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
}

module.exports = { gitCommitAndPush, logAudit };