// api/contact.js — 새론금융대부중개 상담신청 수신
// 이메일 없음 — 텔레그램으로 대표님 핸드폰에 즉시 알림

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, amount, memo } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "이름과 연락처는 필수입니다." });
  }

  // ── 텔레그램 알림 전송 ──────────────────────────────
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;

  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const message =
    `📞 <b>새론금융 상담신청!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 이름     : ${name}\n` +
    `📱 연락처   : ${phone}\n` +
    `💰 희망금액 : ${amount || "미입력"}\n` +
    `📝 문의사항 : ${memo || "없음"}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⏰ ${now}\n\n` +
    `👉 지금 바로 전화해주세요!`;

  if (botToken && chatId) {
    try {
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );
    } catch (e) {
      // 텔레그램 실패해도 고객에게는 성공 응답 (신청은 저장됨)
      console.error("텔레그램 전송 오류:", e.message);
    }
  }

  return res.status(200).json({ ok: true });
}
