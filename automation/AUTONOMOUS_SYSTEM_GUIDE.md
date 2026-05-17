# 🤖 새론금융 완전 자율 AI 시스템 v2.0
## 이희전 팀장은 전략 변경 시에만 개입하면 됩니다

---

## 시스템 작동 개요

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
팀장님 역할: 월 1회 리포트 확인 + 전략 변경 시만 개입
        (작업 시간: 월 30분)

AI 역할: 나머지 365일 24시간 모든 것 자동 처리
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## AI가 자동으로 하는 일 (팀장 개입 없음)

| 시간 | AI가 하는 일 | 사용 도구 |
|---|---|---|
| 매일 오전 8:50 | ChatGPT가 오늘의 게시물 생성 | OpenAI GPT-4o-mini |
| 매일 오전 9:00 | 텔레그램 채널에 자동 발행 | Google AppScript |
| 월·수·금 오전 9:00 | 네이버 블로그 포스팅 초안 이메일 발송 | OpenAI + Gmail |
| 고객 상담신청 즉시 | 팀장 이메일·문자 자동 알림 | Google Forms |
| 매주 월요일 오전 9시 | 주간 실적 + AI 인사이트 리포트 발송 | OpenAI + Gmail |
| 오류 발생 시 | 즉시 팀장에게 경고 이메일 | Gmail |

---

## 현재 사용하는 AI 툴 조합 (전 세계 최적 무료 조합)

### ① OpenAI GPT-4o-mini — 핵심 두뇌
```
역할: 모든 콘텐츠 자동 생성
비용: 월 약 2,000~5,000원 (건당 0.01원 수준)
이유 선택: 한국어 품질 세계 1위, 가장 빠른 처리
```

### ② Google AppScript — 자동화 엔진
```
역할: 매일·매주 정해진 시간에 모든 것 실행
비용: 완전 무료
이유 선택: 구글 인프라 = 99.9% 안정성, 설정 쉬움
```

### ③ Google Forms + Sheets — CRM (고객관리)
```
역할: 상담 신청 수집 + 자동 정리
비용: 완전 무료
이유 선택: 즉시 시작 가능, 별도 설치 불필요
```

### ④ Telegram Bot — SNS 자동발행
```
역할: 생성된 콘텐츠를 구독자에게 즉시 전달
비용: 완전 무료
이유 선택: 국내 대출 정보 커뮤니티 활성화, API 안정적
```

### ⑤ Vercel + GitHub — 홈페이지 자동 운영
```
역할: saeloan.co.kr 24시간 자동 운영
비용: 완전 무료
이유 선택: 이미 설정 완료
```

---

## 전략 변경 방법 (팀장 직접 설정)

### 팀장이 전략을 바꾸고 싶을 때

**단계 1:** 아래 주소 접속
```
https://github.com/HeeJeonLee/saeloan-financial/blob/main/automation/STRATEGY_CONFIG.gs
```

**단계 2:** 화면 오른쪽 연필(✏️) 아이콘 클릭

**단계 3:** 바꾸고 싶은 내용만 수정
```javascript
// 예시: 경매 낙찰 잔금으로 주력 전환 시
FOCUS: {
  자영업자추가자금: false,   ← false로 변경
  구입자금브릿지: false,    ← false로 변경
  신협금고전환: false,
  경매낙찰잔금: true,       ← true로 변경
}
```

**단계 4:** 화면 아래 **"Commit changes"** 클릭

**끝.** 다음 날부터 AI가 새 전략으로 모든 게시물을 자동 작성합니다.

---

## 처음 1회 설치 방법 (총 2시간 소요)

### STEP 1: OpenAI API 키 발급 (20분)
```
1. platform.openai.com 접속 → 구글 계정으로 가입
2. 상단 메뉴 "API keys" 클릭
3. "+ Create new secret key" 클릭
4. 키 복사 (예: sk-proj-xxx...) → 메모장에 저장
5. "Billing" 탭 → 카드 등록 → $5 충전 (약 7,000원, 3~6개월 사용 가능)
```

### STEP 2: 구글 시트 만들기 (5분)
```
1. sheets.google.com → 새 스프레드시트
2. 이름: "새론금융 CRM"
3. URL에서 ID 복사:
   https://docs.google.com/spreadsheets/d/★★여기가ID★★/edit
4. 복사한 ID를 메모장에 저장
```

