/**
 * 새론금융대부중개 — SNS 게시 & 알림 모듈
 * =====================================================
 * 기능:
 *   1. Instagram 자동 게시 (INSTAGRAM_ACCESS_TOKEN 설정 시)
 *   2. Telegram 완료 알림 (TELEGRAM_BOT_TOKEN 설정 시)
 *   3. 로컬 파일 백업 (항상 실행)
 *
 * 원칙:
 *   - 홈페이지 ≠ SNS (완전 분리, 절대 불변)
 *   - 계정 운영: 이희전 / 고객 노출 명의: 김덕진
 *   - 모든 게시물에 법정 고지문 자동 포함
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const IG_API    = 'https://graph.facebook.com/v21.0';
const TH_API    = 'https://graph.threads.net/v1.0';
const IG_DELAY  = 10000; // Instagram 이미지 처리 대기 (10초)

class SNSPublisher {
  constructor() {
    this.igUserId  = process.env.INSTAGRAM_USER_ID;
    this.igToken   = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.tgToken   = process.env.TELEGRAM_BOT_TOKEN;
    this.tgChatId  = process.env.TELEGRAM_CHAT_ID;
    this.ogBase    = (process.env.OG_IMAGE_BASE_URL || '').replace(/\/$/, '');
    // Threads: 별도 토큰 없으면 Instagram 토큰 재사용
    this.thToken   = process.env.THREADS_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN;
    this.thUserId  = process.env.INSTAGRAM_USER_ID;  // Threads user ID = Instagram user ID
  }

  // ─── Instagram 자동 게시 ──────────────────────────

  async postInstagram(caption, category = '금융상식') {
    if (!this.igUserId || !this.igToken) {
      console.log('  ⏭️  Instagram 토큰 미설정 → 파일 저장만 실행');
      return { skipped: true, reason: 'no_credentials' };
    }
    if (!this.ogBase) {
      console.log('  ⏭️  OG_IMAGE_BASE_URL 미설정 → 파일 저장만 실행');
      return { skipped: true, reason: 'no_og_url' };
    }

    const catEnc   = encodeURIComponent(category);
    const imageUrl = `${this.ogBase}/api/og?cat=${catEnc}`;

    console.log(`  📸 Instagram 게시 시작 (카테고리: ${category})`);
    console.log(`  🖼️  이미지 URL: ${imageUrl}`);

    // 1단계: 미디어 컨테이너 생성
    const containerRes = await fetch(`${IG_API}/${this.igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption:   caption,
        access_token: this.igToken,
      }),
    });
    const container = await containerRes.json();

    if (!container.id) {
      console.error('  ❌ 컨테이너 생성 실패:', JSON.stringify(container));
      return { success: false, error: container };
    }

    // 2단계: Instagram 처리 대기
    console.log(`  ⏳ 처리 대기 중... (${IG_DELAY / 1000}초)`);
    await new Promise(r => setTimeout(r, IG_DELAY));

    // 3단계: 게시 (publish)
    const publishRes = await fetch(`${IG_API}/${this.igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id:  container.id,
        access_token: this.igToken,
      }),
    });
    const publish = await publishRes.json();

    if (publish.id) {
      console.log(`  ✅ Instagram 게시 완료! Post ID: ${publish.id}`);
      return { success: true, postId: publish.id, imageUrl };
    } else {
      console.error('  ❌ 게시 실패:', JSON.stringify(publish));
      return { success: false, error: publish };
    }
  }

  // ─── Threads 자동 크로스포스팅 ───────────────────────

  async postThreads(text) {
    if (!this.thUserId || !this.thToken) {
      console.log('  ⏭️  Threads 토큰 미설정 → 건너뜀');
      return { skipped: true, reason: 'no_credentials' };
    }

    try {
      // 1단계: 텍스트 컨테이너 생성
      const containerRes = await fetch(`${TH_API}/${this.thUserId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type:   'TEXT',
          text:         text,
          access_token: this.thToken,
        }),
      });
      const container = await containerRes.json();
      if (!container.id) {
        console.error('  ❌ Threads 컨테이너 생성 실패:', JSON.stringify(container));
        return { success: false, error: container };
      }

      // 2단계: 게시 (publish)
      await new Promise(r => setTimeout(r, 3000)); // 3초 대기
      const publishRes = await fetch(`${TH_API}/${this.thUserId}/threads_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id:  container.id,
          access_token: this.thToken,
        }),
      });
      const publish = await publishRes.json();
      if (publish.id) {
        console.log(`  ✅ Threads 게시 완료! Post ID: ${publish.id}`);
        return { success: true, postId: publish.id };
      } else {
        console.error('  ❌ Threads 게시 실패:', JSON.stringify(publish));
        return { success: false, error: publish };
      }
    } catch (err) {
      console.error('  ❌ Threads 오류:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ─── Telegram 알림 ────────────────────────────────

  async notifyTelegram(message) {
    if (!this.tgToken || !this.tgChatId) return;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.tgToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id:    this.tgChatId,
            text:       message,
            parse_mode: 'HTML',
          }),
        }
      );
      const data = await res.json();
      if (data.ok) console.log('  📱 Telegram 알림 전송 완료');
      else console.warn('  ⚠️  Telegram 전송 오류:', data.description);
    } catch (err) {
      console.warn('  ⚠️  Telegram 오류 (무시):', err.message);
    }
  }

  // ─── 파일 백업 (항상 실행) ─────────────────────────

  saveToFile(type, dateStr, content) {
    const dir = path.join('./generated', type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = path.join(dir, `${type}_${dateStr}_${Date.now()}.txt`);
    const header = [
      '══════════════════════════════════════',
      '새론금융대부중개 · 대표: 김덕진',
      '📞 1555-2137 · 010-5927-9205',
      '등록번호: 2026-수원-2324',
      `생성일시: ${new Date().toLocaleString('ko-KR')}`,
      `유형: ${type}`,
      '══════════════════════════════════════',
      '',
    ].join('\n');

    fs.writeFileSync(filename, header + content, 'utf8');
    console.log(`  💾 파일 저장: ${filename}`);
    return filename;
  }

  // ─── 실행 로그 저장 ───────────────────────────────

  saveToLog(results) {
    const logDir = './logs';
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const today   = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `log_${today}.json`);

    let logs = [];
    if (fs.existsSync(logFile)) {
      try { logs = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch (_) {}
    }
    logs.push({ timestamp: new Date().toISOString(), results });
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    return logFile;
  }
}

module.exports = SNSPublisher;

