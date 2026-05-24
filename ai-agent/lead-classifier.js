// lead-classifier.js
// 리드(고객 문의) 자동 분류(채널, 문의유형, 우선순위 등)
function classifyLead(lead) {
  // lead: {name, phone, channel, message, date}
  let type = '일반';
  let priority = '보통';
  if (/한도|금리|승인|거절/.test(lead.message)) type = '대출조건';
  if (/급해|긴급|오늘|즉시/.test(lead.message)) priority = '긴급';
  if (/사업자|자영업|법인/.test(lead.message)) type = '사업자';
  return { ...lead, type, priority };
}

module.exports = { classifyLead };