### STEP 3: AppScript 설치 (40분)
```
1. script.google.com → "새 프로젝트"
2. 프로젝트 이름: "새론금융_완전자동화시스템"
3. 좌측 "+" → 파일 추가 → "스크립트"
4. 파일 3개 만들기:
   - STRATEGY_CONFIG
   - AI_CONTENT_ENGINE
   - WEEKLY_REPORT
5. GitHub에서 각 파일 내용 복사 → 붙여넣기
   (https://github.com/HeeJeonLee/saeloan-financial/tree/main/automation)
6. STRATEGY_CONFIG에서 교체할 것:
   - YOUR_OPENAI_API_KEY → STEP 1에서 복사한 키
   - YOUR_GOOGLE_SHEET_ID → STEP 2에서 복사한 ID
7. AI_CONTENT_ENGINE에서 교체:
   - YOUR_BOT_TOKEN → 텔레그램 봇 토큰
   - @saeloan_apt → 만든 채널 주소
8. WEEKLY_REPORT에서 교체:
   - YOUR_EMAIL@gmail.com → 이희전 이메일
9. 저장 (Ctrl+S)
```

### STEP 4: 트리거 설정 (10분)
```
AppScript 좌측 메뉴 "트리거(시계 아이콘)" 클릭

[트리거 1]
함수: dailyAutoPost
이벤트: 시간 기반 → 매일 → 오전 8:00~9:00

[트리거 2]
함수: generateNaverBlogPost
이벤트: 시간 기반 → 매주 → 월요일 → 오전 9:00

[트리거 3]
함수: sendWeeklyReport
이벤트: 시간 기반 → 매주 → 월요일 → 오전 9:00

[트리거 4] (폼 응답형)
함수: onFormSubmit
이벤트: 스프레드시트 기반 → 폼 제출 시
```

### STEP 5: 테스트 (5분)
```
AI_CONTENT_ENGINE.gs 파일 열기
→ 함수 선택: testOnePost
→ ▶ 실행
→ 하단 로그에 게시물 내용 나오면 성공!
```

---

## 시스템 발전 로드맵 (자동 업데이트 구조)

### 현재 (Phase 1) — 즉시 사용 가능
```
✅ AI 콘텐츠 자동 생성 (OpenAI)
✅ 텔레그램 자동 발행 (매일)
✅ 상담 신청 자동 알림
✅ 주간 리포트 자동 이메일
```

### 3개월 후 (Phase 2) — 건수 월 5건 이상 시
```
□ YouTube Shorts 자동 생성 (HeyGen AI - 얼굴없이 동영상)
□ 인스타그램 자동 발행 (Buffer 연동)
□ 카카오톡 알림톡 자동화 (채널 승인 후)
□ 리드 스코어링 (AI가 가망 고객 우선순위 자동 분류)
```

### 6개월 후 (Phase 3) — 건수 월 20건 이상 시
```
□ AI 챗봇 연결 (saeloan.co.kr에 24시간 상담 봇)
□ 대출 조건 자동 비교 출력 (파트너사 조건 DB화)
□ 고객 CRM 고도화 (HubSpot 무료 플랜 연동)
□ 광고 자동화 (구글 광고 스마트 캠페인)
```

### AI 툴 발전 반영 방법
```
매 분기, 이 대화창(GitHub Copilot)에서 아래 질문:
"새론금융 시스템에 최신 AI 툴 업데이트 해줘"

→ 새로운 AI 툴이 나올 때마다 자동으로 시스템에 통합됩니다
→ 팀장님은 질문 한 줄만 하면 됩니다
```

---

## 팀장 월간 업무 (전체 30분)

```
[매주 월요일 오전] — 5분
  이메일 확인 → AI 주간 리포트 읽기
  → 별다른 이상 없으면 그냥 닫기

[월 1회] — 20분
  주간 리포트 누적 확인
  → 상담 건수 트렌드 확인
  → 전략 변경 필요하면 STRATEGY_CONFIG.gs 수정

[분기 1회] — 5분
  이 대화창에서: "시스템 업데이트 해줘"
  → AI가 최신 툴로 자동 업그레이드
```

---

## 비용 요약

| 항목 | 월 비용 |
|---|---|
| OpenAI API (콘텐츠 생성) | 약 2,000~5,000원 |
| Google AppScript | 무료 |
| Telegram | 무료 |
| Google Forms/Sheets | 무료 |
| Vercel 호스팅 | 무료 |
| GitHub | 무료 |
| **총합** | **약 2,000~5,000원/월** |

---

*v2.0 | 2026-05-17 | 이희전 팀장 전략 개입 최소화 구조*
*저장: https://github.com/HeeJeonLee/saeloan-financial/blob/main/automation/AUTONOMOUS_SYSTEM_GUIDE.md*
