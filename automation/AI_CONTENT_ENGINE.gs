/**
 * ★★★ 새론금융 AI 콘텐츠 자동생성 엔진 ★★★
 * 
 * [작동 방식]
 * 매일 오전 8:50분 → OpenAI(ChatGPT)가 그날 게시물 자동 생성
 *                  → 텔레그램 채널에 자동 발행
 *                  → 구글 시트에 기록
 * 
 * [이희전 팀장 개입 불필요]
 * STRATEGY_CONFIG.gs 파일의 전략이 바뀌면 AI가 자동으로 새 방향으로 글을 씁니다.
 * 
 * [설치 방법]
 * 1. script.google.com → 새 프로젝트
 * 2. 파일 2개 만들기: STRATEGY_CONFIG.gs / AI_CONTENT_ENGINE.gs
 * 3. STRATEGY_CONFIG.gs에 위 파일 내용 붙여넣기
 * 4. 이 파일 내용 붙여넣기
 * 5. STRATEGY_CONFIG.gs에서 YOUR_OPENAI_API_KEY 교체
 * 6. 트리거: dailyAutoPost → 매일 08:50
 */

// ── 핵심 채널 설정 ──────────────────────────────
var TELEGRAM_TOKEN = "YOUR_BOT_TOKEN";      // BotFather에서 발급
var TELEGRAM_CHANNEL = "@saeloan_apt";      // 만든 채널 주소
var SHEET_ID = "YOUR_GOOGLE_SHEET_ID";      // 구글 시트 ID (URL에서 복사)
// ──────────────────────────────────────────────

/**
 * 메인 함수: 매일 자동 실행
 */
function dailyAutoPost() {
  try {
    Logger.log("AI 콘텐츠 생성 시작...");
    
    // 1. 오늘의 콘텐츠 유형 결정 (7가지 순환)
    var postType = getTodayPostType();
    
    // 2. OpenAI에게 콘텐츠 생성 요청
    var content = generateContentWithAI(postType);
    
    // 3. 법규 준수 문구 자동 추가
    var finalContent = addLegalDisclaimer(content, postType);
    
    // 4. 텔레그램 발행
    postToTelegram(finalContent);
    
    // 5. 구글 시트에 기록
    logToSheet(postType, finalContent);
    
    Logger.log("✅ 오늘 자동 발행 완료: " + postType);
    
  } catch (e) {
    // 오류 시 팀장에게 이메일 자동 발송
    sendErrorAlert(e.toString());
    Logger.log("❌ 오류 발생: " + e.toString());
  }
}

/**
 * 오늘 요일에 따른 콘텐츠 유형 결정
 * 월~일 7가지 유형을 자동 순환
 */
function getTodayPostType() {
  var day = new Date().getDay(); // 0=일, 1=월 ... 6=토
  
  var schedule = {
    0: "주간_정보_정리",       // 일: 이번 주 주요 부동산 대출 정보 정리
    1: "자영업자_사례",        // 월: 자영업자 성공 사례 (익명)
    2: "LTV_한도_안내",        // 화: 은행 LTV 한도 설명 + 대안
    3: "구입브릿지_설명",      // 수: 구입자금 브릿지 프로세스
    4: "신협전환_안내",        // 목: 3개월 후 신협·금고 전환 절차
    5: "Q&A형_콘텐츠",         // 금: 고객 자주 묻는 질문 답변
    6: "시장_동향",            // 토: 서울·수도권 부동산 시장 동향
  };
  
  // 프로모션 있으면 우선 발행
  if (STRATEGY.PROMOTION) {
    return "프로모션_공지";
  }
  
  return schedule[day];
}

/**
 * OpenAI API로 콘텐츠 자동 생성
 */
