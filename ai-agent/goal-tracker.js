'use strict';

const fs = require('fs');
const path = require('path');

class GoalTracker {
  constructor() {
    this.baseDir = path.join('.', 'generated', 'metrics');
    this.filePath = path.join(this.baseDir, 'goals.json');
    this.state = this._load();
  }

  _load() {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      } catch (_) {
        // fall through to default state
      }
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const initial = {
      startDate,
      goals: {
        target3m: 50,
        target6m: 150,
      },
      actualExecutions: 0,
      runLogs: [],
      executionLogs: [],
      partnerReferrals: [],
      partnerExecutions: [],
      toneLogs: [],
      toneHotLocks: [],
      updatedAt: new Date().toISOString(),
    };
    this._save(initial);
    return initial;
  }

  _save(nextState) {
    nextState.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.filePath, JSON.stringify(nextState, null, 2), 'utf8');
    this.state = nextState;
  }

  recordRun(run) {
    const next = { ...this.state };
    next.runLogs = next.runLogs || [];

    next.runLogs.push({
      timestamp: new Date().toISOString(),
      topicCategory: run.topicCategory || 'unknown',
      topic: run.topic || '',
      postedInstagram: !!run.postedInstagram,
      postedThreads: !!run.postedThreads,
      postedYoutube: !!run.postedYoutube,
      track2ActionPrepared: !!run.track2ActionPrepared,
      track3ActionPrepared: !!run.track3ActionPrepared,
    });

    if (next.runLogs.length > 500) {
      next.runLogs = next.runLogs.slice(-500);
    }

    this._save(next);
  }

  addExecutions(count, source = 'manual', note = '') {
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (!safeCount) return this.getSummary();

    const next = { ...this.state };
    next.actualExecutions = (next.actualExecutions || 0) + safeCount;
    next.executionLogs = next.executionLogs || [];
    next.executionLogs.push({
      timestamp: new Date().toISOString(),
      count: safeCount,
      source,
      note,
    });

    this._save(next);
    return this.getSummary();
  }

  addPartnerReferral(partnerName, count = 1, source = 'manual', note = '') {
    const name = String(partnerName || '').trim();
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (!name || !safeCount) return this.getPartnerWeeklyRanking();

    const next = { ...this.state };
    next.partnerReferrals = next.partnerReferrals || [];
    next.partnerReferrals.push({
      timestamp: new Date().toISOString(),
      partnerName: name,
      count: safeCount,
      source,
      note,
    });

    this._save(next);
    return this.getPartnerWeeklyRanking();
  }

  addPartnerExecution(partnerName, count = 1, source = 'manual', note = '') {
    const name = String(partnerName || '').trim();
    const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    if (!name || !safeCount) return this.getPartnerPerformance();

    const next = { ...this.state };
    next.partnerExecutions = next.partnerExecutions || [];
    next.partnerExecutions.push({
      timestamp: new Date().toISOString(),
      partnerName: name,
      count: safeCount,
      source,
      note,
    });

    // 전체 실행건수도 동기화
    next.actualExecutions = (next.actualExecutions || 0) + safeCount;
    next.executionLogs = next.executionLogs || [];
    next.executionLogs.push({
      timestamp: new Date().toISOString(),
      count: safeCount,
      source: `${source}:partner`,
      note: note || name,
    });

    this._save(next);
    return this.getPartnerPerformance();
  }

  getPartnerWeeklyRanking(days = 7) {
    const logs = this.state.partnerReferrals || [];
    const now = Date.now();
    const cutoff = now - (Math.max(1, days) * 86400000);

    const bucket = new Map();
    for (const log of logs) {
      const ts = new Date(log.timestamp).getTime();
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      const key = String(log.partnerName || '').trim() || 'unknown';
      const prev = bucket.get(key) || 0;
      bucket.set(key, prev + (Number(log.count) || 0));
    }

    const ranking = Array.from(bucket.entries())
      .map(([partnerName, referrals]) => ({ partnerName, referrals }))
      .sort((a, b) => b.referrals - a.referrals);

    const totalReferrals = ranking.reduce((acc, x) => acc + x.referrals, 0);
    const activePartners = ranking.length;

    return {
      days,
      totalReferrals,
      activePartners,
      ranking,
      generatedAt: new Date().toISOString(),
    };
  }

  buildPartnerWeeklyMessage(days = 7) {
    const report = this.getPartnerWeeklyRanking(days);
    const lines = [
      `🤝 <b>파트너 주간 랭킹 (${report.days}일)</b>`,
      `총 소개건수: ${report.totalReferrals}건 | 활동 파트너: ${report.activePartners}명`,
      '',
    ];

    if (!report.ranking.length) {
      lines.push('아직 기록된 파트너 소개건수가 없습니다.');
    } else {
      report.ranking.slice(0, 10).forEach((x, i) => {
        lines.push(`${i + 1}. ${x.partnerName} - ${x.referrals}건`);
      });
    }

    lines.push('');
    lines.push('기록 예시: node master-agent.js --add-partner=홍길동 --count=2');
    return lines.join('\n');
  }

  getPartnerPerformance(days = 30) {
    const now = Date.now();
    const cutoff = now - (Math.max(1, days) * 86400000);

    const referrals = new Map();
    const executions = new Map();

    for (const log of (this.state.partnerReferrals || [])) {
      const ts = new Date(log.timestamp).getTime();
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      const key = String(log.partnerName || '').trim() || 'unknown';
      referrals.set(key, (referrals.get(key) || 0) + (Number(log.count) || 0));
    }

    for (const log of (this.state.partnerExecutions || [])) {
      const ts = new Date(log.timestamp).getTime();
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      const key = String(log.partnerName || '').trim() || 'unknown';
      executions.set(key, (executions.get(key) || 0) + (Number(log.count) || 0));
    }

    const partners = new Set([...referrals.keys(), ...executions.keys()]);
    const rows = Array.from(partners).map(name => {
      const ref = referrals.get(name) || 0;
      const exe = executions.get(name) || 0;
      const conv = ref > 0 ? (exe / ref) * 100 : 0;
      let priority = 'C';
      if (ref >= 5 && conv >= 35) priority = 'A';
      else if (ref >= 3 && conv >= 20) priority = 'B';

      return {
        partnerName: name,
        referrals: ref,
        executions: exe,
        conversionRate: Number(conv.toFixed(1)),
        priority,
      };
    });

    rows.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority.localeCompare(a.priority);
      if (b.conversionRate !== a.conversionRate) return b.conversionRate - a.conversionRate;
      return b.executions - a.executions;
    });

    const recommendations = rows.slice(0, 5).map(x => {
      if (x.priority === 'A') {
        return `${x.partnerName}: 우선 협업 강화 (주 2회 접촉)`;
      }
      if (x.priority === 'B') {
        return `${x.partnerName}: 유지/육성 (주 1회 접촉)`;
      }
      return `${x.partnerName}: 메시지 개선 필요 (제안문/응답속도 점검)`;
    });

    return {
      days,
      rows,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  buildPartnerPerformanceMessage(days = 30) {
    const report = this.getPartnerPerformance(days);
    const lines = [
      `📈 <b>파트너 전환율 리포트 (${report.days}일)</b>`,
      '기준: 소개건수 대비 실행건수',
      '',
    ];

    if (!report.rows.length) {
      lines.push('아직 집계할 파트너 데이터가 없습니다.');
    } else {
      lines.push('이름 | 소개 | 실행 | 전환율 | 우선순위');
      report.rows.slice(0, 10).forEach(x => {
        lines.push(`${x.partnerName} | ${x.referrals} | ${x.executions} | ${x.conversionRate}% | ${x.priority}`);
      });

      lines.push('');
      lines.push('추천 액션:');
      report.recommendations.forEach((r, i) => {
        lines.push(`${i + 1}. ${r}`);
      });
    }

    lines.push('');
    lines.push('실행 기록 예시: node master-agent.js --add-partner-exec=홍길동 --count=1');
    return lines.join('\n');
  }

  addToneFeedback(partnerName, tone, outcome, note = '') {
    const name = String(partnerName || '').trim();
    const safeTone = this._normalizeTone(tone);
    const safeOutcome = this._normalizeOutcome(outcome);
    if (!name) return this.getTonePerformance();

    const next = { ...this.state };
    next.toneLogs = next.toneLogs || [];
    next.toneLogs.push({
      timestamp: new Date().toISOString(),
      partnerName: name,
      tone: safeTone,
      outcome: safeOutcome,
      note,
    });

    // 실행 성과가 나오면 해당 톤을 7일간 우선 고정
    if (safeOutcome === 'exec') {
      this._upsertToneHotLock(next, name, safeTone, 7);
    }

    this._save(next);
    return this.getTonePerformance();
  }

  getTonePerformance(days = 30, partnerName = '') {
    const logs = this.state.toneLogs || [];
    const now = Date.now();
    const cutoff = now - (Math.max(1, days) * 86400000);
    const filterName = String(partnerName || '').trim();

    const init = () => ({ sent: 0, reply: 0, exec: 0, no: 0, score: 0 });
    const stats = { formal: init(), friendly: init(), emphasis: init() };

    for (const log of logs) {
      const ts = new Date(log.timestamp).getTime();
      if (!Number.isFinite(ts) || ts < cutoff) continue;
      if (filterName && log.partnerName !== filterName) continue;

      const tone = this._normalizeTone(log.tone);
      const outcome = this._normalizeOutcome(log.outcome);
      const row = stats[tone];
      row.sent += 1;
      if (outcome === 'reply') row.reply += 1;
      if (outcome === 'exec') row.exec += 1;
      if (outcome === 'no') row.no += 1;
    }

    Object.keys(stats).forEach(k => {
      const r = stats[k];
      if (r.sent > 0) {
        // 실행 성과를 더 강하게 반영: exec는 reply 대비 3배 가중치
        r.score = Number((((r.reply * 1) + (r.exec * 3)) / r.sent).toFixed(2));
      }
    });

    const ranking = Object.entries(stats)
      .map(([tone, row]) => ({ tone, ...row }))
      .sort((a, b) => b.score - a.score || b.exec - a.exec || b.reply - a.reply);

    return {
      days,
      partnerName: filterName || null,
      ranking,
      generatedAt: new Date().toISOString(),
    };
  }

  getRecommendedTone(partnerName = '', days = 30) {
    const partnerHot = this._getActiveToneHotLock(partnerName);
    if (partnerHot) return partnerHot.tone;

    const globalHot = this._getActiveToneHotLock('__GLOBAL__');
    if (globalHot) return globalHot.tone;

    const partnerReport = this.getTonePerformance(days, partnerName);
    const partnerTop = partnerReport.ranking[0];
    if (partnerTop && partnerTop.sent >= 1) return partnerTop.tone;

    const globalReport = this.getTonePerformance(days);
    const globalTop = globalReport.ranking[0];
    if (globalTop && globalTop.sent >= 1) return globalTop.tone;

    return 'formal';
  }

  buildToneReportMessage(days = 30, partnerName = '') {
    const rep = this.getTonePerformance(days, partnerName);
    const title = partnerName
      ? `🧪 <b>톤 성과 리포트 (${partnerName}, ${days}일)</b>`
      : `🧪 <b>톤 성과 리포트 (전체, ${days}일)</b>`;

    const lines = [title, '톤 | 발송 | 답장 | 실행 | 미응답 | 점수', '점수식: (답장×1 + 실행×3) / 발송', ''];
    rep.ranking.forEach(r => {
      lines.push(`${this._toneLabel(r.tone)} | ${r.sent} | ${r.reply} | ${r.exec} | ${r.no} | ${r.score}`);
    });
    lines.push('');
    const hot = this._getActiveToneHotLock(partnerName || '__GLOBAL__');
    if (hot) {
      lines.push(`핫 톤 잠금: ${this._toneLabel(hot.tone)} (만료 ${new Date(hot.until).toLocaleString('ko-KR')})`);
    }
    lines.push(`추천 톤: ${this._toneLabel(this.getRecommendedTone(partnerName, days))}`);
    lines.push('기록 예시: node master-agent.js --tone-feedback=홍길동 --tone=formal --outcome=reply');
    return lines.join('\n');
  }

  getTopPartnersForOutreach(days = 30, limit = 5) {
    const report = this.getPartnerPerformance(days);
    const rows = report.rows
      .filter(x => x.priority === 'A' || x.priority === 'B')
      .slice(0, Math.max(1, limit));
    return { days, rows, generatedAt: new Date().toISOString() };
  }

  buildPartnerKakaoOutreachPack(days = 30) {
    const top = this.getTopPartnersForOutreach(days, 5);
    const lines = [
      `=== 파트너 맞춤 카카오 메시지 팩 (${days}일 성과 기준) ===`,
      `생성시각: ${new Date().toLocaleString('ko-KR')}`,
      '',
    ];

    if (!top.rows.length) {
      lines.push('현재 A/B 등급 파트너 데이터가 없습니다.');
      lines.push('먼저 소개건수/실행건수를 누적해 주세요.');
      return lines.join('\n');
    }

    top.rows.forEach((p, idx) => {
      const cadence = p.priority === 'A' ? '주 2회' : '주 1회';
      lines.push(`[${idx + 1}] ${p.partnerName} | 등급 ${p.priority}`);
      lines.push(`- 최근 소개 ${p.referrals}건 / 실행 ${p.executions}건 / 전환율 ${p.conversionRate}%`);
      lines.push(`- 권장 접촉 빈도: ${cadence}`);
      lines.push('- 메시지 템플릿:');
      lines.push('안녕하세요, 새론금융대부중개 김덕진 대표입니다.');
      lines.push('최근에 전달 주신 케이스들 빠르게 확인해드리고 있습니다.');
      lines.push('이번 주도 은행 한도 초과/잔금 부족/전세퇴거자금 이슈 고객이 있으시면 우선 대응하겠습니다.');
      lines.push('필요하시면 케이스 요약만 먼저 보내주셔도 즉시 가능여부 안내드리겠습니다.');
      lines.push('등록번호: 2026-수원-2324 | saeloan.co.kr | 1555-2137');
      lines.push('');
    });

    lines.push('운영 원칙: 과장표현 금지, 리베이트 금지, 대외 명의 김덕진 유지');
    return lines.join('\n');
  }

  getTodayTopPartners(days = 30, limit = 3) {
    const report = this.getPartnerPerformance(days);
    const aGrade = report.rows.filter(x => x.priority === 'A');
    const bGrade = report.rows.filter(x => x.priority === 'B');

    const picked = [];
    for (const p of aGrade) {
      if (picked.length >= limit) break;
      picked.push(p);
    }
    for (const p of bGrade) {
      if (picked.length >= limit) break;
      picked.push(p);
    }

    return {
      days,
      limit,
      picked,
      generatedAt: new Date().toISOString(),
    };
  }

  buildTodayTopPartnersMessage(days = 30, limit = 3) {
    const top = this.getTodayTopPartners(days, limit);
    const lines = [
      `🎯 <b>오늘 발송 대상 TOP ${top.limit}</b>`,
      `기준 기간: 최근 ${top.days}일`,
      '',
    ];

    if (!top.picked.length) {
      lines.push('A/B 등급 파트너 데이터가 없어 오늘 발송 대상이 없습니다.');
      lines.push('먼저 소개/실행 데이터를 누적해 주세요.');
      return lines.join('\n');
    }

    top.picked.forEach((p, i) => {
      const recommendedTone = this.getRecommendedTone(p.partnerName, 30);
      lines.push(`${i + 1}. ${p.partnerName} (등급 ${p.priority})`);
      lines.push(`   소개 ${p.referrals}건 | 실행 ${p.executions}건 | 전환율 ${p.conversionRate}%`);
      lines.push('   권장: 오늘 1:1 카카오 발송 + 24시간 내 팔로업');
      lines.push(`   추천 톤: ${this._toneLabel(recommendedTone)}`);
      const tone = this._buildToneVariants(p);
      this._orderedToneLines(tone, recommendedTone).forEach(x => lines.push(`   ${x}`));
    });

    lines.push('');
    lines.push('즉시 실행: npm run partner:outreach');
    return lines.join('\n');
  }

  _buildPersonalizedOneLiner(partner) {
    if (partner.priority === 'A' && partner.conversionRate >= 40) {
      return '대표님 루트는 전환이 매우 높아 오늘은 은행거절/잔금부족 케이스 우선 배정드리겠습니다.';
    }
    if (partner.priority === 'A') {
      return '지난 케이스 빠른 연결 감사합니다, 오늘도 긴급 보증금/잔금 이슈 고객 우선 대응하겠습니다.';
    }
    if (partner.priority === 'B' && partner.referrals >= 5) {
      return '소개 흐름이 좋아지고 있어 이번 주는 조건 좋은 케이스부터 신속 회신으로 전환률을 더 끌어올리겠습니다.';
    }
    if (partner.priority === 'B') {
      return '좋은 케이스 연결 감사합니다, 오늘은 가능여부 회신 속도를 높여 실행 전환까지 이어가보겠습니다.';
    }
    return '이번 주는 제안 문구를 간결하게 정리해 은행거절/자금급한 고객 중심으로 다시 접촉해보겠습니다.';
  }

  _buildToneVariants(partner) {
    const base = this._buildPersonalizedOneLiner(partner);

    const formal = base.replace('감사합니다,', '감사드립니다,');

    const friendly =
      partner.priority === 'A'
        ? '지난번 도움 정말 감사합니다. 오늘도 급한 케이스 있으면 바로 연결 주세요, 최우선으로 확인드릴게요.'
        : partner.priority === 'B'
          ? '항상 좋은 케이스 공유해주셔서 감사합니다. 오늘도 오시면 빠르게 가능여부부터 먼저 잡아드릴게요.'
          : '이번에는 케이스 설명을 더 간단히 맞춰서 다시 시도해보면 반응을 올릴 수 있습니다.';

    const emphasis =
      partner.priority === 'A'
        ? '오늘은 대표님 루트를 최우선 처리하겠습니다. 은행거절/잔금부족 건은 접수 즉시 빠른 회신드리겠습니다.'
        : partner.priority === 'B'
          ? '이번 주 핵심은 속도입니다. 도착 케이스는 당일 가능여부 회신으로 실행 전환을 끌어올리겠습니다.'
          : '지금은 문구 재정비가 우선입니다. 타겟을 은행거절·긴급자금 고객으로 압축해 재접촉을 권장드립니다.';

    return { formal, friendly, emphasis };
  }

  _orderedToneLines(toneMap, recommendedTone) {
    const entries = [
      { key: 'formal', label: '정중', text: toneMap.formal },
      { key: 'friendly', label: '친근', text: toneMap.friendly },
      { key: 'emphasis', label: '강조', text: toneMap.emphasis },
    ];

    entries.sort((a, b) => {
      const aw = a.key === recommendedTone ? 0 : 1;
      const bw = b.key === recommendedTone ? 0 : 1;
      return aw - bw;
    });

    return entries.map((e, idx) => {
      const badge = idx === 0 ? '추천우선' : '대체안';
      return `맞춤 1줄(${e.label}, ${badge}): ${e.text}`;
    });
  }

  _normalizeTone(tone) {
    const t = String(tone || '').toLowerCase();
    if (t === 'friendly' || t === '친근') return 'friendly';
    if (t === 'emphasis' || t === '강조') return 'emphasis';
    return 'formal';
  }

  _normalizeOutcome(outcome) {
    const o = String(outcome || '').toLowerCase();
    if (o === 'reply' || o === '답장') return 'reply';
    if (o === 'exec' || o === 'execution' || o === '실행') return 'exec';
    if (o === 'no' || o === 'none' || o === '미응답') return 'no';
    return 'no';
  }

  _toneLabel(tone) {
    if (tone === 'friendly') return '친근';
    if (tone === 'emphasis') return '강조';
    return '정중';
  }

  _upsertToneHotLock(state, partnerName, tone, days = 7) {
    const locks = state.toneHotLocks || [];
    const now = Date.now();
    const until = new Date(now + (Math.max(1, days) * 86400000)).toISOString();

    // 만료 잠금 정리
    const alive = locks.filter(x => new Date(x.until).getTime() > now);

    // 파트너 잠금 업데이트
    const idx = alive.findIndex(x => x.partnerName === partnerName);
    if (idx >= 0) {
      alive[idx] = { partnerName, tone, until, updatedAt: new Date().toISOString() };
    } else {
      alive.push({ partnerName, tone, until, updatedAt: new Date().toISOString() });
    }

    // 전역 잠금도 함께 갱신 (최근 실행 톤 우선 반영)
    const gidx = alive.findIndex(x => x.partnerName === '__GLOBAL__');
    if (gidx >= 0) {
      alive[gidx] = { partnerName: '__GLOBAL__', tone, until, updatedAt: new Date().toISOString() };
    } else {
      alive.push({ partnerName: '__GLOBAL__', tone, until, updatedAt: new Date().toISOString() });
    }

    state.toneHotLocks = alive;
  }

  _getActiveToneHotLock(partnerName) {
    const locks = this.state.toneHotLocks || [];
    const now = Date.now();
    const target = String(partnerName || '').trim();
    if (!target) return null;

    const alive = locks.filter(x => new Date(x.until).getTime() > now);
    const hit = alive.find(x => x.partnerName === target);
    return hit || null;
  }

  getSummary() {
    const now = new Date();
    const start = new Date(this.state.startDate + 'T00:00:00');
    const elapsedDays = Math.max(1, Math.floor((now - start) / 86400000) + 1);

    const target3m = this.state.goals.target3m;
    const target6m = this.state.goals.target6m;

    const pace3m = target3m / 90;
    const pace6m = target6m / 180;

    const expected3mToDate = Math.min(target3m, Math.round(elapsedDays * pace3m));
    const expected6mToDate = Math.min(target6m, Math.round(elapsedDays * pace6m));
    const remainingDays3m = Math.max(1, 90 - elapsedDays);
    const remainingDays6m = Math.max(1, 180 - elapsedDays);

    const actual = this.state.actualExecutions || 0;
    const remain3m = Math.max(0, target3m - actual);
    const remain6m = Math.max(0, target6m - actual);
    const dailyNeed3m = Math.ceil(remain3m / remainingDays3m);
    const dailyNeed6m = Math.ceil(remain6m / remainingDays6m);

    return {
      startDate: this.state.startDate,
      elapsedDays,
      actualExecutions: actual,
      target3m,
      target6m,
      expected3mToDate,
      expected6mToDate,
      gap3m: actual - expected3mToDate,
      gap6m: actual - expected6mToDate,
      remainingDays3m,
      remainingDays6m,
      dailyNeed3m,
      dailyNeed6m,
      monthlyNeedFor3m: Math.ceil(target3m / 3),
      monthlyNeedFor6m: Math.ceil(target6m / 6),
    };
  }

  getRecentCategories(count = 3) {
    const logs = this.state.runLogs || [];
    return logs
      .slice(-Math.max(1, count))
      .map(x => x.topicCategory)
      .filter(Boolean);
  }

  buildActionPlan() {
    const s = this.getSummary();
    let riskLevel = 'GREEN';
    if (s.gap3m <= -5) riskLevel = 'RED';
    else if (s.gap3m <= -2) riskLevel = 'YELLOW';

    const dailyExecTarget = Math.max(1, s.dailyNeed3m);
    const youtubePerWeek = dailyExecTarget >= 2 ? 4 : 3;
    const instaPerWeek = dailyExecTarget >= 2 ? 5 : 4;
    const partnerTouchesPerDay = riskLevel === 'RED' ? 6 : riskLevel === 'YELLOW' ? 4 : 3;
    const kakaoFollowUpsPerDay = riskLevel === 'RED' ? 8 : riskLevel === 'YELLOW' ? 5 : 3;
    const responseSlaMinutes = riskLevel === 'RED' ? 5 : 10;

    return {
      riskLevel,
      dailyExecTarget,
      weeklyTargets: {
        youtube: youtubePerWeek,
        instagram: instaPerWeek,
        partnerTouches: partnerTouchesPerDay * 7,
      },
      escalation: {
        enabled: riskLevel !== 'GREEN',
        mode: riskLevel === 'RED' ? 'EMERGENCY' : 'BOOST',
        partnerTouchesPerDay,
        kakaoFollowUpsPerDay,
        responseSlaMinutes,
      },
      todayChecklist: [
        `유튜브 쇼츠/릴스 핵심 주제 1개 발행`,
        `공인중개사 접촉 ${partnerTouchesPerDay}건 실행`,
        `카카오/전화 유입 응답 SLA ${responseSlaMinutes}분 이내 유지`,
        `카카오 재접촉 ${kakaoFollowUpsPerDay}건 실행`,
        `실행건수 발생 시 즉시 --add-exec 기록`,
      ],
    };
  }

  buildStatusMessage() {
    const s = this.getSummary();
    const sign3 = s.gap3m >= 0 ? '+' : '';
    const sign6 = s.gap6m >= 0 ? '+' : '';

    return (
      '📊 <b>실행건수 목표 추적</b>\n' +
      `시작일: ${s.startDate} | 경과: ${s.elapsedDays}일\n` +
      `실제 누적: ${s.actualExecutions}건\n` +
      `3개월 목표: ${s.target3m}건 (현재 기준 ${s.expected3mToDate}건, 차이 ${sign3}${s.gap3m})\n` +
      `6개월 목표: ${s.target6m}건 (현재 기준 ${s.expected6mToDate}건, 차이 ${sign6}${s.gap6m})\n` +
      `일일 필요 실행(3개월 기준): ${s.dailyNeed3m}건\n` +
      `월 필요 페이스: 3개월 ${s.monthlyNeedFor3m}건 / 6개월 ${s.monthlyNeedFor6m}건`
    );
  }
}

module.exports = GoalTracker;
