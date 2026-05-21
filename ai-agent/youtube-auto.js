/**
 * 새론금융대부중개 — YouTube Shorts 완전 자동화
 * =====================================================
 * 흐름:
 *   1. ElevenLabs TTS → 한국어 음성 MP3 생성
 *   2. FFmpeg → 세로 영상(1080x1920) + 자막 + 음성 합성
 *   3. YouTube Data API v3 → Shorts 자동 업로드
 *
 * 비용: ElevenLabs $5/월 (월 30,000자 — 영상 60개 이상 가능)
 * YouTube API: 무료 (일 6회 업로드 한도, 충분함)
 *
 * 환경 변수 필요:
 *   ELEVENLABS_API_KEY      — ElevenLabs 계정 API 키
 *   ELEVENLABS_VOICE_ID     — 한국어 목소리 ID (기본값 내장)
 *   YOUTUBE_CLIENT_ID       — Google Cloud Console OAuth 클라이언트 ID
 *   YOUTUBE_CLIENT_SECRET   — Google Cloud Console OAuth 클라이언트 시크릿
 *   YOUTUBE_REFRESH_TOKEN   — 1회 인증 후 발급되는 refresh token
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');
const { execSync } = require('child_process');

// 한국어 여성 목소리 (ElevenLabs 기본 한국어 목소리)
const DEFAULT_KO_VOICE = 'XB0fDUnXU5powFXDhCwa'; // Charlotte (multilingual, Korean 자연스러움)

class YouTubeAuto {
  constructor() {
    this.elKey     = process.env.ELEVENLABS_API_KEY;
    this.elVoice   = process.env.ELEVENLABS_VOICE_ID || DEFAULT_KO_VOICE;
    this.ytClientId     = process.env.YOUTUBE_CLIENT_ID;
    this.ytClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    this.ytRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  }

  get isTTSReady()    { return !!this.elKey; }
  get isUploadReady() { return !!(this.ytClientId && this.ytClientSecret && this.ytRefreshToken); }

  // ─── 1단계: ElevenLabs TTS → MP3 ──────────────────

  async generateAudio(script, outputPath) {
    if (!this.isTTSReady) throw new Error('ELEVENLABS_API_KEY 미설정');

    const body = JSON.stringify({
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3 },
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${this.elVoice}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key':   this.elKey,
          'Accept':       'audio/mpeg',
        },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          let err = '';
          res.on('data', d => err += d);
          res.on('end',  () => reject(new Error(`ElevenLabs 오류 ${res.statusCode}: ${err}`)));
          return;
        }
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
          console.log(`  🎙 TTS 음성 생성 완료: ${path.basename(outputPath)}`);
          resolve(outputPath);
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ─── 2단계: 자막 파일(.ass) 생성 ─────────────────

  _buildAssSubtitles(hook, captionsRaw, audioDurationSec = 50) {
    // captions 파싱 (각 줄이 하나의 자막)
    const lines = captionsRaw
      .split('\n')
      .map(l => l.replace(/^[-•·\s]+/, '').trim())
      .filter(l => l.length > 0);

    // 후크(0~5초)는 상단 고정, 나머지 자막은 균등 분배
    const segDur = Math.floor((audioDurationSec - 5) / Math.max(lines.length, 1));

    const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,NanumGothic,72,&H00FFFF00,&H000000FF,&H00000000,&H80000000,-1,0,1,3,0,8,60,60,120,1
Style: Caption,NanumGothic,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,1,3,0,5,80,80,960,1
Style: Legal,NanumGothic,36,&H00AAAAAA,&H000000FF,&H00000000,&H00000000,0,0,1,2,0,2,60,60,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const toTime = (sec) => {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      const cs = Math.floor((sec % 1) * 100);
      return `${String(h).padStart(1,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
    };

    let events = '';
    // 후크 — 화면 상단 고정 (전체 재생 시간)
    if (hook) {
      events += `Dialogue: 0,${toTime(0)},${toTime(audioDurationSec)},Hook,,0,0,0,,${hook}\n`;
    }
    // 자막 — 화면 중앙, 순서대로 표시
    lines.forEach((line, i) => {
      const start = 5 + i * segDur;
      const end   = start + segDur - 0.5;
      events += `Dialogue: 0,${toTime(start)},${toTime(end)},Caption,,0,0,0,,${line}\n`;
    });
    // 법정 고지 — 마지막 8초, 하단
    const legalStart = Math.max(0, audioDurationSec - 8);
    events += `Dialogue: 0,${toTime(legalStart)},${toTime(audioDurationSec)},Legal,,0,0,0,,새론금융대부중개 | 등록번호: 2026-수원-2324 | 최고금리: 연20% 이내\n`;

    return header + events;
  }

  // ─── 3단계: FFmpeg → 세로 Shorts 영상(MP4) ────────

  async createVideo(audioPath, hook, captionsRaw, outputPath, tempDir) {
    // 음성 길이 확인
    let audioDuration = 50;
    try {
      const probe = execSync(
        `ffprobe -v quiet -print_format json -show_streams "${audioPath}"`,
        { encoding: 'utf-8' }
      );
      const info = JSON.parse(probe);
      const stream = info.streams.find(s => s.duration);
      if (stream) audioDuration = parseFloat(stream.duration) + 2;
    } catch (_) {}

    // 자막 파일 저장
    const assPath = path.join(tempDir, 'captions.ass');
    const assContent = this._buildAssSubtitles(hook, captionsRaw, audioDuration);
    fs.writeFileSync(assPath, assContent, 'utf-8');

    // FFmpeg 명령 실행 (세로 영상 1080x1920 = YouTube Shorts 규격)
    // 배경: 진한 남색 그라데이션 효과 (lavfi)
    const ffmpegCmd = [
      'ffmpeg -y',
      `-f lavfi -i "color=c=#0d1b2a:size=1080x1920:rate=30"`,
      `-i "${audioPath}"`,
      `-vf "subtitles='${assPath.replace(/\\/g, '/').replace(/:/g, '\\:')}'"`,
      `-c:v libx264 -preset fast -crf 23`,
      `-c:a aac -b:a 128k`,
      `-t ${audioDuration}`,
      `-movflags +faststart`,
      `"${outputPath}"`,
    ].join(' ');

    console.log('  🎬 FFmpeg 영상 생성 중...');
    execSync(ffmpegCmd, { stdio: 'pipe' });
    console.log(`  ✅ 영상 생성 완료: ${path.basename(outputPath)}`);
    return outputPath;
  }

  // ─── 4단계: YouTube OAuth 토큰 갱신 ──────────────

  async _getAccessToken() {
    return new Promise((resolve, reject) => {
      const body = new URLSearchParams({
        client_id:     this.ytClientId,
        client_secret: this.ytClientSecret,
        refresh_token: this.ytRefreshToken,
        grant_type:    'refresh_token',
      }).toString();

      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path:     '/token',
        method:   'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          const json = JSON.parse(data);
          if (json.access_token) resolve(json.access_token);
          else reject(new Error('YouTube 토큰 갱신 실패: ' + data));
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ─── 5단계: YouTube Shorts 업로드 ─────────────────

  async uploadToYouTube(videoPath, title, description, tags = []) {
    if (!this.isUploadReady) {
      console.log('  ⏭️  YouTube 토큰 미설정 → 파일 저장만 실행');
      return { skipped: true };
    }

    const accessToken = await this._getAccessToken();
    const videoData   = fs.readFileSync(videoPath);
    const fileSize    = videoData.length;

    // 1단계: 업로드 세션 URL 확보 (resumable upload)
    const metadata = JSON.stringify({
      snippet: {
        title:       title.slice(0, 100),
        description: description,
        tags:        [...tags, '대부중개', '아파트담보대출', '수원', '새론금융대부중개'],
        categoryId:  '22',  // People & Blogs
      },
      status: {
        privacyStatus:        'public',
        selfDeclaredMadeForKids: false,
      },
    });

    const uploadUrl = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'www.googleapis.com',
        path:     '/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        method:   'POST',
        headers: {
          'Authorization':   `Bearer ${accessToken}`,
          'Content-Type':    'application/json',
          'X-Upload-Content-Type': 'video/mp4',
          'X-Upload-Content-Length': String(fileSize),
        },
      }, (res) => {
        if (res.statusCode === 200) resolve(res.headers.location);
        else {
          let err = '';
          res.on('data', d => err += d);
          res.on('end', () => reject(new Error(`업로드 세션 실패(${res.statusCode}): ${err}`)));
        }
      });
      req.on('error', reject);
      req.write(metadata);
      req.end();
    });

    // 2단계: 실제 영상 데이터 업로드
    const result = await new Promise((resolve, reject) => {
      const parsedUrl = new URL(uploadUrl);
      const reqOptions = {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.pathname + parsedUrl.search,
        method:   'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'video/mp4',
          'Content-Length': String(fileSize),
        },
      };
      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
          const json = JSON.parse(data || '{}');
          if (json.id) resolve(json);
          else reject(new Error(`업로드 실패: ${data}`));
        });
      });
      req.on('error', reject);
      req.write(videoData);
      req.end();
    });

    console.log(`  ✅ YouTube 업로드 완료! https://youtu.be/${result.id}`);
    return { success: true, videoId: result.id, url: `https://youtu.be/${result.id}` };
  }

  // ─── 전체 실행 (TTS → 영상 → 업로드) ─────────────

  async run(topic, shortsData, dateStr) {
    const tempDir = path.join(__dirname, 'generated', 'youtube-shorts');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const audioPath  = path.join(tempDir, `${dateStr}_audio.mp3`);
    const videoPath  = path.join(tempDir, `${dateStr}_shorts.mp4`);

    // TTS 음성 생성
    if (!this.isTTSReady) {
      console.log('  ⏭️  ELEVENLABS_API_KEY 미설정 → YouTube 건너뜀');
      return { skipped: true, reason: 'no_tts_key' };
    }

    await this.generateAudio(shortsData.script, audioPath);

    // 영상 생성 (FFmpeg)
    await this.createVideo(
      audioPath,
      shortsData.hook,
      shortsData.captions,
      videoPath,
      tempDir
    );

    // YouTube 업로드
    const result = await this.uploadToYouTube(
      videoPath,
      shortsData.title,
      shortsData.description,
      (topic.hashtags || topic.tags || [])
    );

    return result;
  }
}

module.exports = YouTubeAuto;
