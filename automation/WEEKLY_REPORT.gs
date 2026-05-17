/**
 * ★★★ 새론금융 주간 실적 자동 리포트 ★★★
 * 
 * 매주 월요일 오전 9시 → 이희전 팀장 이메일로 자동 발송
 * 
 * 포함 내용:
 * - 지난 주 상담 신청 건수
 * - 채널별 성과 (텔레그램 게시 횟수)
 * - AI 생성 인사이트 (다음 주 집중 방향 추천)
 * - 다음 주 자동 발행 예정 콘텐츠 미리보기
 */

var MANAGER_EMAIL = "YOUR_EMAIL@gmail.com";  // ← 이희전 팀장 이메일로 교체

/**
 * 매주 월요일 오전 9시 자동 실행
 */
function sendWeeklyReport() {
  try {
    var reportData = collectWeeklyData();
    var aiInsight = generateWeeklyInsight(reportData);
    var nextWeekPreview = getNextWeekPreview();
    var emailBody = buildReportEmail(reportData, aiInsight, nextWeekPreview);
    
    GmailApp.sendEmail(
      MANAGER_EMAIL,
      "[새론금융 AI] 주간 리포트 - " + getWeekLabel(),
      "",
      { htmlBody: emailBody }
    );
    
    Logger.log("주간 리포트 발송 완료");
    
  } catch(e) {
    Logger.log("리포트 오류: " + e);
  }
}

/**
 * 지난 주 데이터 수집 (구글 시트 기반)
 */
function collectWeeklyData() {
  var data = {
    상담신청건수: 0,
    텔레그램발행횟수: 0,
    블로그초안생성: 0,
    주요문의유형: {},
    기간: getWeekLabel()
  };
  
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    
    // 상담 신청 시트
    var inquirySheet = ss.getSheetByName("상담신청");
    if (inquirySheet) {
      var rows = inquirySheet.getDataRange().getValues();
      var lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      for (var i = 1; i < rows.length; i++) {
        var rowDate = new Date(rows[i][0]);
        if (rowDate >= lastWeek) {
          data.상담신청건수++;
          var type = rows[i][4] || "기타"; // 문의 유형 컬럼
          data.주요문의유형[type] = (data.주요문의유형[type] || 0) + 1;
        }
      }
    }
    
    // 발행 기록 시트
    var postSheet = ss.getSheetByName("발행기록");
    if (postSheet) {
      var postRows = postSheet.getDataRange().getValues();
      var lastWeek2 = new Date();
      lastWeek2.setDate(lastWeek2.getDate() - 7);
      for (var j = 1; j < postRows.length; j++) {
        if (new Date(postRows[j][0]) >= lastWeek2) {
          data.텔레그램발행횟수++;
        }
      }
    }
    
  } catch(e) {
    Logger.log("데이터 수집 실패 (기본값 사용): " + e);
  }
  
  return data;
}

/**
 * AI가 주간 인사이트 생성
 */
function generateWeeklyInsight(data) {
  var prompt = `당신은 대출 마케팅 전략 컨설턴트입니다.

새론금융대부중개의 지난 주 실적 데이터입니다:
- 상담 신청: ${data.상담신청건수}건
- SNS 게시: ${data.텔레그램발행횟수}회
- 주요 문의 유형: ${JSON.stringify(data.주요문의유형)}
- 현재 주력 상품: ${Object.keys(STRATEGY.FOCUS).filter(k => STRATEGY.FOCUS[k]).join(', ')}
- 타겟 지역: ${STRATEGY.TARGET_AREA}

아래 3가지를 간결하게 한국어로 작성해주세요:
1. 이번 주 성과 평가 (2~3줄)
2. 다음 주 집중할 방향 추천 (2~3줄, 구체적으로)
3. 개선 제안 1가지 (1줄)`;

  try {
    var response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      headers: {
        "Authorization": "Bearer " + STRATEGY.AI.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        model: STRATEGY.AI.MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400
      })
    });
    return JSON.parse(response.getContentText()).choices[0].message.content.trim();
  } catch(e) {
    return "AI 분석 일시 불가 (다음 주 자동 재분석 예정)";
  }
}

/**
 * 다음 주 콘텐츠 미리보기 생성
 */
function getNextWeekPreview() {
  var days = ["일", "월", "화", "수", "목", "금", "토"];
  var types = {
    0: "주간 정보 정리",
    1: "자영업자 사례",
    2: "LTV 한도 안내",
    3: "구입브릿지 설명",
    4: "신협전환 안내",
    5: "Q&A형 콘텐츠",
    6: "시장 동향"
  };
  
  var preview = "";
  var today = new Date();
  for (var i = 1; i <= 7; i++) {
    var d = new Date(today);
    d.setDate(today.getDate() + i);
    preview += "• " + (d.getMonth()+1) + "/" + d.getDate() + "(" + days[d.getDay()] + ") - " + types[d.getDay()] + "\n";
  }
  return preview;
}

/**
 * HTML 이메일 본문 생성
 */
function buildReportEmail(data, insight, preview) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">

<div style="background: #1e3a5f; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
  <h2 style="margin: 0;">📊 새론금융 AI 주간 리포트</h2>
  <p style="margin: 5px 0 0; opacity: 0.8;">${data.기간}</p>
</div>

<div style="background: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

  <h3 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px;">📈 지난 주 실적</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background: #f0f4f8;">
      <td style="padding: 12px; font-weight: bold;">상담 신청 건수</td>
      <td style="padding: 12px; font-size: 24px; color: #e53e3e; font-weight: bold; text-align: right;">${data.상담신청건수}건</td>
    </tr>
    <tr>
      <td style="padding: 12px;">SNS 자동 발행</td>
      <td style="padding: 12px; font-size: 18px; color: #2d7d46; font-weight: bold; text-align: right;">${data.텔레그램발행횟수}회</td>
    </tr>
  </table>

  <h3 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; margin-top: 25px;">🤖 AI 분석 & 다음 주 방향</h3>
  <div style="background: #f0f7ff; padding: 15px; border-left: 4px solid #1e3a5f; border-radius: 4px; white-space: pre-line;">
${insight}
  </div>

  <h3 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; margin-top: 25px;">📅 다음 주 자동발행 예정</h3>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; font-size: 14px; white-space: pre-line; line-height: 1.8;">
${preview}
  </div>
  
  <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin-top: 20px;">
    <strong>⚡ 전략 변경이 필요하시면:</strong><br>
    GitHub에서 <code>automation/STRATEGY_CONFIG.gs</code> 파일만 수정하세요.<br>
    → <a href="https://github.com/HeeJeonLee/saeloan-financial/blob/main/automation/STRATEGY_CONFIG.gs">전략 설정 파일 열기</a>
  </div>

  <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
  <p style="color: #999; font-size: 12px; text-align: center;">
    이 리포트는 AI가 자동 생성합니다 | 새론금융대부중개<br>
    문의: 010-5927-9205 | saeloan.co.kr
  </p>
</div>
</body>
</html>`;
}

function getWeekLabel() {
  var now = new Date();
  var weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return weekAgo.getMonth()+1 + "월 " + weekAgo.getDate() + "일 ~ " + 
         now.getMonth()+1 + "월 " + now.getDate() + "일";
}
