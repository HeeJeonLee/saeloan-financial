// notifier.js
// 감사/요약/에러 발생 시 텔레그램·이메일 등으로 자동 알림 전송
const fs = require('fs');
const path = require('path');
const https = require('https');

// 텔레그램 봇 토큰/채널ID는 set-secrets.js에서 안전하게 불러옴(여기선 예시)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const data = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message });
  const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  req.write(data); req.end();
}

function notifyAudit(summary) {
  sendTelegram(`[감사보고] ${summary}`);
  // 이메일 등 추가 가능
}

module.exports = { notifyAudit };
