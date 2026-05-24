// summary-reporter.js
// 전체 전략/구조/성과/변경내역을 요약해 README.md로 자동 저장
const fs = require('fs');
const path = require('path');
const { loadAllFiles } = require('./memory-loader');

function generateSummary() {
  const files = loadAllFiles();
  let summary = '# 새론금융 AGI 자동화 시스템 요약\n\n';
  summary += '## 주요 파일 목록\n';
  Object.keys(files).forEach(f => {
    summary += `- ${f}\n`;
  });
  summary += '\n## 최근 변경내역(상세는 audit-log.json 참고)\n';
  const auditPath = path.join(__dirname, '../audit-log.json');
  if (fs.existsSync(auditPath)) {
    const logs = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));
    logs.slice(-5).reverse().forEach(log => {
      summary += `- [${log.time}] ${log.action}: ${log.filePath} (${log.summary})\n`;
    });
  }
  fs.writeFileSync(path.join(__dirname, '../README.md'), summary);
}

module.exports = { generateSummary };