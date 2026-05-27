// Google Apps Script 예시: 신규 문의 자동 등록 및 파트너 알림

function onFormSubmit(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('문의');
  var row = sheet.getLastRow();
  var data = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var partnerEmail = data[3]; // 예: 4번째 열이 이메일
  var subject = '[Together-bridge] 신규 문의 접수';
  var body = '신규 문의가 접수되었습니다.\n\n' + data.join(', ');
  MailApp.sendEmail(partnerEmail, subject, body);
}

function sendMonthlyReport() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('실적');
  var data = sheet.getDataRange().getValues();
  var emails = ['a@a.com', 'b@b.com', 'c@c.com']; // 파트너 이메일 리스트
  var subject = '[Together-bridge] 월간 실적 리포트';
  var body = '첨부파일 참고';
  for (var i = 0; i < emails.length; i++) {
    MailApp.sendEmail(emails[i], subject, body);
  }
}
