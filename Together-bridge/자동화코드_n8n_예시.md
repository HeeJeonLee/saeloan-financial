# n8n 자동화 플로우 예시

## 1. 신규 문의 자동 등록
- Trigger: Webhook (고객/파트너 문의 폼)
- Action: Google Sheets → 신규 row 추가

## 2. 파트너사 자동 알림
- Trigger: Google Sheets row 추가
- Action: Email/카카오톡/텔레그램 자동 발송

## 3. 실적 집계/리포트 자동화
- Trigger: 매월 1일 Cron
- Action: Google Sheets 집계 → Email/카카오톡 자동 리포트 발송

## 4. SNS/블로그/유튜브 자동 발행
- Trigger: Google Sheets row 추가(콘텐츠)
- Action: Claude/Gemini API로 콘텐츠 생성 → SNS/YouTube API로 자동 발행

---

### n8n 워크플로우 예시(JSON)

```json
{
  "nodes": [
    {"name": "Webhook", "type": "n8n-nodes-base.webhook"},
    {"name": "Google Sheets", "type": "n8n-nodes-base.googleSheets"},
    {"name": "Email", "type": "n8n-nodes-base.emailSend"},
    {"name": "HTTP Request", "type": "n8n-nodes-base.httpRequest"}
  ],
  "connections": {
    "Webhook": ["Google Sheets"],
    "Google Sheets": ["Email", "HTTP Request"]
  }
}
```
