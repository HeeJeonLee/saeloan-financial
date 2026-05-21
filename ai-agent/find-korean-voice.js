/**
 * ElevenLabs 한국어 음성 확인 스크립트
 * 사용법: node find-korean-voice.js
 * (ELEVENLABS_API_KEY가 .env에 있어야 합니다)
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey || apiKey.includes('여기에')) {
  console.error('ELEVENLABS_API_KEY를 먼저 .env에 입력하세요.');
  process.exit(1);
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const reqOptions = {
      hostname: options.hostname,
      path: options.pathname + options.search,
      method: 'GET',
      headers: { 'xi-api-key': apiKey, ...headers },
    };
    https.get(reqOptions, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n🔍 ElevenLabs 한국어 음성 목록 조회 중...\n');

  // 내 보이스 목록
  const myVoices = await httpsGet('https://api.elevenlabs.io/v1/voices');

  if (myVoices && myVoices.voices) {
    // 한국어 지원 음성 필터
    const korean = myVoices.voices.filter(v =>
      (v.labels && (v.labels.language === 'Korean' || v.labels.language === 'ko')) ||
      v.name.toLowerCase().includes('korean') ||
      v.name.toLowerCase().includes('korea')
    );

    if (korean.length > 0) {
      console.log('✔ 한국어 전용 음성:');
      korean.forEach(v => {
        console.log(`  ID: ${v.voice_id}`);
        console.log(`  이름: ${v.name}`);
        console.log(`  설명: ${v.description || '없음'}`);
        console.log('');
      });
    }

    // 다국어 모델 지원 음성 (한국어도 됨)
    const multilingual = myVoices.voices.filter(v =>
      v.high_quality_base_model_ids && (
        v.high_quality_base_model_ids.includes('eleven_multilingual_v2') ||
        v.high_quality_base_model_ids.includes('eleven_turbo_v2_5')
      )
    ).slice(0, 10);

    console.log('✔ 다국어(한국어 포함) 지원 음성 (상위 10개):');
    multilingual.forEach(v => {
      const isCurrent = v.voice_id === 'XB0fDUnXU5powFXDhCwa';
      console.log(`  ${isCurrent ? '★ [현재 사용 중] ' : ''}ID: ${v.voice_id}`);
      console.log(`  이름: ${v.name} | 성별: ${v.labels?.gender || '?'} | 나이: ${v.labels?.age || '?'}`);
      console.log('');
    });

    // 현재 사용 중인 음성 정보
    const current = myVoices.voices.find(v => v.voice_id === 'XB0fDUnXU5powFXDhCwa');
    if (current) {
      console.log('✔ 현재 설정된 음성 (Charlotte):');
      console.log(`  ID: ${current.voice_id}`);
      console.log(`  이름: ${current.name}`);
      console.log(`  카테고리: ${current.category}`);
      console.log(`  모델: ${(current.high_quality_base_model_ids || []).join(', ')}`);
      console.log('');
      console.log('  → Charlotte는 eleven_multilingual_v2 모델로 한국어 자연스럽게 지원됩니다.');
      console.log('  → 변경 필요 없음.');
    } else {
      console.log('⚠ 현재 설정된 음성(Charlotte, XB0fDUnXU5powFXDhCwa)을 찾을 수 없습니다.');
      console.log('  위 목록에서 원하는 음성 ID를 .env의 ELEVENLABS_VOICE_ID에 입력하세요.');
    }
  } else {
    console.error('음성 목록 조회 실패:', myVoices);
  }

  // 계정 사용량 확인
  console.log('\n📊 ElevenLabs 계정 사용량:');
  const user = await httpsGet('https://api.elevenlabs.io/v1/user');
  if (user && user.subscription) {
    const sub = user.subscription;
    const used = sub.character_count || 0;
    const limit = sub.character_limit || 0;
    const plan = sub.tier || 'free';
    console.log(`  플랜: ${plan}`);
    console.log(`  사용: ${used.toLocaleString()} / ${limit.toLocaleString()} 자`);
    console.log(`  남은 문자: ${(limit - used).toLocaleString()} 자`);
    console.log('');
    const dailyChars = 250; // 스크립트 약 250자
    const remainingDays = Math.floor((limit - used) / dailyChars);
    console.log(`  예상 남은 YouTube Shorts 생성 가능 일수: ${remainingDays}일`);
  }
}

main().catch(e => { console.error('오류:', e.message); process.exit(1); });
