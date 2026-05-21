/**
 * 새론금융대부중개 — AI 콘텐츠 생성기
 * =====================================================
 * Claude AI를 사용해 SNS 게시물을 자동으로 생성합니다.
 * 대부업법을 완벽 준수하는 콘텐츠만 생성됩니다.
 */

const Anthropic = require('@anthropic-ai/sdk');
const config = require('./config');
const LegalChecker = require('./legal-checker');

class ContentGenerator {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.checker = new LegalChecker();
  }

  /**
   * 오늘의 주제 자동 선택
   * 효과 순위(rank) 가중치 적용: 1순위 주제가 더 자주 선택됨
   */
  selectTodayTopic(dayOfWeek, options = {}) {
    const topics = config.contentTopics;
    const dayIndex = dayOfWeek !== undefined ? dayOfWeek : new Date().getDay();
    const excluded = new Set(options.excludeCategories || []);
    const highIntent = new Set([
      '은행거절해결', '전세퇴거자금', '개인사업자', '추가구입잔금', '전세보증금',
    ]);

    // rank 1 주제는 3배, rank 2는 2배 가중치로 확률 높임
    const weighted = [];
    topics.forEach(t => {
      let weight = t.rank === 1 ? 3 : t.rank === 2 ? 2 : 1;
      if (highIntent.has(t.category)) weight += 2;
      if (excluded.has(t.category)) weight = Math.max(1, weight - 2);
      for (let i = 0; i < weight; i++) weighted.push(t);
    });

    const topicIndex = (dayIndex + Math.floor(Date.now() / 86400000)) % weighted.length;
    return weighted[topicIndex];
  }

  /**
   * 네이버 블로그 포스트 생성 (HTML 형식 — SEO 최적화)
   * ─────────────────────────────────────────────────
   * 왜 네이버 블로그인가?
   *   → "아파트담보대출 은행거절" 같은 고의도 키워드 검색 시
   *     네이버 블로그가 상위 노출 (인스타그램은 검색 유입 불가)
   *   → 40-60대 아파트 소유자가 주로 네이버 사용
   *   → 1회 게시 → 수개월 지속 유입 (인스타는 하루 노출)
   */
  async generateNaverBlogHtml(topic) {
    const topicTags = (topic.hashtags || topic.tags || []);

    // 매일 다른 글쓰기 스타일로 변주 (반복 패턴 방지)
    const today        = new Date();
    const styleIndex   = today.getDate() % 4;   // 0~3 순환
    const writerVoice  = [
      '금융 업계에서 10년 넘게 일한 실무자처럼 경험 기반으로 솔직하게',
      '같은 고민을 해봤던 사람이 이웃에게 말하듯 친근하고 담백하게',
      '실제 사례를 겪은 당사자 입장에서 공감하며 단계별로 설명하듯',
      '독자가 이미 알고 있을 내용과 모르는 내용을 구분해 차근차근',
    ][styleIndex];
    const openingStyle = [
      '뜬금없는 얘기 같지만, 이 이야기 들어보시면 고개를 끄덕이게 됩니다.',
      '생각보다 많은 분들이 똑같은 상황에서 당황하시더라고요.',
      '지난달에 비슷한 문의를 꽤 많이 받았는데, 정리해서 써봤습니다.',
      '처음엔 저도 이게 이렇게 복잡한 줄 몰랐습니다.',
    ][styleIndex];

    const prompt = `당신은 아파트 금융 분야에서 실무 경험을 쌓은 블로거입니다.
아래 주제로 네이버 블로그 포스팅을 작성하세요.

오늘의 주제: ${topic.topic}
핵심 방향: ${topic.angle || '실용적 정보 제공'}
글쓰기 톤: ${writerVoice}
첫 문장 힌트: "${openingStyle}" 같은 느낌으로 자연스럽게 시작

━━━ 반드시 지켜야 할 것 ━━━

[글쓰기 원칙 — 사람이 쓴 글처럼]
1. 문장 길이를 의도적으로 섞어라.
   짧은 문장. 그 다음엔 좀 더 길게 풀어서 설명하는 문장도 함께 쓴다.
   완벽하게 대칭되는 나열은 피해라.
2. 소제목을 딱딱한 명사형으로만 쓰지 마라.
   예: "은행 거절 이유" 대신 "은행에서 왜 거절했을까?" 같은 질문형도 OK.
3. 중간에 독자에게 말 거는 느낌을 1번 이상 넣어라.
   예: "혹시 이런 경우 해당되시지 않나요?", "이 부분이 핵심입니다."
4. 숫자나 구체적 사례를 최소 1번 이상 포함해라.
   (예: "DSR 40% 초과", "시세 9억 아파트 기준", "3~5영업일 내")
5. 리스트(번호/글머리)를 쓸 경우 항목 수를 3~5개로 다양하게.
   모든 항목 길이가 똑같으면 안 된다.
6. 분량: 본문 650~850자 (너무 짧거나 너무 길면 안 됨)
7. 마무리는 부드러운 안내로: "궁금하신 점은 편하게 전화 주세요. ☎ 1555-2137"

[절대 금지]
"보장", "100% 승인", "무조건", "확정", "반드시 됩니다" — 이런 표현 절대 금지.
법정 고지문 직접 작성 금지 (시스템이 자동 추가함).
AI가 쓴 글처럼 느껴지는 과도한 대칭 구조, 기계적 나열 금지.

[출력 형식 — 정확히 이 형식]
===TITLE===
(제목: 50자 이내, 핵심 키워드 자연스럽게 포함)

===CONTENT===
<p>(첫 문단 — 공감 또는 상황 묘사로 시작)</p>

<h2>(소제목 1 — 질문형 또는 상황 묘사형)</h2>
<p>(본문)</p>

<h2>(소제목 2)</h2>
<p>(본문)</p>

<h2>(소제목 3 — 선택, 필요 시 추가)</h2>
<p>(본문)</p>

<p>(마무리 안내: 궁금하신 점은 편하게 전화 주세요. ☎ 1555-2137)</p>`;

    try {
      const response = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].text;

      // 제목 파싱
      const titleMatch = raw.match(/===TITLE===\s*\n(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : topic.topic;

      // HTML 본문 파싱
      const contentMatch = raw.match(/===CONTENT===\s*\n([\s\S]+)/);
      const htmlBody = contentMatch ? contentMatch[1].trim() : `<p>${raw}</p>`;

      // 법정 고지문 HTML로 추가
      const legalHtml = `<hr><p style="font-size:11px; color:#666; line-height:1.8;">
${config.legalDisclosure.replace(/\n/g, '<br>')}</p>`;
      const finalHtml = htmlBody + '\n' + legalHtml;

      // 텍스트 버전 (법규 검사용)
      const textContent = finalHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      return {
        platform: 'naver_blog',
        title,
        htmlContent: finalHtml,
        textContent,
        tags: topicTags,
        legalCheck: this.checker.check(textContent),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('네이버 블로그 생성 오류:', err.message);
      throw err;
    }
  }

  /**
   * 인스타그램 캡션 생성
   * ─────────────────────────────────────────────────
   * 브랜드 분리 원칙:
   *   ❌ #새론금융 등 브랜드 해시태그 절대 사용 금지
   *   ✅ #아파트담보대출 #수도권아파트 등 상품 키워드만 사용
   *   → "새론금융" 검색 시 이 계정이 나오면 안 됨
   *   → "아파트담보대출 수도권" 검색 시에만 노출되도록
   */
  async generateSocialPost(topic, platform = 'instagram') {
    // 주제의 해시태그 (config에서 브랜드명 없는 것만)
    const topicHashtags = (topic.hashtags || topic.tags || []);
    const hashtagStr = topicHashtags.map(t => '#' + t).join(' ');

    const prompt = `당신은 아파트 담보대출 전문 금융 정보 계정의 인스타그램 에디터입니다.

[타겟 독자 — 주요 수요자 세그먼트]
아래 중 오늘의 주제와 가장 맞는 독자층을 떠올리며 작성하세요.
• 개인사업자/자영업자 — 매출은 있지만 신고소득 낮아 DSR에 막힌 분
• 역전세 임대인 — 보증금 반환 기한이 다가와 급히 자금이 필요한 분
• 아파트 추가 구입자 — 기존 DSR 소진 후 잔금이 필요한 갭투자자
• 소득 없는 임대사업자 — 임대수입은 있지만 은행용 서류가 안 되는 분
• DSR 초과 고소득자 — 연봉은 높지만 기존 대출이 많아 거절된 직장인/전문직
• 브릿지론 수요자 — 매도·매수 타이밍 불일치로 단기 자금이 필요한 분
공통: 서울 상급지(강남·마포·용산) 또는 판교·과천·광교·동탄 시세 7억~20억대 아파트 보유.

[오늘의 주제]
주제: ${topic.topic}
핵심 각도: ${topic.angle || '정보 제공 + 실용적 조언'}

[작성 지침]
1. 250자 이내 (법정 고지문은 시스템이 자동 추가)
2. 첫 줄: 스크롤을 멈추게 할 질문 또는 공감 문구 (타겟 독자의 현실 상황 직접 언급)
   예) "서울 아파트 있는데 은행에서 또 거절당하셨나요?"
   예) "판교 아파트 10억인데 대출이 안 된다고요?"
   예) "전세 세입자가 나가는데 보증금이 없다고요?"
   예) "개인사업자인데 소득증빙 때문에 대출이 막혔나요?"
   예) "연봉 1억인데 DSR 초과로 거절당하셨나요?"
3. 핵심 정보 3줄 이내 (금액·조건·절차 등 구체적으로)
4. 마지막 줄: 무료 상담 유도 — 전화: 1555-2137
5. 이모지 3~5개 사용 (읽기 편하게)

[절대 금지]
- "보장", "100% 승인", "무조건", "확정" 등 승인 확약 표현
- 개인정보(주민등록번호, 계좌번호) 관련 내용

[해시태그 — 반드시 아래 것만 사용, 추가 불가]
${hashtagStr}

법정 고지문은 시스템이 자동 추가하므로 직접 쓰지 마세요.`;

    try {
      const response = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].text;
      const finalContent = this.checker.addLegalDisclosure(content);

      return {
        platform,
        content: finalContent,
        hashtags: topicHashtags,   // 브랜드명 없음
        legalCheck: this.checker.check(finalContent),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error(`${platform} 포스트 생성 오류:`, err.message);
      throw err;
    }
  }

  /**
   * 카카오채널 메시지 생성
   */
  async generateKakaoMessage(topic) {
    const prompt = `당신은 새론금융대부중개의 카카오채널 메시지 작성 AI입니다.

아래 주제로 카카오채널 메시지를 작성하세요.
주제: ${topic.topic}

필수 조건:
1. 200자 이내 (카카오 메시지 최적 길이)
2. 친근하고 따뜻한 톤
3. 금지 표현 사용 금지
4. 상담 유도 (전화: 1555-2137)
5. 개인화된 느낌 (고객에게 직접 말하는 듯)
6. 이모지 2~3개 사용

주의: 법정 고지 문구는 시스템이 자동 추가합니다.`;

    try {
      const response = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0].text;
      const finalContent = this.checker.addLegalDisclosure(content);
      
      return {
        platform: 'kakao',
        content: finalContent,
        legalCheck: this.checker.check(finalContent),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('카카오 메시지 생성 오류:', err.message);
      throw err;
    }
  }

  /**
   * YouTube Shorts 스크립트 자동 생성
   * ─────────────────────────────────────────────────
   * 완전 자동 영상 제작은 현재 무료로 불가. 대신:
   *   1. AI가 나레이션 + 자막 + 제목 + 설명 전부 생성
   *   2. Telegram으로 전송
   *   3. 이희전 씨가 CapCut에서 3~5분 작업 후 업로드
   *
   * 법정 필수 기재사항은 영상 설명란에 자동 포함됨.
   */
  async generateYoutubeShorts(topic) {
    const topicTags = (topic.hashtags || topic.tags || []);

    // 날짜 기반 후크 스타일 4가지 순환 (매일 다른 첫 화면)
    const today      = new Date();
    const hookStyle  = today.getDate() % 4;
    const hookTone   = [
      '충격적 사실 폭로형: "XX인데 몰랐나요?" 형식',
      '공감 질문형: "혹시 이런 상황이세요?" 형식',
      '오해 교정형: "사람들이 잘못 알고 있는 것" 형식',
      '숫자 자극형: "X명 중 X명이 모르는 것" 형식',
    ][hookStyle];

    const prompt = `당신은 YouTube Shorts 전문 스크립트 작가입니다.
아파트 담보대출 정보 채널 "새론금융대부중개" 의 쇼츠 영상을 만듭니다.

[오늘 주제]
${topic.topic}
핵심 각도: ${topic.angle || '실용적 정보 + 상담 유도'}

[후크 스타일 — 오늘의 방식]
${hookTone}

[타겟 시청자]
서울/수도권 아파트 보유자 중:
• 은행에서 대출 거절당한 분 (DSR 초과, 소득증빙 부족)
• 역전세로 보증금 반환이 급한 임대인
• 개인사업자/자영업자로 소득증빙이 어려운 분
• 아파트 추가 구입 잔금이 필요한 분

━━━ 출력 형식 (정확히 이 형식으로) ━━━

===TITLE===
(유튜브 영상 제목: 30자 이내, 핵심 키워드 포함, 클릭 유도)

===HOOK===
(첫 화면 0~3초에 큰 글씨로 나오는 텍스트: 20자 이내, 강렬하게)

===SCRIPT===
(나레이션 전체 — 자연스러운 구어체, 읽으면 45~55초 분량, 약 220~270자)
조건:
- "안녕하세요" 등 인사 없이 바로 시작
- 구체적 숫자 최소 1개 (예: DSR 40%, 9억 아파트, 5영업일 등)
- 중간에 "사실은요," "그런데요," "이게 핵심인데요," 같은 구어적 전환어 사용
- 마무리: "궁금하신 점은 1555-2137로 무료 상담 가능합니다. 새론금융대부중개였습니다."
- 절대 금지: "보장", "100% 승인", "무조건", "확정"

===CAPTIONS===
(영상 중간중간 화면에 자막으로 띄울 핵심 문구 4~5개, 각 줄에 하나씩, 각 15자 이내)

===DESCRIPTION===
(유튜브 영상 설명란: 150자 이내, 핵심 정보 + 상담 번호 포함)
📞 무료 상담: 1555-2137 (새론금융대부중개)`;

    try {
      const response = await this.client.messages.create({
        model: config.ai.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].text;

      // 파트별 파싱
      const titleMatch   = raw.match(/===TITLE===\s*\n(.+)/);
      const hookMatch    = raw.match(/===HOOK===\s*\n(.+)/);
      const scriptMatch  = raw.match(/===SCRIPT===\s*\n([\s\S]+?)(?====CAPTIONS===)/);
      const captionsMatch= raw.match(/===CAPTIONS===\s*\n([\s\S]+?)(?====DESCRIPTION===)/);
      const descMatch    = raw.match(/===DESCRIPTION===\s*\n([\s\S]+)/);

      const title    = titleMatch    ? titleMatch[1].trim()    : topic.topic;
      const hook     = hookMatch     ? hookMatch[1].trim()     : '';
      const script   = scriptMatch   ? scriptMatch[1].trim()   : raw;
      const captions = captionsMatch ? captionsMatch[1].trim() : '';
      const descRaw  = descMatch     ? descMatch[1].trim()     : '';

      // 영상 설명에 법정 고지문 자동 추가
      const legalNote = `\n\n─────────────────────\n` +
        `▪ 등록번호: 2026-수원-2324 (대부중개업)\n` +
        `▪ 최고 이자율: 연 20% 이내 (법정 최고금리)\n` +
        `▪ 과도한 빚은 당신에게 큰 불행을 안겨줄 수 있습니다\n` +
        `▪ 대출 전 반드시 상환 능력을 점검하세요`;
      const description = descRaw + legalNote;

      // 법규 검사 (스크립트 + 설명 합산)
      const fullText = script + ' ' + description;

      return {
        platform: 'youtube_shorts',
        title,
        hook,
        script,
        captions,
        description,
        tags: topicTags,
        legalCheck: this.checker.check(fullText),
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('YouTube Shorts 스크립트 생성 오류:', err.message);
      throw err;
    }
  }

  /** @deprecated generateYoutubeShorts() 사용 */
  async generateYoutubeScript(topic) {
    return this.generateYoutubeShorts(topic);
  }

  /**
   * 월간 성과 보고서 생성
   */
  async generateMonthlyReport(stats) {
    const prompt = `당신은 새론금융대부중개의 SNS 마케팅 분석 AI입니다.

아래 통계를 분석하여 월간 보고서를 작성해주세요:
${JSON.stringify(stats, null, 2)}

보고서 내용:
1. 이번 달 전체 성과 요약
2. 채널별 성과 (좋은 것, 아쉬운 것)
3. 가장 효과적이었던 콘텐츠 유형
4. 다음 달 전략 제안
5. AI 도구 업데이트 필요 여부

형식: 대표님이 5분 안에 읽을 수 있도록 간결하게
언어: 한국어, 쉬운 용어 사용 (전문 용어 최소화)`;

    const response = await this.client.messages.create({
      model: config.ai.model,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].text;
  }

  // ── 유틸리티 ─────────────────────────────────────
  _extractTitle(content) {
    const match = content.match(/\[제목\]\s*\n(.+)/);
    return match ? match[1].trim() : '새론금융대부중개 금융 정보';
  }

  _extractDescription(content) {
    const match = content.match(/\[영상 설명\]\s*\n([\s\S]+)$/);
    return match ? match[1].trim() : content;
  }
}

// ── 단독 실행 시 테스트 ──────────────────────────────
if (require.main === module) {
  (async () => {
    console.log('=== AI 콘텐츠 생성기 테스트 ===\n');
    
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('⚠️  ANTHROPIC_API_KEY가 설정되지 않았습니다.');
      console.log('    .env 파일에 ANTHROPIC_API_KEY=your_key 를 추가하세요.');
      return;
    }
    
    const generator = new ContentGenerator();
    const topic = generator.selectTodayTopic(new Date().getDay());
    
    console.log('오늘의 주제:', topic.topic);
    console.log('카테고리:', topic.category);
    
    console.log('\n인스타그램 게시물 생성 중...');
    try {
      const insta = await generator.generateSocialPost(topic, 'instagram');
      console.log('생성 완료!');
      console.log('법규 검사:', insta.legalCheck.pass ? '✅ 통과' : '❌ 실패');
      console.log('내용 미리보기:\n', insta.content.substring(0, 200) + '...');
    } catch (e) {
      console.error('오류:', e.message);
    }
  })();
}

module.exports = ContentGenerator;
