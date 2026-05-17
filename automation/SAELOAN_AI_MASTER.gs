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
var STRATEGY = {

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

  // 담당자
  CONTACT: {
    전화: "010-5927-9205",
    대표전화: "1555-2137",
    홈페이지: "saeloan.co.kr",
    등록번호: "2026-수원-2324",
  },

  // OpenAI 설정
  OPENAI_KEY: "YOUR_OPENAI_API_KEY",  // platform.openai.com에서 발급
  OPENAI_MODEL: "gpt-4o-mini",
};

// ══════════════════════════════════════════════════════════
// 채널 설정 (처음 1회)
// ══════════════════════════════════════════════════════════
var CHANNELS = {
  TELEGRAM_TOKEN: "YOUR_BOT_TOKEN",
  TELEGRAM_ID: "@saeloan_apt",
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID",
  MANAGER_EMAIL: "YOUR_EMAIL@gmail.com",
};

// ══════════════════════════════════════════════════════════
// 대부업법 필수 고지문 (법 개정 시 이 부분만 수정)
// ══════════════════════════════════════════════════════════
var LEGAL = {
  고지문: `\n\n─────────────────────
📋 새론금융대부중개 | 등록 ${STRATEGY.CONTACT.등록번호}
📞 ${STRATEGY.CONTACT.전화} | 🌐 ${STRATEGY.CONTACT.홈페이지}
⚠️ 과도한 빚은 큰 불행을 안겨줄 수 있습니다
※ 중개수수료 없음 | 대출 실행은 대부업체가 진행`,

  금지표현: ["100% 승인", "무조건 가능", "누구나", "즉시 승인", "당일 실행"],
};

// ══════════════════════════════════════════════════════════
// 요일별 콘텐츠 스케줄 (7가지 유형 자동 순환)
// ══════════════════════════════════════════════════════════
var CONTENT_SCHEDULE = {
  0: { type: "시장정보",   prompt: "이번 주 서울·수도권 아파트 담보대출 시장 주요 정보를 정리한 텔레그램 게시물" },
  1: { type: "규제안내",   prompt: "2026년 현재 은행 아파트담보대출 LTV 규제 핵심 내용을 쉽게 설명하는 정보성 게시물" },
  2: { type: "자영업자",   prompt: "아파트 있는 자영업자가 은행 생활안정자금 1억 한도를 초과했을 때 선택지를 안내하는 게시물" },
  3: { type: "Q&A",        prompt: "아파트담보대출 관련 고객이 자주 묻는 질문 1가지와 답변 형식의 정보성 게시물" },
  4: { type: "절차안내",   prompt: "대부중개업체 이용 절차와 대부업체 연결 과정을 투명하게 안내하는 게시물" },
  5: { type: "금리정보",   prompt: "대부업 아파트담보대출 금리 구조와 법정최고금리(연 20%)를 설명하는 정보성 게시물" },
  6: { type: "주간정리",   prompt: "이번 한 주 부동산 금융 관련 주요 뉴스를 3가지로 요약한 게시물" },
};

// ══════════════════════════════════════════════════════════
// [메인 함수] 매일 오전 9시 자동 실행
// ══════════════════════════════════════════════════════════
function dailyAutoPost() {
  try {
    var schedule = CONTENT_SCHEDULE[new Date().getDay()];
    var raw = callOpenAI(buildPrompt(schedule));

    // 금지 표현 자동 검수
    if (containsForbiddenWords(raw)) {
      raw = callOpenAI(buildPrompt(schedule) + "\n\n주의: 다음 표현은 절대 사용 금지: " + LEGAL.금지표현.join(", "));
    }

    var final = raw + LEGAL.고지문;

    postToTelegram(final);
    logActivity("텔레그램", schedule.type, final);
    Logger.log("✅ " + schedule.type + " 게시 완료");

  } catch(e) {
    GmailApp.sendEmail(CHANNELS.MANAGER_EMAIL, "[새론금융 AI] 오류 발생", "자동발행 오류: " + e.toString());
    Logger.log("❌ 오류: " + e);
  }
}

