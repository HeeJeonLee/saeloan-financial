/**
 * ★★★★★ 새론금융 완전 자율 AI SNS 시스템 v3.0 ★★★★★
 *
 * ═══════════════════════════════════════════════════════════
 * [핵심 원칙 - 절대 변경 불가]
 * 1. 홈페이지(saeloan.co.kr)는 팀장 사전 승인 없이 수정 금지
 * 2. 홈페이지에 SNS영업·비대면영업 흔적 없음 유지
 * 3. 새론금융은 대부중개만 함 (방문·전화 상담 후 대부업체 연결)
 * 4. 서류 접수·심사·실행은 대부업체가 진행
 * 5. SNS 모든 게시물에 대부업법 필수 고지문 자동 포함
 * ═══════════════════════════════════════════════════════════
 *
 * [이희전 팀장 역할]
 * - 전략 변경 시: 이 파일 STRATEGY 섹션 수정 → 저장
 * - 주간 리포트 확인: 매주 월요일 이메일 읽기 (5분)
 * - 일상 SNS 운영: AI가 100% 자동 처리
 *
 * [설치 위치]
 * Google AppScript → script.google.com → 새 프로젝트
 * 파일명: SAELOAN_AI_MASTER
 */

// ══════════════════════════════════════════════════════════
// ★ 전략 설정 (팀장님이 바꿀 수 있는 유일한 구역) ★
// ══════════════════════════════════════════════════════════
const STRATEGY = {
  // 현재 주력 타겟 (true = 활성)
  TARGET: {
    자영업자: true,       // 자영업자·법인대표 아파트담보 추가자금
    구입자금: false,      // 아파트 구입자금 (은행 한도 초과) - 현재 비활성
    경매잔금: false,      // 경매 낙찰 잔금
  },

  // 타겟 지역
  REGION: "서울·수도권 아파트",

  // 콘텐츠 방향
  TONE: "신뢰감 있고 전문적으로, 정보 제공 중심",

  // 담당자 정보
  CONTACT: {
    전화: "010-5927-9205",
    대표전화: "1555-2137",
    홈페이지: "saeloan.co.kr",
    등록번호: "2026-수원-2324",
  },

  // Google Gemini API 설정
  GEMINI_API_KEY: "AIzaSyBSRSAtTFtqXm-_Xn90bjXHPn_0IHqBJI8", // Google AI Studio에서 발급
  GEMINI_MODEL: "gemini-1.5-flash",
};

// ══════════════════════════════════════════════════════════
// ★ 채널 및 외부 서비스 연동 (최초 1회 설정) ★
// ══════════════════════════════════════════════════════════
const CHANNELS = {
  TELEGRAM_BOT_TOKEN: "8930602850:AAHPERIFmvO2WIf7Mjz9A_4dgnBoo3z4qPs", // Telegram @BotFather에서 발급
  TELEGRAM_CHANNEL_ID: "@saeloan-financial",      // 생성한 텔레그램 공개 채널 ID
  GOOGLE_SHEET_ID: "1gH4xpqVBvpY9wAoI8wB7s4z7LWBOMR1jSnH2gCuKRZ0",  // CRM 및 로그 기록용 구글 시트 ID
  MANAGER_EMAIL: "sambo003@daum.net",    // 리포트 및 알림 수신용 관리자 이메일
};

// ══════════════════════════════════════════════════════════
// ★ 대부업법 필수 고지사항 (법 개정 시 이 부분만 수정) ★
// ══════════════════════════════════════════════════════════
const LEGAL = {
  // 모든 게시물 하단에 자동 추가될 고지문
  FOOTER: `\n\n─────────────────────
📋 새론금융대부중개 | 등록 ${STRATEGY.CONTACT.등록번호}
📞 ${STRATEGY.CONTACT.전화} | 🌐 ${STRATEGY.CONTACT.홈페이지}
⚠️ 과도한 빚은 큰 불행을 안겨줄 수 있습니다
※ 중개수수료 없음 | 대출 실행은 대부업체가 진행`,

  // AI가 콘텐츠 생성 시 절대 사용하지 않을 금지 표현 목록
  FORBIDDEN_WORDS: ["100% 승인", "무조건", "누구나", "신용등급 무관", "당일", "즉시"],
};

