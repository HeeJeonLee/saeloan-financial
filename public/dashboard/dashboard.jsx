import React from 'react';

// 대시보드: 전체 파일/설정/성과/감사내역/요약본 시각화
function Dashboard() {
  // 실제 구현시 fetch로 backend API 또는 파일 직접 읽기
  const [goals, setGoals] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [leads, setLeads] = useState([]);
  const [competitors, setCompetitors] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/goals').then(r => r.json()).then(setGoals);
    fetch('http://localhost:4000/api/performance').then(r => r.json()).then(setPerformance);
    fetch('http://localhost:4000/api/leads').then(r => r.json()).then(setLeads);
    fetch('http://localhost:4000/api/competitors').then(r => r.json()).then(d => setCompetitors(d.report));
  }, []);

  // 실적 차트 데이터 예시
  const goalChartData = goals ? {
    labels: ['월간', '주간', '누적'],
    datasets: [
      {
        label: '실적',
        data: [goals.month, goals.week, goals.total],
        backgroundColor: ['#4F8EF7', '#50C878', '#F7B32B'],
      },
    ],
  } : null;

  // 리드 분류별 카운트
  const leadTypeCount = leads.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});
  const leadTypeChartData = {
    labels: Object.keys(leadTypeCount),
    datasets: [{
      label: '리드 유형별',
      data: Object.values(leadTypeCount),
      backgroundColor: '#4F8EF7',
    }],
  };

  return (
    <div style={{padding: 32, fontFamily: 'sans-serif'}}>
      <h1>새론금융 AGI 자동화 대시보드</h1>
      <h2>실적 집계</h2>
      {goals && <Bar data={goalChartData} />}
      {performance && (
        <div style={{marginTop: 16}}>
          <b>목표 달성률</b>: {performance.summary}
        </div>
      )}
      <h2>리드(고객 문의) 유형별 분포</h2>
      <Bar data={leadTypeChartData} />
      <h2>리드 상세</h2>
      <table border="1" cellPadding="4"><thead>
        <tr><th>이름</th><th>연락처</th><th>채널</th><th>메시지</th><th>날짜</th><th>유형</th><th>우선순위</th></tr>
      </thead><tbody>
        {leads.map((l, i) => (
          <tr key={i}>
            <td>{l.name}</td><td>{l.phone}</td><td>{l.channel}</td><td>{l.message}</td><td>{l.date}</td><td>{l.type}</td><td>{l.priority}</td>
          </tr>
        ))}
      </tbody></table>
      <h2>경쟁사 모니터링</h2>
      <pre>{competitors}</pre>
    </div>
  );
}

export default Dashboard;