// ══════════════════════════════════════════════════════════
// [네이버 블로그] 주 3회 초안 자동 생성 → 이메일 발송
// (월·수·금 오전 8시)
// ══════════════════════════════════════════════════════════
function generateBlogPost() {
  var topics = [
    "자영업자 아파트담보대출: 은행 한도 초과 시 선택지 완전 정리",
    "2026년 은행 LTV 규제 총정리 - 아파트 시세별 한도",
    "대부중개업 이용 방법과 절차 - 투명하게 공개합니다",
    "아파트담보 대부업 대출 금리 구조 이해하기",
    "서울 아파트 담보대출 심사 시 확인하는 것들",
    "법정최고금리 연 20% - 대부업 금리 규제 완전 이해",
    "대부중개업체와 대부업체의 차이점",
  ];

  var week = Math.floor((new Date() - new Date(2026,0,1)) / (7*24*60*60*1000));
  var topic = topics[week % topics.length];

  var prompt = `당신은 금융 정보 블로거입니다.
네이버 블로그 SEO 포스팅을 작성해 주세요.

[주제] ${topic}

[회사] 새론금융대부중개 (대부중개업 등록번호: ${STRATEGY.CONTACT.등록번호})
- 직접 대출 실행 안 함, 대부업체 연결 중개만 함
- 전화: ${STRATEGY.CONTACT.전화}

[조건]
- 길이: 1,200~1,500자
- 구조: 도입(공감) → 본론(정보) → 마무리(전화 상담 안내)
- 톤: ${STRATEGY.TONE}
- 필수 키워드: 아파트담보대출, 대부중개, ${topic.substring(0,8)}
- 하단 고지문 포함:
  새론금융대부중개 | 등록 ${STRATEGY.CONTACT.등록번호}
  ☎ ${STRATEGY.CONTACT.전화} | ${STRATEGY.CONTACT.홈페이지}
  ⚠️ 과도한 빚은 큰 불행을 안겨줄 수 있습니다
  ※ 중개수수료 없음 | 서류접수·심사·실행은 대부업체가 진행

[절대 금지]
- "100% 승인", "무조건", "즉시" 등 과장 표현
- 비대면 접수 언급
- 직접 대출 실행하는 것처럼 표현`;

  var content = callOpenAI(prompt);

  // 구글 시트에 저장
  try {
    var ss = SpreadsheetApp.openById(CHANNELS.SHEET_ID);
    var sheet = ss.getSheetByName("블로그초안") || ss.insertSheet("블로그초안");
    if (sheet.getLastRow() === 0) sheet.appendRow(["날짜", "주제", "내용"]);
    sheet.appendRow([new Date().toLocaleString("ko-KR"), topic, content]);
  } catch(e) {}

  // 팀장에게 이메일 발송
  GmailApp.sendEmail(
    CHANNELS.MANAGER_EMAIL,
    "[새론금융 AI] 블로그 초안 준비완료 - " + topic,
    "안녕하세요. AI가 이번 주 네이버 블로그 포스팅 초안을 작성했습니다.\n\n" +
    "주제: " + topic + "\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    content + "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
    "위 내용을 네이버 블로그에 그대로 올려주세요.\n" +
    "수정이 필요하면 GitHub Copilot 대화창에서 요청해 주세요."
  );

  Logger.log("블로그 초안 이메일 발송: " + topic);
}

// ══════════════════════════════════════════════════════════
// [주간 리포트] 매주 월요일 오전 9시 자동 발송
// ══════════════════════════════════════════════════════════
function sendWeeklyReport() {
  var data = getWeeklyStats();
  var insight = callOpenAI(
    "새론금융대부중개 지난 주 SNS 활동 데이터입니다.\n" +
    "텔레그램 발행: " + data.posts + "건\n" +
    "상담 신청: " + data.inquiries + "건\n" +
    "주력 타겟: " + Object.keys(STRATEGY.TARGET).filter(k=>STRATEGY.TARGET[k]).join(", ") + "\n\n" +
    "다음 3가지를 한국어로 간결하게 작성해주세요:\n" +
    "1. 이번 주 평가 (2줄)\n2. 다음 주 추천 방향 (2줄)\n3. 개선 제안 (1줄)"
  );

  var html = buildReportHTML(data, insight);
  GmailApp.sendEmail(CHANNELS.MANAGER_EMAIL, "[새론금융 AI] 주간 리포트 - " + getWeekLabel(), "", {htmlBody: html});
  Logger.log("주간 리포트 발송 완료");
}

// ══════════════════════════════════════════════════════════
// 내부 함수들
// ══════════════════════════════════════════════════════════
function buildPrompt(schedule) {
  var targets = Object.keys(STRATEGY.TARGET).filter(k=>STRATEGY.TARGET[k]).join(", ");
  return `당신은 새론금융대부중개의 SNS 담당자입니다.

[회사 소개]
새론금융대부중개는 ${STRATEGY.REGION} 담보대출 전문 대부중개업체입니다.
직접 대출을 실행하지 않으며, 조건에 맞는 대부업체를 연결해드리는 중개 서비스만 제공합니다.
현재 주력 타겟: ${targets}

[오늘 게시물 유형]
${schedule.prompt}

[작성 조건]
- 플랫폼: 텔레그램 채널
- 길이: 200~300자
- 이모지 적절히 활용 (3~5개)
- 마지막 줄: 전화 ${STRATEGY.CONTACT.전화} 또는 홈페이지 ${STRATEGY.CONTACT.홈페이지} 언급
- 톤: ${STRATEGY.TONE}

[절대 금지 표현]
${LEGAL.금지표현.join(", ")}

게시물 본문만 작성하세요. 설명 없이 바로 내용만.`;
}

