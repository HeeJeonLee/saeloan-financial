// api-server.js
// 대시보드/프론트엔드와 실시간 데이터 연동용 간단한 Express API 서버
const express = require('express');
const cors = require('cors');
const { getGoals } = require('./goal-tracker');
const { readSheet } = require('./google-sheets-connector');
const { generateCompetitorReport } = require('./competitor-watcher');
const { analyzePerformance } = require('./performance-analyzer');
const { classifyLead } = require('./lead-classifier');
const { notifyAudit } = require('./notifier');

const app = express();
app.use(cors());
app.use(express.json());

const LEAD_SHEET_ID = process.env.LEAD_SHEET_ID || '1gH4xpqVBvpY9wAoI8wB7s4z7LWBOMR1jSnH2gCuKRZ0';
const LEAD_RANGE = 'Leads!A1:Z1000';

app.get('/api/goals', (req, res) => {
  res.json(getGoals());
});

app.get('/api/performance', (req, res) => {
  res.json(analyzePerformance());
});

app.get('/api/leads', async (req, res) => {
  const leads = await readSheet(LEAD_SHEET_ID, LEAD_RANGE);
  // 분류 정보 추가
  const classified = leads.map(row => {
    const [name, phone, channel, message, date] = row;
    return classifyLead({ name, phone, channel, message, date });
  });
  res.json(classified);
});

app.get('/api/competitors', (req, res) => {
  res.json({ report: generateCompetitorReport() });
});

// 알림 전송 API (예: 대시보드에서 수동 감사보고)
app.post('/api/notify', (req, res) => {
  const { message } = req.body;
  notifyAudit(message || '수동 감사보고');
  res.json({ ok: true });
});

app.listen(4000, () => {
  console.log('API 서버가 4000번 포트에서 실행 중');
});
