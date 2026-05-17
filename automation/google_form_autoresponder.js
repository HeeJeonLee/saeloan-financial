/**
 * 새론금융대부중개 - Google Form 자동응답 시스템
 * Google AppScript (완전 무료)
 *
 * 설치방법:
 * 1. Google Form 만들기 → 우측 상단 점 3개 → 스크립트 편집기
 * 2. 이 코드 전체 붙여넣기
 * 3. YOUR_EMAIL 자리에 이희전 이메일 입력
 * 4. 저장 → 실행 → 트리거 설정 (폼 제출 시 → onFormSubmit)
 */

// ▶ 여기에 받을 이메일 주소 입력
const MANAGER_EMAIL = "YOUR_EMAIL@gmail.com";
const MANAGER_PHONE = "010-5927-9205";
const COMPANY_NAME  = "새론금융대부중개";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 폼 제출 시 자동 실행
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function onFormSubmit(e) {
  const response = e.response;
  const itemResponses = response.getItemResponses();

  // 답변 파싱
  let data = {};
  itemResponses.forEach(item => {
    data[item.getItem().getTitle()] = item.getResponse();
  });

  const name       = data["이름"]          || "미입력";
  const phone      = data["연락처"]         || "미입력";
  const amount     = data["희망 대출금액"]   || "미입력";
  const employment = data["직업/고용형태"]   || "미입력";
  const memo       = data["문의사항"]        || "없음";
  const submitTime = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");

  // ① 담당자(이희전)에게 알림 이메일
  const managerSubject = `[새론금융 상담신청] ${name} 님 - ${submitTime}`;
  const managerBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
  새론금융대부중개 신규 상담신청
━━━━━━━━━━━━━━━━━━━━━━━━━━

▶ 신청 시각  : ${submitTime}
▶ 이름       : ${name}
▶ 연락처     : ${phone}
▶ 희망 금액  : ${amount}
▶ 직업       : ${employment}
▶ 문의사항   : ${memo}

━━━━━━━━━━━━━━━━━━━━━━━━━━
[ 빠른 연락 필요 ]
  전화: ${phone}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;

  GmailApp.sendEmail(MANAGER_EMAIL, managerSubject, managerBody);

  // ② 구글 시트 자동 기록 (CRM)
  logToSheet(submitTime, name, phone, amount, employment, memo);

  // ③ 고객에게 자동 답장 (이메일 입력받은 경우)
  const customerEmail = data["이메일(선택)"] || "";
  if (customerEmail && customerEmail.includes("@")) {
    sendAutoReply(customerEmail, name);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 구글 시트 CRM 자동 기록
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function logToSheet(time, name, phone, amount, employment, memo) {
  // 스프레드시트 ID (※ 폼과 연결된 시트 ID로 변경)
  // Google Form → 응답 탭 → 스프레드시트 아이콘 클릭하여 생성
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("상담신청") || ss.insertSheet("상담신청");

  // 헤더 없으면 추가
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["신청시각", "이름", "연락처", "희망금액", "직업", "문의사항", "처리상태"]);
  }

  sheet.appendRow([time, name, phone, amount, employment, memo, "신규"]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 고객 자동 답장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function sendAutoReply(email, name) {
  const subject = `[새론금융] ${name} 님의 상담신청이 접수되었습니다`;
  const body = `
${name} 님, 안녕하세요.
새론금융대부중개입니다.

상담신청이 정상적으로 접수되었습니다.
담당자가 빠른 시간 내에 연락드리겠습니다.

급하신 경우 아래 번호로 직접 연락주세요.

  ☎ 대표전화: 1555-2137
  📱 직통전화: ${MANAGER_PHONE}

감사합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
새론금융대부중개 | 대표 김덕진
등록번호: 2026-수원-2324
홈페이지: https://saeloan.co.kr
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
※ 과도한 빚은 당신에게 큰 불행을 안겨줄 수 있습니다.
※ 연 6.9~19.9% / 법정최고금리 연 20% 이내
  `;

  GmailApp.sendEmail(email, subject, body);
}
