import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, amount, memo } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "이름과 연락처는 필수입니다." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━
  새론금융대부중개 상담신청
━━━━━━━━━━━━━━━━━━━━━━━━━━

 이름     : ${name}
 연락처   : ${phone}
 희망금액 : ${amount || "미입력"}
 문의사항 : ${memo || "없음"}

━━━━━━━━━━━━━━━━━━━━━━━━━━
신청일시 : ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
  `;

  await transporter.sendMail({
    from: `"새론금융 상담신청" <${process.env.SMTP_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `[새론금융] 상담신청 — ${name} (${phone})`,
    text: mailContent,
  });

  return res.status(200).json({ ok: true });
}
