/**
 * 새론금융대부중개 — 네이버 블로그 자동 포스팅 모듈
 * =====================================================
 * 기능:
 *   1. 네이버 OAuth 토큰 자동 갱신
 *   2. SEO 최적화 블로그 포스트 자동 게시
 *   3. 토큰 미설정 시 파일 저장만 실행 (오류 없음)
 *
 * 왜 네이버 블로그?
 *   → 아파트담보대출 관련 키워드 검색 시 네이버 블로그 상위 노출
 *   → 40-60대 타겟 (아파트 소유자 연령대) 이 가장 많이 이용
 *   → 인스타그램 대비 긴 체류 시간 → 신뢰도 구축
 *   → 한 번 작성한 글이 수개월~수년간 검색 유입
 *
 * 사전 설정:
 *   1. https://developers.naver.com 에서 앱 등록
 *   2. "블로그" API 권한 신청
 *   3. Client ID, Client Secret 발급
 *   4. OAuth 1회 인증으로 access_token + refresh_token 확보
 *   5. GitHub Secrets에 저장 (설정 가이드: README 참조)
 *
 * 환경변수:
 *   NAVER_CLIENT_ID      — 네이버 개발자 센터 앱 ID
 *   NAVER_CLIENT_SECRET  — 네이버 개발자 센터 시크릿
 *   NAVER_REFRESH_TOKEN  — OAuth refresh token (1회 발급 후 저장)
 *   NAVER_BLOG_ID        — 네이버 블로그 ID (예: myblog123)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const NAVER_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_BLOG_API  = 'https://openapi.naver.com/blog/writePost.json';

class NaverBlog {
  constructor() {
    this.clientId      = process.env.NAVER_CLIENT_ID;
    this.clientSecret  = process.env.NAVER_CLIENT_SECRET;
    this.refreshToken  = process.env.NAVER_REFRESH_TOKEN;
    this.blogId        = process.env.NAVER_BLOG_ID;
    this.accessToken   = null;
  }

  // ─── 자격증명 확인 ────────────────────────────────
  get isConfigured() {
    return !!(this.clientId && this.clientSecret && this.refreshToken && this.blogId);
  }

  // ─── access_token 갱신 (자동) ────────────────────
  async _refreshAccessToken() {
    const params = new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });

    const res  = await fetch(NAVER_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString(),
    });
    const data = await res.json();

    if (!data.access_token) {
      throw new Error(`네이버 토큰 갱신 실패: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.access_token;
    console.log('  🔑 네이버 access_token 갱신 완료');
  }

  // ─── 블로그 포스트 게시 ───────────────────────────
  async post(title, htmlContent, tags = []) {
    if (!this.isConfigured) {
      console.log('  ⏭️  Naver 블로그 토큰 미설정 → 파일 저장만 실행');
      return { skipped: true, reason: 'no_credentials' };
    }

    await this._refreshAccessToken();

    const body = {
      blogId:   this.blogId,
      title:    title,
      contents: htmlContent,
      tags:     tags.join(','),
      openType: 1, // 1 = 전체 공개
    };

    const res  = await fetch(NAVER_BLOG_API, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type':  'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    // 네이버 API는 성공 시 200, 게시글 URL 반환
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`네이버 블로그 포스팅 실패 (${res.status}): ${err}`);
    }

    const result = await res.json();
    console.log(`  ✅ 네이버 블로그 게시 완료: ${result.postUrl || '(URL 확인 불가)'}`);
    return { success: true, postUrl: result.postUrl, title };
  }

  // ─── 파일 백업 (항상 실행) ────────────────────────
  saveToFile(dateStr, title, htmlContent) {
    const dir  = path.join(__dirname, 'generated', 'naver-blog');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${dateStr}_blog.html`;
    const filepath = path.join(dir, filename);

    const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a3a5c; }
    h2 { color: #2d5f8a; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .legal { background: #f5f5f5; padding: 12px; font-size: 12px; border: 1px solid #ccc; margin-top: 20px; }
  </style>
</head>
<body>
<h1>${title}</h1>
${htmlContent}
</body>
</html>`;

    fs.writeFileSync(filepath, fullHtml, 'utf8');
    console.log(`  💾 네이버 블로그 파일 저장: ${filepath}`);
    return filepath;
  }
}

module.exports = NaverBlog;
