# 🏦 새론금융대부중개 - GitHub Copilot 영구 지시사항

## ⚠️ 모든 대화 시작 전 반드시 읽을 것

이 프로젝트에서 작업을 시작하기 전에 반드시 아래 파일을 먼저 읽어야 합니다:
- **`PROJECT_CONTEXT_SOURCE.md`** — 프로젝트 전체 맥락, 전략, 설정 정보가 담긴 마스터 파일

---

## 회사 기본 정보

- **상호**: 새론금융대부중개
- **업종**: 대부중개업 (직접 대출 실행 NOT, 대부업체 연결 중개만)
- **등록번호**: 2026-수원-2324
- **담당자**: 이희전 팀장
- **전화**: 010-5927-9205 / 대표: 1555-2137
- **홈페이지**: saeloan.co.kr
- **이메일**: sambo003@daum.net

---

## 절대 불변 원칙 (어떤 작업에서도 위반 금지)

1. 홈페이지(saeloan.co.kr)는 **이희전 팀장 사전 승인 없이 수정 금지**
2. 홈페이지에 SNS영업·비대면영업 관련 표현 절대 삽입 금지
3. 새론금융 = 대부중개업 (연결만 함), 서류접수·심사·실행 = 대부업체가 진행
4. 모든 SNS 게시물에 대부업법 필수 고지문 자동 포함
5. "100% 승인", "무조건", "즉시", "누구나" 등 과장 표현 절대 금지
6. **이희전은 우리은행 대출상담사 팀장 → 대부중개업 겸직 불가** → SNS·광고·콘텐츠에 이희전 이름·직책·소속 절대 노출 금지
7. **모든 SNS·광고·콘텐츠는 김덕진 대표 명의로만 작성** (계정 운영자는 비공개)
8. 얼굴·목소리 출연이 필요한 콘텐츠 → 김덕진 대표 직접 출연 또는 출연 없이 자막·화면 구성만으로 제작
9. SNS 어디에도 "운영자 따로 있음" 암시 표현 금지

---

## 현재 시스템 구성

| 항목 | 내용 |
|---|---|
| AI 엔진 | Google Gemini API (`gemini-1.5-flash`) |
| 자동화 플랫폼 | Google Apps Script |
| SNS 채널 | Telegram (`@saeloan-financial`) |
| CRM | Google Sheets (`1gH4xpqVBvpY9wAoI8wB7s4z7LWBOMR1jSnH2gCuKRZ0`) |
| 홈페이지 | Vercel (saeloan.co.kr) |
| 핵심 스크립트 | `automation/SAELOAN_AI_MASTER.gs` |

---

## 작업 규칙

1. **작업 전**: 반드시 `PROJECT_CONTEXT_SOURCE.md` 읽기
2. **파일 수정 후**: 즉시 `git add . → git commit → git push` 실행
3. **터미널 명령어 우선**: 파일 편집 도구보다 터미널이 빠를 때는 터미널 사용
4. **한글 커밋 메시지**: git 인코딩 설정 완료됨 (UTF-8)
5. **node_modules 내용**: PROJECT_CONTEXT_SOURCE.md에 절대 포함 금지

---

## GitHub 저장소

- **URL**: https://github.com/HeeJeonLee/saeloan-financial
- **브랜치**: main
- **자동 동기화**: 5분마다 `auto_sync.ps1`이 자동 실행됨