function callOpenAI(prompt) {
  var res = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    headers: { "Authorization": "Bearer " + STRATEGY.OPENAI_KEY, "Content-Type": "application/json" },
    payload: JSON.stringify({ model: STRATEGY.OPENAI_MODEL, messages: [{role:"user", content:prompt}], max_tokens: 1000, temperature: 0.75 })
  });
  return JSON.parse(res.getContentText()).choices[0].message.content.trim();
}

function postToTelegram(text) {
  UrlFetchApp.fetch("https://api.telegram.org/bot" + CHANNELS.TELEGRAM_TOKEN + "/sendMessage", {
    method: "post", contentType: "application/json",
    payload: JSON.stringify({ chat_id: CHANNELS.TELEGRAM_ID, text: text })
  });
}

function containsForbiddenWords(text) {
  return LEGAL.금지표현.some(w => text.includes(w));
}

function logActivity(channel, type, content) {
  try {
    var ss = SpreadsheetApp.openById(CHANNELS.SHEET_ID);
    var sheet = ss.getSheetByName("발행기록") || ss.insertSheet("발행기록");
    if (sheet.getLastRow() === 0) sheet.appendRow(["날짜", "채널", "유형", "내용"]);
    sheet.appendRow([new Date().toLocaleString("ko-KR"), channel, type, content.substring(0, 300)]);
  } catch(e) {}
}

function getWeeklyStats() {
  var posts = 0, inquiries = 0;
  try {
    var ss = SpreadsheetApp.openById(CHANNELS.SHEET_ID);
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
    var pSheet = ss.getSheetByName("발행기록");
    if (pSheet) {
      var rows = pSheet.getDataRange().getValues();
      for (var i=1;i<rows.length;i++) { if(new Date(rows[i][0])>=cutoff) posts++; }
    }
    var iSheet = ss.getSheetByName("상담신청");
    if (iSheet) {
      var iRows = iSheet.getDataRange().getValues();
      for (var j=1;j<iRows.length;j++) { if(new Date(iRows[j][0])>=cutoff) inquiries++; }
    }
  } catch(e) {}
  return { posts: posts, inquiries: inquiries };
}

function buildReportHTML(data, insight) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:'Malgun Gothic',sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
<div style="background:#1e3a5f;color:white;padding:20px;border-radius:8px 8px 0 0;">
  <h2 style="margin:0;">📊 새론금융 AI 주간 리포트</h2>
  <p style="margin:5px 0 0;opacity:.8;">${getWeekLabel()}</p>
</div>
<div style="background:white;padding:20px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,.1);">
  <h3 style="color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px;">📈 지난 주 실적</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr style="background:#f0f4f8;"><td style="padding:12px;font-weight:bold;">SNS 자동 발행</td><td style="padding:12px;font-size:24px;color:#2d7d46;font-weight:bold;text-align:right;">${data.posts}건</td></tr>
    <tr><td style="padding:12px;">홈페이지 상담 신청</td><td style="padding:12px;font-size:24px;color:#e53e3e;font-weight:bold;text-align:right;">${data.inquiries}건</td></tr>
  </table>
  <h3 style="color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px;margin-top:25px;">🤖 AI 분석 & 다음 주 방향</h3>
  <div style="background:#f0f7ff;padding:15px;border-left:4px solid #1e3a5f;border-radius:4px;white-space:pre-line;">${insight}</div>
  <div style="background:#fff3cd;padding:15px;border-radius:4px;margin-top:20px;">
    <strong>⚡ 전략 변경이 필요하시면:</strong><br>
    GitHub에서 SAELOAN_AI_MASTER.gs 파일의 STRATEGY 섹션만 수정하세요.
  </div>
  <hr style="margin:20px 0;border:none;border-top:1px solid #eee;">
  <p style="color:#999;font-size:12px;text-align:center;">이 리포트는 AI가 자동 생성합니다 | 새론금융대부중개<br>등록: 2026-수원-2324 | 010-5927-9205</p>
</div></body></html>`;
}

function getWeekLabel() {
  var now = new Date(), ago = new Date(now); ago.setDate(now.getDate()-7);
  return (ago.getMonth()+1)+"월 "+ago.getDate()+"일 ~ "+(now.getMonth()+1)+"월 "+now.getDate()+"일";
}

// ══════════════════════════════════════════════════════════
// ★ 테스트 (처음 설치 후 아래 함수만 실행해보세요) ★
// ══════════════════════════════════════════════════════════
function TEST_미리보기() {
  var schedule = CONTENT_SCHEDULE[new Date().getDay()];
  var raw = callOpenAI(buildPrompt(schedule));
  var final = raw + LEGAL.고지문;
  Logger.log("=== 오늘 게시물 미리보기 ===\n" + final);
  Logger.log("\n※ 실제 발행하려면 dailyAutoPost() 실행");
}
