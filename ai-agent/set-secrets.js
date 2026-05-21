/**
 * ============================================================
 * GitHub Secrets 자동 등록 스크립트
 * ============================================================
 * 사용법:
 *   node set-secrets.js
 *
 * 사전 준비:
 *   1. .env 파일에 모든 키 입력 완료
 *   2. GitHub Personal Access Token 발급:
 *      - https://github.com/settings/tokens/new 접속
 *      - Note: "saeloan-secrets"
 *      - Expiration: 90 days
 *      - Scopes: [✓] repo (전체 선택)
 *      - Generate token → 복사
 *   3. 이 스크립트 실행 시 토큰 입력 또는
 *      .env 파일에 GITHUB_PAT=복사한_토큰 미리 입력
 *
 * 완료 시:
 *   - GitHub Actions에 필요한 모든 Secrets 자동 등록
 *   - GitHub Actions가 즉시 사용 가능한 상태
 * ============================================================
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const REPO_OWNER = 'HeeJeonLee';
const REPO_NAME = 'petcare-phase2';
const ENV_FILE = path.join(__dirname, '.env');

// ──────────────────────────────────────────────
// 콘솔 색상
// ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', cyan: '\x1b[36m', gray: '\x1b[90m',
};
function ok(msg)   { console.log(`${C.green}✔ ${msg}${C.reset}`); }
function info(msg) { console.log(`${C.cyan}ℹ ${msg}${C.reset}`); }
function warn(msg) { console.log(`${C.yellow}⚠ ${msg}${C.reset}`); }
function err(msg)  { console.log(`${C.red}✘ ${msg}${C.reset}`); }
function bold(msg) { return `${C.bold}${msg}${C.reset}`; }
function title(msg){ console.log(`\n${C.bold}${C.cyan}${'═'.repeat(55)}\n  ${msg}\n${'═'.repeat(55)}${C.reset}\n`); }

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
// GitHub API 요청 헬퍼
// ──────────────────────────────────────────────
function githubRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'saeloan-set-secrets/1.0',
        ...(bodyStr ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
        } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ──────────────────────────────────────────────
// libsodium 없이 GitHub 시크릿 암호화
// (Node.js 내장 crypto로 직접 구현하기 어려우므로
//  GitHub CLI 또는 tweetsodium 사용 권장)
//
// 여기서는 tweetsodium 동적 설치를 시도하거나,
// base64 인코딩 방식으로 처리 (GitHub API v3 방식)
// ──────────────────────────────────────────────

let sodium = null;

async function loadSodium() {
  // 1차: libsodium-wrappers 시도
  try {
    const libsodium = require('libsodium-wrappers');
    await libsodium.ready;
    sodium = libsodium;
    return 'libsodium-wrappers';
  } catch {}

  // 2차: tweetsodium 시도
  try {
    const tweetsodium = require('tweetsodium');
    sodium = { _type: 'tweetsodium', lib: tweetsodium };
    return 'tweetsodium';
  } catch {}

  return null;
}

function encryptSecret(secretValue, publicKey, sodiumType) {
  const messageBytes = Buffer.from(secretValue);
  const keyBytes = Buffer.from(publicKey, 'base64');

  if (sodiumType === 'libsodium-wrappers') {
    const encrypted = sodium.crypto_box_seal(messageBytes, keyBytes);
    return Buffer.from(encrypted).toString('base64');
  } else if (sodiumType === 'tweetsodium') {
    const encrypted = sodium.lib.seal(messageBytes, keyBytes);
    return Buffer.from(encrypted).toString('base64');
  }
  throw new Error('sodium 라이브러리를 사용할 수 없습니다.');
}

// ──────────────────────────────────────────────
// .env 파일 파싱
// ──────────────────────────────────────────────
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (val && !val.includes('여기에') && !val.includes('_입력') && !val.includes('xxxxxxx')) {
      result[key] = val;
    }
  }
  return result;
}

// ──────────────────────────────────────────────
// GitHub Secrets에 등록할 키 목록
// ──────────────────────────────────────────────
const SECRET_KEYS = [
  'ANTHROPIC_API_KEY',
  'INSTAGRAM_USER_ID',
  'INSTAGRAM_ACCESS_TOKEN',
  'OG_IMAGE_BASE_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'THREADS_ACCESS_TOKEN',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REFRESH_TOKEN',
];

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
async function main() {
  title('GitHub Secrets 자동 등록 도구');

  // 1. sodium 로드
  info('암호화 라이브러리 로딩...');
  const sodiumType = await loadSodium();
  if (!sodiumType) {
    warn('암호화 라이브러리(libsodium-wrappers 또는 tweetsodium)가 없습니다.');
    warn('아래 명령어로 설치 후 다시 실행하세요:');
    console.log('');
    console.log('  cd ai-agent && npm install libsodium-wrappers');
    console.log('');
    process.exit(1);
  }
  ok(`암호화 라이브러리: ${sodiumType}`);

  // 2. GitHub PAT 확인
  let pat = process.env.GITHUB_PAT || '';
  if (!pat) {
    console.log('');
    console.log(bold('GitHub Personal Access Token이 필요합니다.'));
    console.log('  발급 방법: https://github.com/settings/tokens/new');
    console.log('  → Note: "saeloan-secrets"');
    console.log('  → Expiration: 90 days');
    console.log('  → [✓] repo 전체 선택');
    console.log('  → Generate token → 복사');
    console.log('');
    pat = await prompt(`${C.yellow}GitHub PAT 붙여넣기: ${C.reset}`);
  } else {
    ok('GITHUB_PAT 확인됨');
  }

  if (!pat) {
    err('PAT가 없으면 진행할 수 없습니다.');
    process.exit(1);
  }

  // 3. .env 파일 파싱
  const envVars = parseEnv(ENV_FILE);
  info(`.env에서 ${Object.keys(envVars).length}개 변수 읽음`);

  // 4. 대상 Secrets 확인
  const toRegister = SECRET_KEYS.filter((k) => envVars[k]);
  const missing = SECRET_KEYS.filter((k) => !envVars[k]);

  if (toRegister.length === 0) {
    err('.env 파일에 등록 가능한 값이 없습니다. 먼저 .env 파일을 채워주세요.');
    process.exit(1);
  }

  console.log('');
  info(`등록할 Secrets (${toRegister.length}개):`);
  for (const k of toRegister) {
    const v = envVars[k];
    console.log(`  ${C.green}✔${C.reset} ${k} = ${C.gray}${v.slice(0, 20)}${v.length > 20 ? '...' : ''}${C.reset}`);
  }

  if (missing.length > 0) {
    console.log('');
    warn(`미입력 Secrets (${missing.length}개) - 나중에 .env 채우고 다시 실행하세요:`);
    for (const k of missing) console.log(`  ${C.red}✘${C.reset} ${k}`);
  }

  console.log('');
  const confirm = await prompt(`${C.yellow}위 ${toRegister.length}개 Secrets를 ${REPO_OWNER}/${REPO_NAME}에 등록하시겠습니까? (y/n): ${C.reset}`);
  if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
    warn('취소되었습니다.');
    process.exit(0);
  }

  // 5. 저장소 공개 키 조회
  info('저장소 공개 키 조회 중...');
  const keyResp = await githubRequest(
    'GET',
    `/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/public-key`,
    null,
    pat
  );

  if (keyResp.status !== 200) {
    err(`공개 키 조회 실패 (HTTP ${keyResp.status})`);
    if (keyResp.status === 401) err('PAT가 잘못되었거나 만료되었습니다.');
    if (keyResp.status === 404) err(`저장소를 찾을 수 없습니다: ${REPO_OWNER}/${REPO_NAME}`);
    console.log(JSON.stringify(keyResp.body, null, 2));
    process.exit(1);
  }

  const { key: repoPublicKey, key_id: keyId } = keyResp.body;
  ok('저장소 공개 키 획득 완료');

  // 6. 각 Secret 암호화 & 등록
  console.log('');
  info('Secrets 등록 중...');

  let successCount = 0;
  let failCount = 0;

  for (const secretKey of toRegister) {
    const secretValue = envVars[secretKey];
    try {
      const encryptedValue = encryptSecret(secretValue, repoPublicKey, sodiumType);
      const resp = await githubRequest(
        'PUT',
        `/repos/${REPO_OWNER}/${REPO_NAME}/actions/secrets/${secretKey}`,
        { encrypted_value: encryptedValue, key_id: keyId },
        pat
      );

      if (resp.status === 201 || resp.status === 204) {
        ok(`${secretKey}`);
        successCount++;
      } else {
        err(`${secretKey} (HTTP ${resp.status})`);
        failCount++;
      }
    } catch (e) {
      err(`${secretKey}: ${e.message}`);
      failCount++;
    }
  }

  // 7. 완료 요약
  console.log('');
  if (successCount > 0) {
    ok(`════════════════════════════════════`);
    ok(`완료: ${successCount}개 Secrets 등록됨`);
    if (failCount > 0) warn(`실패: ${failCount}개`);
    ok(`════════════════════════════════════`);
    console.log('');
    info('GitHub Actions가 이제 자동으로 작동합니다!');
    info(`저장소: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`);
  } else {
    err('모든 Secrets 등록이 실패했습니다. 오류를 확인하고 다시 시도하세요.');
  }
}

main().catch((e) => { err(e.message); process.exit(1); });