function generateContentWithAI(postType) {
  
  // 주력 상품 추출
  var focusProducts = [];
  if (STRATEGY.FOCUS.자영업자추가자금) focusProducts.push("자영업자 생활안정자금 한도 초과 대출 (1억~5억)");
  if (STRATEGY.FOCUS.구입자금브릿지) focusProducts.push("아파트 구입자금 브릿지 대출 (은행 LTV 초과분)");
  if (STRATEGY.FOCUS.신협금고전환) focusProducts.push("대부업 대출 → 신협·새마을금고 전환");
  if (STRATEGY.FOCUS.경매낙찰잔금) focusProducts.push("경매 낙찰 잔금 대출");
  
  // AI에게 보내는 지시문 (프롬프트)
  var prompt = `당신은 새론금융대부중개의 SNS 마케팅 전문가입니다.
  
아래 조건으로 텔레그램 채널 게시물 1개를 작성해주세요.

[회사 정보]
- 상호: 새론금융대부중개
- 전문 분야: ${STRATEGY.TARGET_AREA} 담보대출 중개
- 주력 상품: ${focusProducts.join(', ')}
- 연락처: ${STRATEGY.CONTACT.전화}
- 홈페이지: ${STRATEGY.CONTACT.홈페이지}

[오늘 게시물 유형]
${postType}

[작성 톤]
${STRATEGY.TONE}

[필수 포함 사항]
1. 텔레그램용 이모지 적절히 사용
2. 핵심 내용을 3~5줄로 간결하게
3. 마지막에 행동 유도 (saeloan.co.kr 방문 또는 전화)
4. 총 길이: 200~350자 이내
5. 법규 문구는 내가 별도로 추가할 예정이므로 제외

${STRATEGY.PROMOTION ? '[이번 달 특별 안내]\n' + STRATEGY.PROMOTION : ''}

게시물 본문만 작성해주세요. 설명이나 "본문:" 같은 레이블 없이 바로 게시물 내용만.`;

  // OpenAI API 호출
  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    headers: {
      "Authorization": "Bearer " + STRATEGY.AI.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      model: STRATEGY.AI.MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.8  // 0.8 = 창의적이지만 일관성 유지
    })
  });
  
  var result = JSON.parse(response.getContentText());
  return result.choices[0].message.content.trim();
}

/**
 * 대부업법 필수 고지 문구 자동 추가
 * 법규가 바뀌면 이 함수만 수정하면 됨
 */
function addLegalDisclaimer(content, postType) {
  var disclaimer = `\n\n──────────────
📞 ${STRATEGY.CONTACT.전화} | 무료 사전검토
🌐 ${STRATEGY.CONTACT.홈페이지}
📋 등록: ${STRATEGY.CONTACT.등록번호} (대부중개업)
⚠️ 과도한 빚은 큰 불행을 안겨줄 수 있습니다`;

  return content + disclaimer;
}

/**
 * 텔레그램 채널에 발행
 */
function postToTelegram(text) {
  var url = "https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/sendMessage";
  
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL,
      text: text,
      parse_mode: "HTML"
    })
  });
}

/**
 * 구글 시트에 발행 기록
 */
function logToSheet(postType, content) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("발행기록");
    if (!sheet) {
      sheet = SpreadsheetApp.openById(SHEET_ID).insertSheet("발행기록");
      sheet.appendRow(["날짜", "유형", "내용", "채널"]);
    }
    sheet.appendRow([
      new Date().toLocaleString("ko-KR"),
      postType,
      content.substring(0, 200),
      "텔레그램"
    ]);
  } catch(e) {
    Logger.log("시트 기록 실패 (무시): " + e);
  }
}

/**
 * 오류 발생 시 팀장에게 자동 이메일
 */
function sendErrorAlert(errorMsg) {
  try {
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      "[새론금융 AI] 자동발행 오류 발생",
      "오늘 자동발행 중 오류가 발생했습니다.\n\n오류 내용:\n" + errorMsg + 
      "\n\n조치: script.google.com 에서 확인해주세요.\n\n이 메일은 자동 발송됩니다."
    );
  } catch(e) {}
}

