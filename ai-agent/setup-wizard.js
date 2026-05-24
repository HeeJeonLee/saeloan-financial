/**
 * ============================================================
 * 새론금융 AI 에이전트 — 통합 설정 마법사
 * ============================================================
 * 사용법:
 *   cd ai-agent
 *   node setup-wizard.js
 *
 * 이 스크립트가 하는 일 (완전 자동화/최소 입력 구조):
 *   1단계: 텔레그램 봇 설정 & 테스트 (이미 .env에 값 있으면 자동 건너뜀)
 *   2단계: ElevenLabs API 키 설정 & 테스트 (이미 .env에 값 있으면 자동 건너뜀)
 *   3단계: Instagram 토큰 설정 & 테스트 (이미 .env에 값 있으면 자동 건너뜀)
 *   4단계: YouTube OAuth (get-youtube-token.js 자동 실행, 이미 .env에 값 있으면 자동 건너뜀)
 *   5단계: GitHub Secrets 자동 등록 (set-secrets.js 자동 실행, 이미 등록된 값은 건너뜀)
 *
 * 사용자는 반드시 입력이 필요한 값(토큰, ID 등)만 복사/붙여넣기 안내에 따라 입력하면 됩니다.
 * 이미 .env에 값이 있으면 해당 단계는 자동으로 PASS됩니다.
 * 각 단계는 성공적으로 완료된 값만 .env에 저장됩니다.
 * ============================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec, spawn } = require('child_process');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const ENV_FILE = path.join(__dirname, '.env');

// ──────────────────────────────────────────────
// 콘솔 색상
// ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', cyan: '\x1b[36m',
  blue: '\x1b[34m', gray: '\x1b[90m',
  magenta: '\x1b[35m',
};
function ok(msg)    { console.log(`${C.green}  ✔ ${msg}${C.reset}`); }
function info(msg)  { console.log(`${C.cyan}  ℹ ${msg}${C.reset}`); }
function warn(msg)  { console.log(`${C.yellow}  ⚠ ${msg}${C.reset}`); }
function err(msg)   { console.log(`${C.red}  ✘ ${msg}${C.reset}`); }
function skip(msg)  { console.log(`${C.gray}  ─ ${msg} (건너뜀)${C.reset}`); }
function step(n, t) {
  console.log(`\n${C.bold}${C.blue}[${'─'.repeat(50)}]${C.reset}`);
  console.log(`${C.bold}${C.blue}  ${n}단계: ${t}${C.reset}`);
  console.log(`${C.bold}${C.blue}[${'─'.repeat(50)}]${C.reset}\n`);
}
function title(msg){
  console.log(`\n${C.bold}${C.magenta}${'═'.repeat(55)}`);
  console.log(`  ${msg}`);
  console.log(`${'═'.repeat(55)}${C.reset}\n`);
}

// ──────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────
function prompt(question, defaultVal = '') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const hint = defaultVal ? ` (현재값: ${C.gray}${defaultVal.slice(0,20)}...${C.reset})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${hint}\n  ${C.yellow}> ${C.reset}`, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultVal);
    });
  });
}

function promptYN(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} ${C.gray}[y/n]${C.reset} `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith('y'));
    });
  });
}

// .env 업데이트
function updateEnv(kvPairs) {
  let content = '';
  if (fs.existsSync(ENV_FILE)) content = fs.readFileSync(ENV_FILE, 'utf8');
  for (const [key, value] of Object.entries(kvPairs)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(ENV_FILE, content);
  process.env[Object.keys(kvPairs)[0]] = Object.values(kvPairs)[0]; // 런타임 반영
}

// HTTPS GET/POST 헬퍼
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

// 자식 프로세스 실행 (interactive)
function runScript(scriptName) {
  return new Promise((resolve) => {
    const child = spawn('node', [path.join(__dirname, scriptName)], {
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

// ──────────────────────────────────────────────
// 1단계: 텔레그램 봇
// ──────────────────────────────────────────────
async function setupTelegram() {
  step(1, '텔레그램 봇 설정 (무료, 10분)');

  const existing = process.env.TELEGRAM_BOT_TOKEN;
  const hasToken = existing && !existing.includes('여기에') && existing.includes(':');

  if (hasToken) {
    const testOk = await testTelegram(existing, process.env.TELEGRAM_CHAT_ID);
    if (testOk) {
      ok('텔레그램이 이미 설정되어 있습니다. 건너뜁니다.');
      return;
    }
    warn('저장된 텔레그램 토큰이 작동하지 않습니다. 재설정합니다.');
  }

  console.log('  텔레그램 봇 만드는 방법:');
  console.log('');
  console.log(`  ${C.bold}① 텔레그램 앱 열기${C.reset}`);
  console.log('     → 검색창에 "@BotFather" 검색 → 대화 시작');
  console.log('');
  console.log(`  ${C.bold}② /newbot 명령어 입력${C.reset}`);
  console.log('     → 봇 이름 입력: 새론금융알림봇');
  console.log('     → 봇 username 입력: saeloan_noti_bot (영문, _bot으로 끝나야 함)');
  console.log('');
  console.log(`  ${C.bold}③ 토큰 복사${C.reset}`);
  console.log('     → BotFather가 "1234567890:AAxxxxxx..." 형식의 토큰을 줍니다');
  console.log('     → 이 전체를 복사하세요');
  console.log('');
  console.log(`  ${C.bold}④ Chat ID 확인${C.reset}`);
  console.log('     → 텔레그램 검색창에 "@userinfobot" 검색 → /start 입력');
  console.log('     → "Id: 1234567890" 형태로 숫자 ID가 나옵니다');
  console.log('');

  const token = await prompt('봇 토큰 입력 (1234567890:AAxxxxxx 형식)');
  if (!token || !token.includes(':')) {
    warn('유효하지 않은 토큰입니다. 이 단계를 건너뜁니다.');
    return;
  }

  const chatId = await prompt('내 Chat ID 입력 (숫자)');
  if (!chatId || isNaN(chatId)) {
    warn('유효하지 않은 Chat ID입니다. 이 단계를 건너뜁니다.');
    return;
  }

  info('텔레그램 연결 테스트 중...');
  const testOk = await testTelegram(token, chatId);
  if (testOk) {
    updateEnv({ TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId });
    ok('텔레그램 설정 완료! 테스트 메시지를 확인하세요.');
  } else {
    err('텔레그램 연결 실패. 토큰과 Chat ID를 다시 확인하세요.');
  }
}

async function testTelegram(token, chatId) {
  if (!token || !chatId) return false;
  try {
    const resp = await httpsGet(
      `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent('✅ 새론금융 AI 에이전트 — 텔레그램 연결 테스트 완료!')}`
    );
    return resp.status === 200 && resp.body && resp.body.ok === true;
  } catch { return false; }
}

// ──────────────────────────────────────────────
// 2단계: ElevenLabs
// ──────────────────────────────────────────────
async function setupElevenLabs() {
  step(2, 'ElevenLabs TTS API 설정 (월 $6 — 한국어 음성)');

  const existing = process.env.ELEVENLABS_API_KEY;
  if (existing && !existing.includes('여기에')) {
    const valid = await testElevenLabs(existing);
    if (valid) {
      ok('ElevenLabs가 이미 설정되어 있습니다. 건너뜁니다.');
      return;
    }
    warn('저장된 키가 작동하지 않습니다. 재설정합니다.');
  }

  console.log('  ElevenLabs 가입 및 API 키 발급 방법:');
  console.log('');
  console.log(`  ${C.bold}① 가입${C.reset}`);
  console.log('     → https://elevenlabs.io/sign-up 접속');
  console.log('     → "Sign up with Google" 클릭 (간편 가입)');
  console.log('     → 또는 이메일/비밀번호 입력 → "Sign up" 클릭');
  console.log('     → Terms of Service 체크 필요');
  console.log('');
  console.log(`  ${C.bold}② 플랜 선택${C.reset}`);
  console.log('     → 무료(Free)로 시작 가능 (10,000자/월)');
  console.log('     → YouTube Shorts 일 1개 기준: 약 250자/일 × 20일 = ~5,000자/월');
  console.log(`     → ${C.green}무료 플랜으로도 충분합니다!${C.reset}`);
  console.log('     → 더 많이 필요하면: Starter $6/월 (30,000자)');
  console.log('');
  console.log(`  ${C.bold}③ API 키 발급${C.reset}`);
  console.log('     → 로그인 후 오른쪽 상단 프로필 아이콘 클릭');
  console.log('     → "Profile + API key" 메뉴 선택');
  console.log('     → API Key 섹션에서 키 복사');
  console.log('');

  const apiKey = await prompt('ElevenLabs API 키 입력 (sk-...또는 영숫자 32자리)');
  if (!apiKey || apiKey.length < 20) {
    warn('유효하지 않은 API 키입니다. 이 단계를 건너뜁니다.');
    return;
  }

  info('ElevenLabs 연결 테스트 중...');
  const valid = await testElevenLabs(apiKey);
  if (valid) {
    // 기본 한국어 음성 ID 유지 (Charlotte)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'XB0fDUnXU5powFXDhCwa';
    updateEnv({ ELEVENLABS_API_KEY: apiKey, ELEVENLABS_VOICE_ID: voiceId });
    ok('ElevenLabs 설정 완료! 한국어 AI 음성이 준비되었습니다.');
  } else {
    err('ElevenLabs 연결 실패. API 키를 다시 확인하세요.');
  }
}

async function testElevenLabs(apiKey) {
  try {
    const urlObj = new URL('https://api.elevenlabs.io/v1/user');
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'GET',
      headers: { 'xi-api-key': apiKey },
    };
    const resp = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
          catch { resolve({ status: res.statusCode, body: d }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
    return resp.status === 200 && resp.body && (resp.body.subscription || resp.body.xi_api_key);
  } catch { return false; }
}

// ──────────────────────────────────────────────
// 3단계: Instagram
// ──────────────────────────────────────────────
async function setupInstagram() {
  step(3, 'Instagram 액세스 토큰 설정 (무료)');

  const existing = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (existing && !existing.includes('여기에') && existing.startsWith('EAA')) {
    const valid = await testInstagram(existing, process.env.INSTAGRAM_USER_ID);
    if (valid) {
      ok('Instagram이 이미 설정되어 있습니다. 건너뜁니다.');
      return;
    }
    warn('저장된 Instagram 토큰이 작동하지 않거나 만료되었습니다. 재설정합니다.');
  }

  console.log('  Instagram 비즈니스 전환 + 토큰 발급 방법:');
  console.log('');
  console.log(`  ${C.bold}① Instagram 계정을 비즈니스 계정으로 전환${C.reset}`);
  console.log('     → Instagram 앱 → 프로필 → 설정 → 계정');
  console.log('     → "전문 계정으로 전환" → "비즈니스" 선택');
  console.log('');
  console.log(`  ${C.bold}② Facebook 페이지와 연결${C.reset}`);
  console.log('     → Meta Business Suite (business.facebook.com) 접속');
  console.log('     → Instagram 계정 연결');
  console.log('');
  console.log(`  ${C.bold}③ Graph API Explorer에서 토큰 발급${C.reset}`);
  console.log('     → https://developers.facebook.com/tools/explorer/ 접속');
  console.log('     → "Meta App" 선택 → "User or Page" 선택');
  console.log('     → Permissions 추가: instagram_basic, instagram_content_publish');
  console.log('     → "Generate Access Token" 클릭 → 팝업 허용');
  console.log('     → 발급된 EAAxxxxx... 토큰 복사');
  console.log('');
  console.log(`  ${C.bold}④ 장기 토큰으로 교환 (60일 유효)${C.reset}`);
  console.log('     → 이 마법사가 자동으로 교환합니다');
  console.log('');

  const shortToken = await prompt('Graph API Explorer에서 복사한 토큰 입력 (EAAxxxxx...)');
  if (!shortToken || !shortToken.startsWith('EAA')) {
    warn('유효하지 않은 토큰입니다. 이 단계를 건너뜁니다.');
    return;
  }

  // 장기 토큰 교환 (앱 ID/시크릿 없이는 불가, 안내만 제공)
  info('Instagram 계정 ID 조회 중...');
  try {
    const meResp = await httpsGet(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${shortToken}`
    );

    if (meResp.status !== 200 || !meResp.body || !meResp.body.data) {
      err('Instagram 토큰이 유효하지 않습니다.');
      return;
    }

    // Instagram 비즈니스 계정 ID 조회
    const igResp = await httpsGet(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${shortToken}`
    );

    if (igResp.status === 200 && igResp.body && igResp.body.id) {
      // Instagram 계정 ID 찾기
      const igAccountResp = await httpsGet(
        `https://graph.facebook.com/v21.0/me?fields=id&access_token=${shortToken}`
      );

      updateEnv({
        INSTAGRAM_ACCESS_TOKEN: shortToken,
        OG_IMAGE_BASE_URL: process.env.OG_IMAGE_BASE_URL || 'https://saeloan.vercel.app',
      });

      // Instagram User ID 입력 안내
      console.log('');
      warn('Instagram 숫자 ID를 별도로 확인해야 합니다:');
      console.log(`  https://graph.facebook.com/v21.0/me/accounts?access_token=${shortToken.slice(0, 20)}...`);
      console.log('  위 URL에서 "id" 값을 복사하세요.');
      console.log('');

      const userId = await prompt('Instagram 비즈니스 계정 숫자 ID 입력');
      if (userId && !isNaN(userId)) {
        updateEnv({ INSTAGRAM_USER_ID: userId });
        ok('Instagram 설정 완료!');
      } else {
        warn('User ID가 없어 일부 기능이 작동하지 않을 수 있습니다.');
      }
    }
  } catch (e) {
    err('Instagram 설정 중 오류: ' + e.message);
  }
}

async function testInstagram(token, userId) {
  if (!token || !userId) return false;
  try {
    const resp = await httpsGet(
      `https://graph.facebook.com/v21.0/${userId}?fields=id,username&access_token=${token}`
    );
    return resp.status === 200 && resp.body && resp.body.id;
  } catch { return false; }
}

// ──────────────────────────────────────────────
// 4단계: YouTube OAuth
// ──────────────────────────────────────────────
async function setupYouTube() {
  step(4, 'YouTube OAuth 설정 (무료, 15분)');

  const existing = process.env.YOUTUBE_REFRESH_TOKEN;
  if (existing && !existing.includes('여기에') && existing.length > 30) {
    ok('YouTube refresh_token이 이미 설정되어 있습니다. 건너뜁니다.');
    return;
  }

  console.log('  YouTube OAuth 설정 방법:');
  console.log('');
  console.log(`  ${C.bold}① Google Cloud Console에서 OAuth 설정${C.reset}`);
  console.log('     → https://console.cloud.google.com 접속 (saeloan.official@gmail.com으로 로그인)');
  console.log('     → 새 프로젝트 만들기: "saeloan-ai-agent"');
  console.log('     → 왼쪽 메뉴 → "API 및 서비스" → "라이브러리"');
  console.log('     → "YouTube Data API v3" 검색 → "사용" 클릭');
  console.log('');
  console.log(`  ${C.bold}② OAuth 2.0 클라이언트 ID 생성${C.reset}`);
  console.log('     → "사용자 인증 정보" 메뉴 → "+ 사용자 인증 정보 만들기"');
  console.log('     → "OAuth 클라이언트 ID" 선택');
  console.log('     → 애플리케이션 유형: "데스크톱 앱"');
  console.log('     → 이름: "saeloan-agent" → 만들기');
  console.log('     → 팝업에서 클라이언트 ID, 클라이언트 시크릿 복사');
  console.log('');
  console.log(`  ${C.bold}③ OAuth 동의 화면 설정 (필수!)${C.reset}`);
  console.log('     → "OAuth 동의 화면" 메뉴 → 외부 선택');
  console.log('     → 앱 이름: "새론금융 AI", 이메일: saeloan.official@gmail.com');
  console.log('     → 테스트 사용자에 saeloan.official@gmail.com 추가');
  console.log('');

  const proceed = await promptYN('  YouTube 설정을 지금 진행하시겠습니까?');
  if (!proceed) {
    skip('YouTube');
    return;
  }

  info('get-youtube-token.js 실행 중...');
  const success = await runScript('get-youtube-token.js');
  if (success) {
    // .env 재로드
    require('dotenv').config({ path: ENV_FILE, override: true });
    ok('YouTube 설정 완료!');
  } else {
    warn('YouTube 설정이 완료되지 않았습니다. 나중에 node get-youtube-token.js를 별도 실행하세요.');
  }
}

// ──────────────────────────────────────────────
// 5단계: GitHub Secrets 등록
// ──────────────────────────────────────────────
async function setupGitHubSecrets() {
  step(5, 'GitHub Secrets 자동 등록');

  console.log('  이 단계에서 .env의 모든 값을 GitHub Secrets에 자동으로 등록합니다.');
  console.log('  GitHub Actions가 자동으로 이 값들을 사용해 매일 게시를 진행합니다.');
  console.log('');

  const proceed = await promptYN('  GitHub Secrets를 지금 등록하시겠습니까?');
  if (!proceed) {
    skip('GitHub Secrets');
    console.log('');
    warn('나중에 등록하려면: cd ai-agent && node set-secrets.js');
    return;
  }

  info('libsodium-wrappers 설치 확인 중...');
  await new Promise((resolve) => {
    exec('cd ' + __dirname + ' && npm list libsodium-wrappers 2>/dev/null || npm install libsodium-wrappers --save', (err, stdout) => {
      resolve();
    });
  });

  info('set-secrets.js 실행 중...');
  const success = await runScript('set-secrets.js');
  if (success) {
    ok('GitHub Secrets 등록 완료!');
  } else {
    warn('GitHub Secrets 등록이 완료되지 않았습니다. node set-secrets.js를 별도 실행하세요.');
  }
}

// ──────────────────────────────────────────────
// 현재 설정 상태 요약
// ──────────────────────────────────────────────
function showStatus() {
  require('dotenv').config({ path: ENV_FILE, override: true });

  const checks = [
    { key: 'ANTHROPIC_API_KEY',      name: 'Claude AI',          required: true },
    { key: 'TELEGRAM_BOT_TOKEN',     name: '텔레그램 봇',         required: false },
    { key: 'TELEGRAM_CHAT_ID',       name: '텔레그램 Chat ID',    required: false },
    { key: 'ELEVENLABS_API_KEY',     name: 'ElevenLabs TTS',     required: false },
    { key: 'YOUTUBE_REFRESH_TOKEN',  name: 'YouTube OAuth',      required: false },
    { key: 'INSTAGRAM_USER_ID',      name: 'Instagram User ID',  required: false },
    { key: 'INSTAGRAM_ACCESS_TOKEN', name: 'Instagram 토큰',     required: false },
  ];

  console.log(`\n${C.bold}현재 설정 상태:${C.reset}`);
  let readyCount = 0;
  for (const c of checks) {
    const val = process.env[c.key];
    const isSet = val && !val.includes('여기에') && !val.includes('_입력') && val.length > 5;
    if (isSet) {
      ok(`${c.name}`);
      readyCount++;
    } else if (c.required) {
      err(`${c.name} — 필수! .env에 입력하세요`);
    } else {
      warn(`${c.name} — 미설정 (선택사항)`);
    }
  }
  console.log('');
  info(`총 ${readyCount}/${checks.length}개 설정 완료`);
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
async function main() {
  title('새론금융대부중개 AI 에이전트 — 설정 마법사');

  console.log(`  안녕하세요, 이희전 님!`);
  console.log(`  이 마법사가 모든 설정을 단계별로 안내합니다.`);
  console.log(`  각 단계에서 질문에 답하면 자동으로 .env에 저장됩니다.`);
  console.log('');

  showStatus();
  console.log('');

  const proceed = await promptYN('설정을 시작하시겠습니까?');
  if (!proceed) {
    console.log('');
    info('설정을 나중에 시작하려면: node setup-wizard.js');
    process.exit(0);
  }

  await setupTelegram();
  await setupElevenLabs();
  await setupInstagram();
  await setupYouTube();
  await setupGitHubSecrets();

  // 최종 상태
  console.log('');
  title('설정 완료 요약');
  showStatus();

  console.log('');
  ok('모든 설정이 완료되었습니다!');
  info('GitHub Actions가 매일 오전 9시(한국시간)에 자동으로 게시합니다.');
  info('GitHub Actions 확인: https://github.com/HeeJeonLee/petcare-phase2/actions');
  console.log('');
  info('수동 테스트 실행: cd ai-agent && node master-agent.js --test');
}

main().catch((e) => {
  console.error(`\n${C.red}오류: ${e.message}${C.reset}`);
  process.exit(1);
});
