// lead-manager.js
// 리드(고객 문의) 자동 저장 및 구글시트 연동
const { writeSheet } = require('./google-sheets-connector');
const LEAD_SHEET_ID = process.env.LEAD_SHEET_ID || '1gH4xpqVBvpY9wAoI8wB7s4z7LWBOMR1jSnH2gCuKRZ0';
const LEAD_RANGE = 'Leads!A1:Z1000';

async function saveLead(lead) {
  // lead: {name, phone, channel, message, date}
  await writeSheet(LEAD_SHEET_ID, LEAD_RANGE, [[lead.name, lead.phone, lead.channel, lead.message, lead.date]]);
}

module.exports = { saveLead };