// ══════════════════════════════════════════════════════════
// ★ 7일 순환 콘텐츠 스케줄 (자동으로 다양한 주제 생성) ★
// ══════════════════════════════════════════════════════════
const CONTENT_SCHEDULE = {
  0: { type: "주간정리",   prompt: "이번 한 주 부동산 금융 관련 주요 뉴스를 3가지로 요약한 게시물" }, // 일요일
  1: { type: "시장정보",   prompt: "이번 주 서울·수도권 아파트 담보대출 시장 주요 정보를 정리한 텔레그램 게시물" }, // 월요일
  2: { type: "규제안내",   prompt: "2026년 현재 은행 아파트담보대출 LTV 규제 핵심 내용을 쉽게 설명하는 정보성 게시물" }, // 화요일
  3: { type: "자영업자",   prompt: "아파트 보유 자영업자가 은행 생활안정자금 1억 한도를 초과했을 때 선택지를 안내하는 게시물" }, // 수요일
  4: { type: "Q&A",        prompt: "아파트담보대출 관련 고객이 자주 묻는 질문 1가지와 답변 형식의 정보성 게시물" }, // 목요일
  5: { type: "절차안내",   prompt: "대부중개업체 이용 절차와 대부업체 연결 과정을 투명하게 안내하는 게시물" }, // 금요일
  6: { type: "금리정보",   prompt: "대부업 아파트담보대출 금리 구조와 법정최고금리(연 20%)를 설명하는 정보성 게시물" }, // 토요일
};

// ══════════════════════════════════════════════════════════
// ★ 네이버 블로그 포스팅 주제 (자동 순환) ★
// ══════════════════════════════════════════════════════════
const BLOG_TOPICS = [
  "자영업자 아파트담보대출: 은행 한도 초과 시 선택지 완전 정리",
  "2026년 은행 LTV 규제 총정리 - 아파트 시세별 한도",
  "대부중개업 이용 방법과 절차 - 투명하게 공개합니다",
  "아파트담보 대부업 대출 금리 구조 이해하기",
  "서울 아파트 담보대출 심사 시 확인하는 것들",
  "법정최고금리 연 20% - 대부업 금리 규제 완전 이해",
  "대부중개업체와 대부업체의 차이점",
];

/** OpenAI API 호출을 위한 프롬프트 생성 (블로그용) */
function buildBlogPostPrompt(topic) {
  return `자영업자 아파트담보대출: ${topic}`;
}

/** Google Gemini API 호출 */
function callGeminiAPI(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${STRATEGY.GEMINI_MODEL}:generateContent?key=${STRATEGY.GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500
    }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const data = JSON.parse(responseText);

  if (data.error) {
    throw new Error(`Gemini API Error: ${data.error.message}`);
  }
  
  if (!data.candidates || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
    throw new Error("Gemini API Error: Invalid response structure.");
  }

  return data.candidates[0].content.parts[0].text.trim();
}

/** 텔레그램 채널에 메시지 발송 */
function postToTelegram(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHANNEL_ID,
    text: text,
    parse_mode: "HTML",
  };
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const data = JSON.parse(responseText);
  if (data.error) {
    throw new Error(`Telegram API Error: ${data.error.message}`);
  }
}

/** 테스트 함수 */
function TEST_텔레그램_미리보기() {
  try {
    const today = new Date().getDay();
    const schedule = CONTENT_SCHEDULE[today];
    const prompt = buildTelegramPrompt(schedule);
    const content = callGeminiAPI(prompt);
    const finalPost = content + LEGAL.FOOTER;
    Logger.log("✅ 테스트 성공: 오늘 텔레그램에 발행될 게시물 미리보기입니다.");
  } catch (e) {
    Logger.log(`❌ 테스트 실패: ${e.toString()}`);
    Logger.log("Gemini API 키 또는 기타 설정이 올바른지 확인해주세요.");
  }
}
