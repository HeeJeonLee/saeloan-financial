# 새론금융 SNS 시장 재점검 및 시스템 보완안 (2026-05-21)

## 1. 조사 소스
- GitHub 원문: HeeJeonLee/saeloan-financial
- PROJECT_CONTEXT_SOURCE.md
- SNS_SALES_SYSTEM.md
- .github/copilot-instructions.md
- 기존 내부 문서: ai-agent/STATUS.md, 새론금융_AI마케팅_마스터플랜.html, 새론금융_초보자설정가이드.html

## 2. 국내 대부(중개)업체 SNS 실무 패턴 요약
- 블로그/카페 기반 스팸형 홍보가 여전히 많음
- 차별화되는 채널은 짧은 영상(쇼츠/릴스) + 빠른 상담 전환 구조
- 40~60대 전환은 카카오 채널/전화 응답 속도의 영향이 큼
- 실제 실행건수는 SNS 단독보다 파트너십(공인중개사) 결합 시 급증

## 3. 목표 현실성
- 3개월 50건, 6개월 150건은 SNS 단독으로 불리
- 3-Track 병행이 필수:
  - Track 1: AI 자동 콘텐츠(신뢰/인지)
  - Track 2: 공인중개사 파트너십(즉시 유입)
  - Track 3: 카카오/전화 전환(마감)

## 4. 이번 코드 보완 반영 사항
- goal-tracker.js 신설
  - 3개월/6개월 목표 대비 현재 페이스 자동 계산
  - 실행건수 수동 누적 기록 지원 (--add-exec)
  - Telegram 상태 리포트 전송
- master-agent.js 확장
  - Track2 파트너십 메시지 팩 자동 생성
  - Track3 카카오 전환 템플릿 자동 생성
  - 매 실행마다 KPI 페이스 요약 출력/알림
- ai-agent/package.json 스크립트 추가
  - goal:add1 (실행건수 1건 누적)

## 5. 운영 지침 (법규/브랜딩)
- 대외 명의는 김덕진 대표만 사용
- 과장 표현 금지: 100% 승인, 무조건, 확정 등
- 모든 콘텐츠 하단 법정 고지 자동 포함 유지
- 홈페이지 CTA는 saeloan.co.kr 단일 링크 유지

## 6. 12시 기준 즉시 실행 체크
- node master-agent.js
- 생성 파일 확인:
  - generated/track2-partner-pack/
  - generated/track3-kakao-pack/
  - generated/metrics/goals.json
- 실제 실행건수 발생 시:
  - node master-agent.js --add-exec=1

## 7. 다음 확장 제안 (우선순위)
1. 카카오 API/채널 연동 자동응답 실제 발송 연동
2. 파트너별 소개 건수 추적(중개사별 CRM)
3. 조회수/도달/클릭 기반 주제 가중치 자동학습