/**
 * ★ 수동 테스트용 (처음 설치 후 이것만 실행해보세요) ★
 */
function testOnePost() {
  var content = generateContentWithAI("자영업자_사례");
  var final = addLegalDisclaimer(content, "자영업자_사례");
  Logger.log("=== 생성된 게시물 미리보기 ===\n" + final);
  // 실제 발행하려면 아래 주석 해제:
  // postToTelegram(final);
}

/**
 * 네이버 블로그용 긴 글 생성 (주 3회 별도 트리거)
 */
function generateNaverBlogPost() {
  var topics = [
    "자영업자가 은행 생활안정자금 1억 한도를 초과할 때 해결책",
    "아파트 매매 잔금 부족할 때 브릿지 대출 완전 정리",
    "대부업 대출을 신협·새마을금고로 전환하는 방법",
    "서울 아파트 LTV 규제 총정리 2026년 최신판",
    "경매 낙찰 후 잔금 마련하는 3가지 방법",
    "아파트담보대출 금리 비교: 은행 vs 대부업 vs 신협",
    "대부중개업체 이용 시 주의사항과 수수료 구조",
  ];
  
  // 이번 주 차례 결정
  var weekNum = Math.floor((new Date() - new Date(2026, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
  var topic = topics[weekNum % topics.length];
  
  var prompt = `당신은 금융 전문 블로거입니다.
  
네이버 블로그에 올릴 SEO 최적화된 포스팅을 작성해주세요.

[주제] ${topic}
[회사] 새론금융대부중개 (${STRATEGY.CONTACT.홈페이지})
[톤] 전문적이고 신뢰감 있게, 실제 사례 포함
[길이] 1500~2000자
[구조] 
  - 도입부: 독자의 공감 유도 (현재 상황)
  - 본론1: 문제 원인과 일반적 해결책
  - 본론2: 새론금융의 차별화된 해결 방식
  - 결론: 행동 유도 (무료 상담)
[필수 키워드 포함]: 아파트담보대출, ${topic.substring(0,10)}, saeloan.co.kr
[하단 고지]: 
  새론금융대부중개 | 등록번호: 2026-수원-2324
  ☎ ${STRATEGY.CONTACT.전화} | ${STRATEGY.CONTACT.홈페이지}
  과도한 빚은 큰 불행을 안겨줄 수 있습니다`;

  var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    headers: {
      "Authorization": "Bearer " + STRATEGY.AI.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify({
      model: STRATEGY.AI.MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2500,
      temperature: 0.7
    })
  });
  
  var result = JSON.parse(response.getContentText());
  var blogContent = result.choices[0].message.content.trim();
  
  // 구글 시트에 저장 (팀장이 복사해서 네이버 블로그에 붙여넣기만 하면 됨)
  saveBlogDraft(topic, blogContent);
  
  // 팀장에게 이메일 발송
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "[새론금융 AI] 이번 주 블로그 초안이 준비됐습니다",
    "안녕하세요! AI가 이번 주 블로그 포스팅 초안을 작성했습니다.\n\n" +
    "주제: " + topic + "\n\n" +
    "=== 포스팅 내용 ===\n\n" + blogContent + "\n\n" +
    "위 내용을 그대로 네이버 블로그에 올려주세요.\n" +
    "수정이 필요하면 이 대화창에서 요청해 주세요."
  );
  
  Logger.log("블로그 초안 이메일 발송 완료: " + topic);
}

function saveBlogDraft(topic, content) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("블로그초안");
    if (!sheet) {
      sheet = SpreadsheetApp.openById(SHEET_ID).insertSheet("블로그초안");
      sheet.appendRow(["날짜", "주제", "내용"]);
    }
    sheet.appendRow([new Date().toLocaleString("ko-KR"), topic, content]);
  } catch(e) {}
}
