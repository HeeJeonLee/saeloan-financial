/**
 * 새론금융대부중개 — 마스터 AI 에이전트 (완전 자동화)
 * =====================================================
 * 실행 방법: node master-agent.js
 *
 * 자동 실행 흐름:
 *   1. 오늘의 주제 자동 선택 (요일별 카테고리 순환)
 *   2. Claude AI (최신 모델)로 콘텐츠 생성
 *   3. 대부업법 자동 검증 (금지어, 필수고지문 확인)
 *   4. Instagram 자동 게시 (토큰 설정 시)
 *   5. Telegram 완료 알림 (토큰 설정 시)
 *   6. 로컬 파일 백업 (항상)
 *
 * 원칙:
 *   - 홈페이지 ≠ SNS (완전 분리, 절대 불변)
 *   - 대표: 김덕진 · 1555-2137 · 010-5927-9205
 *   - 계정 운영: 이희전 (고객 노출 명의: 김덕진)
 */

'use strict';
require('dotenv').config();

const config           = require('./config');
const ContentGenerator = require('./content-generator');
const LegalChecker     = require('./legal-checker');
const SNSPublisher     = require('./sns-publisher');
const YouTubeAuto      = require('./youtube-auto');
const GoalTracker      = require('./goal-tracker');

class MasterAgent {
  constructor() {
    this.generator = new ContentGenerator();
    this.checker   = new LegalChecker();
    this.publisher = new SNSPublisher();
    this.youtube   = new YouTubeAuto();
    this.tracker   = new GoalTracker();
    this.results   = [];
    this.errors    = [];
  }

  async run() {
    const start   = Date.now();
    const now     = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const options = this._parseArgs(process.argv.slice(2));

    if (options.addExec > 0) {
      const sum = this.tracker.addExecutions(options.addExec, 'manual', options.note || 'manual add');
      const msg = this.tracker.buildStatusMessage();
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'add-exec', summary: sum };
    }

