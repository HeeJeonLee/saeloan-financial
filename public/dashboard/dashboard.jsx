import React from 'react';

// 대시보드: 전체 파일/설정/성과/감사내역/요약본 시각화
function Dashboard() {
  // 실제 구현시 fetch로 backend API 또는 파일 직접 읽기
  return (
    <div style={{padding: 32, fontFamily: 'sans-serif'}}>
      <h1>새론금융 AGI 자동화 대시보드</h1>
      <ul>
        <li>전체 파일 목록(file-index.json)</li>
        <li>요약본(README.md)</li>
        <li>감사내역(audit-log.json)</li>
        <li>전략/설정/성과 파일 열람</li>
        <li>실적 리포트(goal-tracker.js 등)</li>
        <li>법규 점검 현황(legal-checker.js)</li>
        <li>경쟁사 모니터링(competitor-watcher.js)</li>
      </ul>
      <p>※ 실제 데이터는 backend 연동 필요</p>
    </div>
  );
}

export default Dashboard;