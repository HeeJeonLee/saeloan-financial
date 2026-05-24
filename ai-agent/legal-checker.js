/**
 * 새론금융대부중개 — 법규 자동 검사기
 * =====================================================
 * 모든 SNS 게시물이 대부업법을 준수하는지 자동 검사합니다.
 * 문제 발견 시 텔레그램으로 즉시 알림 + 게시 차단
 */

const config = require('./config');

class LegalChecker {
  constructor() {
    this.required = [
      { key: 'companyName', pattern: /새론금융대부중개/, label: '상호명' },
      { key: 'registrationNo', pattern: /2026-수원-2324/, label: '등록번호' },
      { key: 'ceoName', pattern: /김덕진/, label: '대표자 성명' },
      { key: 'validPeriod', pattern: /2026\.05\.07|2029\.05\.06/, label: '등록유효기간' },
      { key: 'maxRate', pattern: /연\s*20%|20\s*%\s*이내/, label: '최고이자율' },
      { key: 'warning1', pattern: /과도한\s*빚|신중하게/, label: '과도한 빚 경고' },
      { key: 'warning2', pattern: /신용등급.*하락|하락.*신용등급/, label: '신용등급 하락 경고' },
      { key: 'brokerage', pattern: /중개수수료.*없음|없음.*중개수수료/, label: '중개수수료 없음' },
    ];
  }

  /**
   * 게시물 내용 전체 검사
   * @param {string} content - 검사할 텍스트
   * @returns {{ pass: boolean, missing: string[], forbidden: string[], score: number }}
   */
  check(content) {
    const result = {
      pass: false,
      missing: [],
      forbidden: [],
      score: 0,
      timestamp: new Date().toISOString(),
    };

    // 1. 금지어 검사
    config.forbiddenWords.forEach(word => {
      if (content.includes(word)) {
        result.forbidden.push(word);
      }
    });

    // 2. 필수 항목 검사 (법정고지문구가 포함된 경우 pass)
    const hasLegalBlock = content.includes('법정 필수 고지사항') ||
                          content.includes(config.legalDisclosure.substring(0, 30));

    if (hasLegalBlock) {
        this.notifyAudit = require('./notifier').notifyAudit;
      // 법정 고지 블록이 통째로 있으면 개별 항목은 skip
      result.score = 100;
    } else {
      // 개별 항목 검사
      this.required.forEach(req => {
        if (!req.pattern.test(content)) {
          result.missing.push(req.label);
        } else {
          result.score += Math.floor(100 / this.required.length);
        }
      });
    }

    // 3. 최종 판정
    result.pass = result.forbidden.length === 0 &&
                  (hasLegalBlock || result.missing.length === 0);

    return result;
  }

  /**
   * 법정 고지문구를 게시물 하단에 자동 추가
   * @param {string} content - 원본 내용
   * @returns {string} - 법정 문구가 추가된 내용
   */
  addLegalDisclosure(content) {
    // 이미 포함된 경우 중복 추가 방지
    if (content.includes('법정 필수 고지사항')) {
      return content;
    }
    return `${content}\n\n${config.legalDisclosure}`;
  }

  /**
   * 검사 결과를 텔레그램 메시지 형식으로 포맷
   */
  formatReport(result, platform, contentPreview) {
    const icon = result.pass ? '✅' : '🚨';
    const status = result.pass ? '통과' : '차단';
    const preview = contentPreview.substring(0, 50) + '...';

    let msg = `${icon} [법규검사 ${status}] ${platform}\n`;
    msg += `📝 내용: ${preview}\n`;
    msg += `⏱️ 시간: ${new Date().toLocaleString('ko-KR')}\n`;

        if (result.missing.length > 0) {
          this.notifyAudit('법정 고지문 누락 감지: 즉시 수정 필요');
        }
    if (result.forbidden.length > 0) {
      msg += `\n🚫 금지어 발견:\n${result.forbidden.map(w => `  - "${w}"`).join('\n')}\n`;
    }

    if (result.missing.length > 0) {
      msg += `\n⚠️ 누락 항목:\n${result.missing.map(m => `  - ${m}`).join('\n')}\n`;
    }

    if (result.pass) {
      msg += `\n✅ 법규 준수 확인 완료 (점수: ${result.score}/100)`;
    } else {
      msg += `\n❌ 게시 차단됨 — 위 문제를 해결 후 재시도`;
    }

    return msg;
  }

  /**
   * 간단한 자가진단 (새 콘텐츠 작성 전)
   */
  selfTest() {
    const testContent = config.legalDisclosure;
    const result = this.check(testContent);
    console.log('법규 검사기 자가진단:', result.pass ? '정상' : '오류');
    return result.pass;
  }
}

// ── 단독 실행 시 테스트 ──────────────────────────────
if (require.main === module) {
  const checker = new LegalChecker();
  
  console.log('=== 법규 검사기 테스트 ===\n');
  
  // 테스트 1: 법정 문구 포함 (통과해야 함)
  const good = '오늘도 새론금융이 도와드립니다!\n\n' + config.legalDisclosure;
  const r1 = checker.check(good);
  console.log('테스트1 (좋은 게시물):', r1.pass ? '✅ 통과' : '❌ 실패');
  
  // 테스트 2: 금지어 포함 (차단해야 함)
  const bad = '100% 승인 보장! 무조건 대출!' + config.legalDisclosure;
  const r2 = checker.check(bad);
  console.log('테스트2 (금지어 포함):', !r2.pass ? '✅ 올바르게 차단' : '❌ 차단 실패');
  console.log('  발견된 금지어:', r2.forbidden);
  
  // 테스트 3: 자동 법정문구 추가
  const plain = '안녕하세요. 새론금융입니다.';
  const withLegal = checker.addLegalDisclosure(plain);
  console.log('\n테스트3 (법정문구 자동추가):', withLegal.includes('법정 필수 고지사항') ? '✅' : '❌');
  
  console.log('\n=== 테스트 완료 ===');
}

module.exports = LegalChecker;