    if (options.addPartner) {
      const report = this.tracker.addPartnerReferral(
        options.addPartner,
        options.count || 1,
        'manual',
        options.note || 'manual partner add'
      );
      const msg = this.tracker.buildPartnerWeeklyMessage(options.days || 7);
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'add-partner', report };
    }

    if (options.addPartnerExec) {
      const report = this.tracker.addPartnerExecution(
        options.addPartnerExec,
        options.count || 1,
        'manual',
        options.note || 'manual partner exec add'
      );
      const msg = this.tracker.buildPartnerPerformanceMessage(options.days || 30);
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'add-partner-exec', report };
    }

    if (options.partnerReportOnly) {
      const msg = this.tracker.buildPartnerWeeklyMessage(options.days || 7);
      const file = this.publisher.saveToFile('partner-weekly-report', dateStr, msg.replace(/<[^>]+>/g, ''));
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'partner-report', file };
    }

    if (options.partnerPerformanceOnly) {
      const msg = this.tracker.buildPartnerPerformanceMessage(options.days || 30);
      const file = this.publisher.saveToFile('partner-performance-report', dateStr, msg.replace(/<[^>]+>/g, ''));
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'partner-performance', file };
    }

    if (options.partnerOutreachOnly) {
      const text = this.tracker.buildPartnerKakaoOutreachPack(options.days || 30);
      const file = this.publisher.saveToFile('partner-kakao-outreach', dateStr, text);
      console.log('\n' + text);
      await this.publisher.notifyTelegram(`<b>📨 파트너 맞춤 카카오 팩</b>\n${text}`);
      return { success: true, mode: 'partner-outreach', file };
    }

    if (options.partnerTodayTopOnly) {
      const text = this.tracker.buildTodayTopPartnersMessage(options.days || 30, options.topLimit || 3);
      const file = this.publisher.saveToFile('partner-today-top', dateStr, text.replace(/<[^>]+>/g, ''));
      console.log('\n' + text.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(text);
      return { success: true, mode: 'partner-today-top', file };
    }

    if (options.toneFeedbackPartner) {
      const report = this.tracker.addToneFeedback(
        options.toneFeedbackPartner,
        options.toneValue,
        options.outcomeValue,
        options.note || 'manual tone feedback'
      );
      const msg = this.tracker.buildToneReportMessage(options.days || 30, options.toneFeedbackPartner);
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'tone-feedback', report };
    }

    if (options.toneReportOnly) {
      const msg = this.tracker.buildToneReportMessage(options.days || 30, options.toneReportPartner || '');
      const file = this.publisher.saveToFile('tone-performance-report', dateStr, msg.replace(/<[^>]+>/g, ''));
      console.log('\n' + msg.replace(/<[^>]+>/g, ''));
      await this.publisher.notifyTelegram(msg);
      return { success: true, mode: 'tone-report', file };
    }

    if (options.planOnly) {
      const plan = this.tracker.buildActionPlan();
      if (options.forceEscalation && plan.riskLevel === 'GREEN') {
        plan.riskLevel = 'YELLOW';
        plan.escalation.enabled = true;
        plan.escalation.mode = 'BOOST';
      }
      const planText = this._buildDailyPlanText(plan, now);
      const file = this.publisher.saveToFile('daily-action-plan', dateStr, planText);
      let escalationFile = null;
      if (plan.escalation && plan.escalation.enabled) {
        escalationFile = this.publisher.saveToFile('escalation-plan', dateStr, this._buildEscalationPack(plan, now));
      }
      console.log('\n' + planText);
      await this.publisher.notifyTelegram(`<b>🗓️ 오늘 실행 플랜</b>\n${planText.replace(/\n/g, '\n')}`);
      return { success: true, mode: 'plan-only', file, escalationFile, plan };
    }

    this._banner(now);
    const recentCats = this.tracker.getRecentCategories(3);
    const plan = this.tracker.buildActionPlan();
    if (options.forceEscalation && plan.riskLevel === 'GREEN') {
      plan.riskLevel = 'YELLOW';
      plan.escalation.enabled = true;
      plan.escalation.mode = 'BOOST';
    }
    console.log(`🎯 오늘 리스크 레벨: ${plan.riskLevel} | 일일 목표 실행: ${plan.dailyExecTarget}건`);

    // 오늘의 주제 선택
    const topic = this.generator.selectTodayTopic(now.getDay(), { excludeCategories: recentCats });
    console.log(`\n📌 오늘의 주제: [${topic.category}] ${topic.topic}`);
    console.log(`🏷️  해시태그: ${(topic.hashtags || topic.tags || []).map(t => '#' + t).join(' ')}\n`);

    // Instagram 콘텐츠 생성 & 게시
    await this._runStep('📸 Instagram 캡션 생성', async () => {
      const data = await this.generator.generateSocialPost(topic, 'instagram');

      // 법규 검증
      const check = this.checker.check(data.content);
      if (!check.pass) {
        throw new Error(`법규 검증 실패: ${check.forbidden.join(', ') || check.missing.join(', ')}`);
      }
      console.log('  ✅ 법규 검증 통과');

      // 파일 백업 (항상)
      const file = this.publisher.saveToFile('instagram', dateStr, data.content);

      // Instagram 게시 (토큰 있을 때만)
      const igResult = await this.publisher.postInstagram(data.content, topic.category);

      // Threads 크로스포스팅 (Instagram 게시 직후 동시 발행)
      const thResult = await this.publisher.postThreads(data.content);

      return { platform: 'instagram', topic: topic.topic, file, igResult, thResult };
    });

    // YouTube Shorts — 완전 자동 생성 & 업로드
    await this._runStep('🎬 YouTube Shorts 자동 생성 & 업로드', async () => {
      const data = await this.generator.generateYoutubeShorts(topic);

      // 법규 검증
      const check = this.checker.check(data.script + ' ' + data.description);
      if (!check.pass) {
        throw new Error(`법규 검증 실패: ${check.forbidden.join(', ') || check.missing.join(', ')}`);
      }
      console.log('  ✅ 법규 검증 통과');

      // YouTube 완전 자동화 (ElevenLabs TTS + FFmpeg + 업로드)
      const ytResult = await this.youtube.run(topic, data, dateStr);

      // YouTube 업로드 실패 또는 토큰 미설정 시 → 텔레그램으로 스크립트 전송 (반자동 폴백)
      if (!ytResult || !ytResult.success) {
        const msg =
          `🎬 <b>YouTube Shorts 스크립트</b>\n` +
          `📅 ${now.toLocaleDateString('ko-KR')} | 주제: ${topic.topic}\n\n` +
          `📋 제목: ${data.title}\n` +
          `🔴 후크: ${data.hook}\n\n` +
          `🎙 스크립트:\n${data.script}\n\n` +
          `📝 자막:\n${data.captions}\n\n` +
          `${ytResult && ytResult.skipped ? '⚙️ YouTube 토큰 설정 후 자동 업로드 활성화됩니다.' : '❌ 업로드 실패 — 수동으로 올려주세요.'}`;
        await this.publisher.notifyTelegram(msg);
      }

      return { platform: 'youtube_shorts', topic: topic.topic, ytResult };
    });

    // Track 2: 부동산 파트너십 실행 지원 템플릿 자동 생성
    await this._runStep('🤝 Track2 파트너십 템플릿 생성', async () => {
      const pack = this._buildPartnerPack(topic, now);
      const file = this.publisher.saveToFile('track2-partner-pack', dateStr, pack);
      return { platform: 'track2', topic: topic.topic, file };
    });

    // Track 3: 카카오 전환 응답 템플릿 자동 생성
    await this._runStep('💬 Track3 카카오 상담 템플릿 생성', async () => {
      const pack = this._buildKakaoPack(topic, now, plan);
      const file = this.publisher.saveToFile('track3-kakao-pack', dateStr, pack);
      return { platform: 'track3', topic: topic.topic, file };
    });

    await this._runStep('🗓️ 일일 실행 플랜 생성', async () => {
      const text = this._buildDailyPlanText(plan, now);
      const file = this.publisher.saveToFile('daily-action-plan', dateStr, text);
      return { platform: 'daily_plan', topic: topic.topic, file };
    });

    await this._runStep('📨 파트너 맞춤 카카오 팩 생성', async () => {
      const text = this.tracker.buildPartnerKakaoOutreachPack(30);
      const file = this.publisher.saveToFile('partner-kakao-outreach', dateStr, text);
      return { platform: 'partner_outreach', topic: topic.topic, file };
    });

    await this._runStep('🎯 오늘 발송 대상 TOP3 생성', async () => {
      const text = this.tracker.buildTodayTopPartnersMessage(30, 3);
      const file = this.publisher.saveToFile('partner-today-top', dateStr, text.replace(/<[^>]+>/g, ''));
      return { platform: 'partner_today_top', topic: topic.topic, file };
    });

    if (plan.escalation && plan.escalation.enabled) {
      await this._runStep('🚨 리스크 강화 플랜 생성', async () => {
        const text = this._buildEscalationPack(plan, now);
        const file = this.publisher.saveToFile('escalation-plan', dateStr, text);
        return { platform: 'escalation_plan', topic: topic.topic, file };
      });
    }

    // 완료 Telegram 알림
    const elapsed   = ((Date.now() - start) / 1000).toFixed(1);
    const igPosted  = this.results.some(r => r.igResult  && r.igResult.success);
    const thPosted  = this.results.some(r => r.thResult  && r.thResult.success);
    const ytPosted  = this.results.some(r => r.ytResult  && r.ytResult.success);

    this.tracker.recordRun({
      topicCategory: topic.category,
      topic: topic.topic,
      postedInstagram: igPosted,
      postedThreads: thPosted,
      postedYoutube: ytPosted,
      track2ActionPrepared: this.results.some(r => r.platform === 'track2' && r.file),
      track3ActionPrepared: this.results.some(r => r.platform === 'track3' && r.file),
    });

    const goalStatus = this.tracker.buildStatusMessage();

    await this.publisher.notifyTelegram(
      `<b>✅ 새론금융 AI 에이전트 완료</b>\n` +
      `📅 ${now.toLocaleDateString('ko-KR')}\n` +
      `📌 주제: ${topic.topic}\n` +
      `📸 Instagram: ${igPosted ? '게시 완료 ✅' : '파일 저장 (토큰 미설정)'}\n` +
      `🔁 Threads: ${thPosted ? '크로스포스팅 ✅' : '건너뜀 (토큰 미설정)'}\n` +
      `🎬 YouTube Shorts: ${ytPosted ? '업로드 완료 ✅' : '스크립트 전송 (토큰 미설정)'}\n` +
      `🤝 Track2 템플릿: 생성 완료\n` +
      `💬 Track3 템플릿: 생성 완료\n` +
      `🗓️ 오늘 실행 플랜: 생성 완료\n` +
      `📨 파트너 카카오 팩: 생성 완료\n` +
      `🎯 오늘 발송 대상 TOP3: 생성 완료\n` +
      `${plan.escalation && plan.escalation.enabled ? '🚨 리스크 강화 플랜: 생성 완료\n' : ''}` +
      `⏱️ 소요: ${elapsed}초\n\n` +
      goalStatus
    );

    // 로그 저장
    this.publisher.saveToLog(this.results);

    // 최종 보고
    console.log('\n' + '═'.repeat(54));
    console.log(`✅ 완료! (${elapsed}초 소요)`);
    console.log(`📁 백업: ./generated/instagram/`);
    console.log(`📁 백업: ./generated/youtube-shorts/`);
    if (!igPosted) {
      console.log('\n💡 Instagram/Threads 활성화:');
      console.log('   INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN, OG_IMAGE_BASE_URL');
    }
    if (!ytPosted) {
      console.log('\n💡 YouTube 완전 자동화 활성화:');
      console.log('   ELEVENLABS_API_KEY, YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN');
    }
    console.log('\n📊 실행건수 페이스:');
    console.log(goalStatus.replace(/<[^>]+>/g, ''));
    console.log('═'.repeat(54) + '\n');

    return { success: this.errors.length === 0, results: this.results, errors: this.errors };
  }

  async _runStep(name, fn) {
    console.log(`\n${name}...`);
    try {
      const result = await fn();
      this.results.push({ name, ...result });
    } catch (err) {
      console.error(`  ❌ 실패: ${err.message}`);
      this.errors.push({ name, error: err.message });
      this.results.push({ name, error: err.message });
    }
  }

  _banner(now) {
    console.log('\n' + '═'.repeat(54));
    console.log('🤖 새론금융대부중개 AI 자동화 에이전트');
    console.log(`📅 ${now.toLocaleString('ko-KR')}`);
    console.log(`🧠 AI 모델: ${config.ai.model}`);
    console.log(`📌 대표: 김덕진 · 1555-2137 · 010-5927-9205`);
    console.log(`🔒 홈페이지 ≠ SNS (완전 분리, 절대 불변)`);
    console.log('═'.repeat(54));
  }

  _parseArgs(argv) {
    const out = {
      addExec: 0,
      note: '',
      planOnly: false,
      forceEscalation: false,
      addPartner: '',
      addPartnerExec: '',
      count: 1,
      days: 7,
      partnerReportOnly: false,
      partnerPerformanceOnly: false,
      partnerOutreachOnly: false,
      partnerTodayTopOnly: false,
      topLimit: 3,
      toneFeedbackPartner: '',
      toneValue: 'formal',
      outcomeValue: 'no',
      toneReportOnly: false,
      toneReportPartner: '',
    };
    argv.forEach(arg => {
      if (arg.startsWith('--add-exec=')) {
        out.addExec = Number(arg.split('=')[1]) || 0;
      }
      if (arg.startsWith('--note=')) {
        out.note = arg.split('=').slice(1).join('=');
      }
      if (arg.startsWith('--add-partner=')) {
        out.addPartner = arg.split('=').slice(1).join('=').trim();
      }
      if (arg.startsWith('--add-partner-exec=')) {
        out.addPartnerExec = arg.split('=').slice(1).join('=').trim();
      }
      if (arg.startsWith('--count=')) {
        out.count = Number(arg.split('=')[1]) || 1;
      }
      if (arg.startsWith('--days=')) {
        out.days = Number(arg.split('=')[1]) || 7;
      }
      if (arg.startsWith('--top-limit=')) {
        out.topLimit = Number(arg.split('=')[1]) || 3;
      }
      if (arg.startsWith('--tone-feedback=')) {
        out.toneFeedbackPartner = arg.split('=').slice(1).join('=').trim();
      }
      if (arg.startsWith('--tone=')) {
        out.toneValue = arg.split('=')[1] || 'formal';
      }
      if (arg.startsWith('--outcome=')) {
        out.outcomeValue = arg.split('=')[1] || 'no';
      }
      if (arg.startsWith('--tone-partner=')) {
        out.toneReportPartner = arg.split('=').slice(1).join('=').trim();
      }
      if (arg === '--plan-only') {
        out.planOnly = true;
      }
      if (arg === '--force-escalation') {
        out.forceEscalation = true;
      }
      if (arg === '--partner-report') {
        out.partnerReportOnly = true;
      }
      if (arg === '--partner-performance') {
        out.partnerPerformanceOnly = true;
      }
      if (arg === '--partner-outreach') {
        out.partnerOutreachOnly = true;
      }
      if (arg === '--partner-today-top') {
        out.partnerTodayTopOnly = true;
      }
      if (arg === '--tone-report') {
        out.toneReportOnly = true;
      }
    });
    return out;
  }

  _buildPartnerPack(topic, now) {
    const dateK = now.toLocaleDateString('ko-KR');
    return [
      '=== 부동산 파트너십 제안 메시지 (Track 2) ===',
      `생성일: ${dateK}`,
      `오늘 주제: [${topic.category}] ${topic.topic}`,
      '',
      '[카카오 1:1 첫 제안]',
      '안녕하세요, 새론금융대부중개 김덕진 대표입니다.',
      '서울/수도권 아파트담보대출 상담을 전문으로 하고 있으며,',
      '은행 한도 초과·DSR 이슈 고객의 대안 설계를 도와드리고 있습니다.',
      '거래 중 자금 이슈 고객이 있으시면 신속하게 피드백 드리겠습니다.',
      '등록번호: 2026-수원-2324 | 홈페이지: saeloan.co.kr',
      '',
      '[후속 팔로업 (3일 후)]',
      '안녕하세요 대표님, 지난번 안내드린 아파트담보 상담 건 관련해 다시 인사드립니다.',
      '급한 잔금/보증금 반환/사업자 담보 이슈 고객은 우선순위로 대응 가능합니다.',
      '필요 시 케이스 요약만 보내주셔도 빠르게 가능여부 안내드리겠습니다.',
      '',
      '[운영 원칙]',
      '- 리베이트/수수료 제안 금지 (법규 준수)',
      '- 무리한 확약 표현 금지',
      '- 모든 상담은 홈페이지/대표번호로 일원화',
      '- 대외 명의는 김덕진 대표로만 유지',
    ].join('\n');
  }

  _buildKakaoPack(topic, now, plan) {
    const dateK = now.toLocaleDateString('ko-KR');
    return [
      '=== 카카오 상담 전환 템플릿 (Track 3) ===',
      `생성일: ${dateK}`,
      `오늘 주제: [${topic.category}] ${topic.topic}`,
      `일일 목표 실행: ${plan.dailyExecTarget}건 | 리스크: ${plan.riskLevel}`,
      '',
      '[자동응답 기본]',
      '안녕하세요. 새론금융대부중개입니다.',
      '아파트담보대출 무료 상담 도와드립니다.',
      '무료 한도 확인: saeloan.co.kr',
      '전화 상담: 1555-2137',
      '',
      '[키워드 분기: "한도"]',
      '보유 아파트 주소(구/동)와 기존 대출금만 알려주시면 한도 방향을 빠르게 안내드리겠습니다.',
      '',
      '[키워드 분기: "금리"]',
      '고객 상황별로 금리 구간이 달라 정확한 심사는 필요하지만, 가능한 범위를 먼저 설명드리겠습니다.',
      '',
      '[키워드 분기: "조건"/"가능"]',
      '소득형태(급여/사업/임대), 기존대출, 자금용도 기준으로 가능여부를 확인해드립니다.',
      '',
      '[키워드 분기: "거절"]',
      '은행 거절 사유(DSR/소득/기존대출)를 기준으로 대안 경로를 다시 설계해드립니다.',
      '',
      '[은행 거절 고객 응답]',
      '은행 심사에서 거절되신 경우에도 담보 조건에 따라 가능한 대안이 있습니다.',
      '현재 보유 아파트 위치/시세/기존대출만 알려주시면 빠르게 방향 안내드리겠습니다.',
      '',
      '[전세퇴거자금 응답]',
      '보증금 반환 일정이 촉박한 경우 우선순위로 검토해드립니다.',
      '가능여부는 케이스마다 달라서 기본 정보 확인 후 신속히 안내드리겠습니다.',
      '',
      '[법정 고지 요약]',
      '새론금융대부중개 | 등록번호 2026-수원-2324',
      '연이자율 6.9%~19.9% (법정최고 연20%)',
      '중개수수료 없음 | 과도한 빚은 큰 불행을 안겨줄 수 있습니다.',
    ].join('\n');
  }

  _buildDailyPlanText(plan, now) {
    const dateK = now.toLocaleDateString('ko-KR');
    return [
      '=== 오늘 실행 플랜 (목표 달성형) ===',
      `기준일: ${dateK}`,
      `리스크 레벨: ${plan.riskLevel}`,
      `일일 목표 실행건수: ${plan.dailyExecTarget}건`,
      '',
      '[주간 실행 목표]',
      `- 유튜브 쇼츠: 주 ${plan.weeklyTargets.youtube}회`,
      `- 인스타 릴스/포스트: 주 ${plan.weeklyTargets.instagram}회`,
      `- 파트너 접촉: 주 ${plan.weeklyTargets.partnerTouches}건`,
      `- 강화모드: ${plan.escalation.enabled ? plan.escalation.mode : 'OFF'}`,
      '',
      '[오늘 체크리스트]',
      ...plan.todayChecklist.map(x => `- ${x}`),
    ].join('\n');
  }

  _buildEscalationPack(plan, now) {
    const dateK = now.toLocaleDateString('ko-KR');
    return [
      '=== 리스크 강화 플랜 ===',
      `기준일: ${dateK}`,
      `리스크 레벨: ${plan.riskLevel}`,
      `강화 모드: ${plan.escalation.mode}`,
      '',
      '[오늘 즉시 실행]',
      `- 공인중개사 접촉 ${plan.escalation.partnerTouchesPerDay}건 (오전/오후 분할)`,
      `- 카카오 재접촉 ${plan.escalation.kakaoFollowUpsPerDay}건`,
      `- 유입 응답 SLA ${plan.escalation.responseSlaMinutes}분 준수`,
      `- 쇼츠/릴스 추가 발행 1회`,
      '',
      '[운영 기준]',
      '- 확약/과장 문구 금지',
      '- 대외 명의는 김덕진 대표로 고정',
      '- CTA는 saeloan.co.kr 단일 링크 유지',
    ].join('\n');
  }
}

// 직접 실행
if (require.main === module) {
  new MasterAgent()
    .run()
    .then(r => process.exit(r.success ? 0 : 1))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = MasterAgent;
