// google-sheets-connector.js
// Google Sheets API 연동: 실적, 리드, 설정 등 실시간 데이터 입출력
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 서비스 계정 키 파일 경로 (set-secrets.js에서 관리)
const KEYFILEPATH = process.env.GOOGLE_SERVICE_KEY || path.join(__dirname, '../secrets/google-service-key.json');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  return google.sheets({ version: 'v4', auth });
}

async function readSheet(spreadsheetId, range) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values;
}

async function writeSheet(spreadsheetId, range, values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

module.exports = { readSheet, writeSheet };
