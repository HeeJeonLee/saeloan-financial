/**
 * ============================================================
 * YouTube OAuth refresh_token 자동 획득 스크립트
 * ============================================================
 * 사용법:
 *   node get-youtube-token.js
 *
 * 사전 준비:
 *   1. Google Cloud Console (https://console.cloud.google.com) 접속
 *   2. 새 프로젝트 생성: "saeloan-ai-agent"
 *   3. YouTube Data API v3 활성화
 *   4. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
 *   5. 클라이언트 ID와 시크릿을 아래 방법으로 입력:
 *      - .env 파일에 YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET 입력 후 실행
 *      - 또는 이 스크립트 실행 시 터미널에서 입력
 *
 * 완료 시:
 *   - .env 파일에 YOUTUBE_REFRESH_TOKEN 자동 저장
 * ============================================================
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');
const { URL } = require('url');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const ENV_FILE = path.join(__dirname, '.env');

// ──────────────────────────────────────────────
// 콘솔 색상 (터미널 가독성)
// ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(msg) { console.log(msg); }
function ok(msg)  { console.log(`${C.green}✔ ${msg}${C.reset}`); }
function info(msg){ console.log(`${C.cyan}ℹ ${msg}${C.reset}`); }
function warn(msg){ console.log(`${C.yellow}⚠ ${msg}${C.reset}`); }
function err(msg) { console.log(`${C.red}✘ ${msg}${C.reset}`); }
function bold(msg){ return `${C.bold}${msg}${C.reset}`; }
function title(msg){ console.log(`\n${C.bold}${C.cyan}${'═'.repeat(55)}\n  ${msg}\n${'═'.repeat(55)}${C.reset}\n`); }

// ──────────────────────────────────────────────
// .env 파일 업데이트 (기존 키 교체 또는 추가)
// ──────────────────────────────────────────────
function updateEnvFile(keyValuePairs) {
  let content = '';
  if (fs.existsSync(ENV_FILE)) {
    content = fs.readFileSync(ENV_FILE, 'utf8');
  }
  for (const [key, value] of Object.entries(keyValuePairs)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(ENV_FILE, content);
}

// ──────────────────────────────────────────────
// 브라우저 열기 (Windows / Mac / Linux 모두 지원)
// ──────────────────────────────────────────────
function openBrowser(url) {
  const cmd = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (e) => { if (e) warn('브라우저 자동 실행 실패. 아래 URL을 수동으로 복사해서 브라우저에 붙여넣으세요.'); });
}

// ──────────────────────────────────────────────
// readline 프롬프트
// ──────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

// ──────────────────────────────────────────────
// Google OAuth token 교환
// ──────────────────────────────────────────────
function exchangeCodeForTokens(code, clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('토큰 파싱 오류: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
async function main() {
  title('YouTube refresh_token 자동 획득 도구');

  // 1. 클라이언트 ID / 시크릿 확인
  let clientId = process.env.YOUTUBE_CLIENT_ID || '';
  let clientSecret = process.env.YOUTUBE_CLIENT_SECRET || '';

  if (!clientId || clientId.includes('여기에')) {
    log(bold('Google Cloud Console에서 OAuth 클라이언트 ID를 발급받아야 합니다.'));
    log('');
    log('  1. https://console.cloud.google.com 접속');
    log('  2. 왼쪽 메뉴 → "API 및 서비스" → "사용자 인증 정보"');
    log('  3. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"');
    log('  4. 애플리케이션 유형: "데스크톱 앱"');
    log('  5. 이름: "saeloan-agent" → 만들기');
    log('  6. 팝업에서 클라이언트 ID와 시크릿 확인');
    log('');
    clientId = await prompt(`${C.yellow}클라이언트 ID 붙여넣기: ${C.reset}`);
  } else {
    ok(`YOUTUBE_CLIENT_ID 확인됨: ${clientId.slice(0, 20)}...`);
  }

  if (!clientSecret || clientSecret.includes('여기에')) {
    clientSecret = await prompt(`${C.yellow}클라이언트 시크릿 붙여넣기: ${C.reset}`);
  } else {
    ok(`YOUTUBE_CLIENT_SECRET 확인됨: ${clientSecret.slice(0, 10)}...`);
  }

  // 2. Google OAuth URL 생성
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ].join(' ');

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // refresh_token 항상 발급

  // 3. 로컬 HTTP 서버 시작 (콜백 수신용)
  let resolveCode;
  const codePromise = new Promise((res) => { resolveCode = res; });

  const server = http.createServer((req, res) => {
    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    if (urlObj.pathname !== '/callback') return;

    const code = urlObj.searchParams.get('code');
    const error = urlObj.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2 style="color:red">오류: ${error}</h2><p>터미널로 돌아가세요.</p>`);
      resolveCode(null);
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>YouTube 연결 완료</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#f0f4f8">
        <h1 style="color:#22c55e">✔ YouTube 연결 완료!</h1>
        <p>터미널로 돌아가세요. refresh_token이 자동 저장됩니다.</p>
        <p style="color:#888;font-size:0.9em">이 창은 닫아도 됩니다.</p>
      </body>
      </html>
    `);
    resolveCode(code);
  });

  server.listen(PORT, () => {
    info(`로컬 서버 시작됨 (포트 ${PORT})`);
    log('');
    info('브라우저에서 Google 로그인을 완료하세요...');
    log(`${C.gray}  URL: ${authUrl.toString()}${C.reset}`);
    log('');
    openBrowser(authUrl.toString());
    warn('브라우저가 열리지 않으면 위 URL을 복사해서 직접 열어주세요.');
  });

  // 4. 인증 코드 대기
  const code = await codePromise;
  server.close();

  if (!code) {
    err('인증 코드를 받지 못했습니다. 다시 시도하세요.');
    process.exit(1);
  }
  ok('인증 코드 수신 완료');

  // 5. 토큰 교환
  info('refresh_token 발급 중...');
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code, clientId, clientSecret);
  } catch (e) {
    err('토큰 교환 실패: ' + e.message);
    process.exit(1);
  }

  if (tokens.error) {
    err(`Google 오류: ${tokens.error} — ${tokens.error_description || ''}`);
    process.exit(1);
  }

  if (!tokens.refresh_token) {
    warn('refresh_token이 없습니다. Google 계정에서 기존 앱 권한을 취소 후 다시 실행하세요.');
    warn('계정 권한 취소: https://myaccount.google.com/permissions');
    process.exit(1);
  }

  // 6. .env 파일에 저장
  updateEnvFile({
    YOUTUBE_CLIENT_ID: clientId,
    YOUTUBE_CLIENT_SECRET: clientSecret,
    YOUTUBE_REFRESH_TOKEN: tokens.refresh_token,
  });

  log('');
  ok('════════════════════════════════════');
  ok('YouTube 설정 완료!');
  ok('════════════════════════════════════');
  log('');
  log(`  refresh_token: ${C.gray}${tokens.refresh_token.slice(0, 30)}...${C.reset}`);
  log(`  .env 파일에 자동 저장되었습니다.`);
  log('');
  info('다음 단계: node set-secrets.js 실행 → GitHub Secrets 자동 등록');
}

main().catch((e) => { err(e.message); process.exit(1); });
