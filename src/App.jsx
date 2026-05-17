import React, { useState } from "react";
import "./index.css";

const LOAN_PARTNERS = [
  { name: "OK저축은행", rate: "연 6.9~19.9%", limit: "최대 3,000만원", feature: "당일승인" },
  { name: "웰컴저축은행", rate: "연 7.5~19.9%", limit: "최대 2,000만원", feature: "비대면" },
  { name: "페퍼저축은행", rate: "연 8.0~19.9%", limit: "최대 2,500만원", feature: "빠른실행" },
  { name: "애큐온저축은행", rate: "연 9.0~19.9%", limit: "최대 2,000만원", feature: "소득무관" },
  { name: "OSB저축은행", rate: "연 9.5~19.9%", limit: "최대 1,500만원", feature: "주부가능" },
  { name: "한국투자저축은행", rate: "연 7.0~19.9%", limit: "최대 3,000만원", feature: "신용우대" },
];

const STEPS = [
  { num: "01", title: "무료 한도조회", desc: "신용점수 영향 없이 예상 한도·금리 확인" },
  { num: "02", title: "맞춤 상담", desc: "전담 상담사가 최적 상품 1:1 안내" },
  { num: "03", title: "서류 접수", desc: "비대면 간편 서류 제출 (앱/카카오)" },
  { num: "04", title: "당일 실행", desc: "승인 후 당일 입금 처리" },
];

function App() {
  const [form, setForm] = useState({ name: "", phone: "", amount: "", memo: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return alert("이름과 연락처를 입력해 주세요.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("서버 오류");
      setSubmitted(true);
    } catch {
      alert("전송 중 오류가 발생했습니다. 전화(1555-2137)로 문의해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── 헤더 ── */}
      <header className="w-full bg-blue-900 text-white shadow sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="새론금융대부중개 로고"
              style={{ height: "64px" }}
              onError={(e) => { e.target.style.display = "none"; }} />
          </div>
          <a href="tel:15552137"
            className="bg-yellow-400 text-blue-900 font-bold px-4 py-2 rounded-full text-sm hover:bg-yellow-300 transition">
            ☎ 1555-2137
          </a>
        </div>
      </header>

      {/* ── 히어로 ── */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
          합리적 한도, 신속한 상담<br />
          <span className="text-yellow-300">새론금융대부중개</span>
        </h1>
        <p className="text-blue-100 mb-8 text-lg">
          전국 대형 저축은행·대부사 비교 · 무료 한도조회 · 당일 승인
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#consult"
            className="bg-yellow-400 text-blue-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-300 shadow-lg transition">
            무료 상담신청
          </a>
          <a href="tel:10059279205"
            className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-blue-50 shadow-lg transition">
            📱 010-5927-9205 바로전화
          </a>
        </div>
        <div className="flex justify-center mt-4">
          <a href="tel:15552137"
            className="text-blue-200 underline text-sm hover:text-white transition">
            ☎ 대표전화 1555-2137
          </a>
        </div>
        <p className="mt-6 text-xs text-blue-200">
          ※ 중개수수료 없음 · 신용점수 영향 없는 사전조회 · 대부업법 준수
        </p>
      </section>

      {/* ── 제휴 금융사 ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">제휴 금융사</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">여러 금융사를 한 번에 비교해 가장 유리한 조건을 안내해 드립니다</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOAN_PARTNERS.map((p) => (
            <div key={p.name} className="bg-white rounded-xl shadow p-5 border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{p.feature}</span>
              </div>
              <div className="text-sm text-gray-600 mb-1">금리: <span className="font-semibold text-blue-700">{p.rate}</span></div>
              <div className="text-sm text-gray-600">한도: <span className="font-semibold">{p.limit}</span></div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          ※ 금리·한도는 신용등급·소득 등에 따라 다를 수 있습니다. 실제 조건은 상담 후 확정됩니다.
        </p>
      </section>

      {/* ── 상담 절차 ── */}
      <section className="bg-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">상담 절차</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <div key={s.num} className="bg-white rounded-xl shadow p-5 text-center">
                <div className="text-3xl font-extrabold text-blue-300 mb-2">{s.num}</div>
                <div className="font-bold text-gray-800 mb-1">{s.title}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 상담 신청 폼 ── */}
      <section id="consult" className="max-w-2xl mx-auto w-full px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">무료 상담신청</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">신청 즉시 전담 상담사가 연락드립니다 (평일 09:00~18:00)</p>
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-green-800 text-lg mb-1">상담 신청이 완료되었습니다!</div>
            <div className="text-gray-600 text-sm">
              빠른 시간 내에 연락드리겠습니다.<br />
              급하신 분은 <a href="tel:15552137" className="text-blue-700 font-bold">1555-2137</a>로 바로 전화주세요.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} required
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
                <input name="phone" value={form.phone} onChange={handleChange} required
                  placeholder="010-0000-0000" type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망 대출금액</label>
              <select name="amount" value={form.amount} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm">
                <option value="">선택해 주세요</option>
                <option>500만원 미만</option>
                <option>500~1,000만원</option>
                <option>1,000~2,000만원</option>
                <option>2,000~3,000만원</option>
                <option>3,000만원 이상</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의사항</label>
              <textarea name="memo" value={form.memo} onChange={handleChange} rows={3}
                placeholder="기타 문의사항을 자유롭게 적어주세요."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none" />
            </div>
            <p className="text-xs text-gray-400">
              ※ 입력하신 개인정보는 상담 목적으로만 사용되며, 상담 완료 후 즉시 파기됩니다.
            </p>
            <button type="submit" disabled={submitting}
              className="w-full bg-blue-800 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60">
              {submitting ? "신청 중..." : "무료 상담신청 →"}
            </button>
          </form>
        )}
      </section>

      {/* ── 회사 소개 ── */}
      <section className="bg-gray-100 py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">회사 소개</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            {[
              ["상호", "새론금융대부중개"],
              ["대표자", "김덕진"],
              ["등록번호", "2026-수원-2324(대부중개업)"],
              ["사업자등록번호", "653-90-02268"],
              ["대표전화", "1555-2137"],
              ["대표휴대폰", "010-5927-9205"],
              ["주소", "경기도 수원시 팔달구 권광로 159, 1동 5층 502호(인계동, 수원프라자)"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="font-semibold text-gray-500 min-w-[100px]">{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 법정 고지사항 ── */}
      <section className="max-w-3xl mx-auto w-full px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h4 className="font-bold text-yellow-800 mb-3">⚠ 법정 고지사항 (대부업법 제11조)</h4>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc ml-4">
            <li>대출금리: 연 최고 20% 이내 (법정최고금리)</li>
            <li>중개수수료: 없음 (대부중개업자는 중개수수료를 받을 수 없습니다)</li>
            <li>대출 시 귀하의 신용등급이 하락할 수 있습니다.</li>
            <li>과도한 대출은 개인신용평점 하락 및 금융거래 제한의 원인이 될 수 있습니다.</li>
            <li>새론금융대부중개는 대부중개업체(개인사업자)로, 직접 대출을 실행하지 않습니다.</li>
            <li>대부업 관련 문의·신고: 경기도청 금융정책과 또는 금융감독원(1332)</li>
          </ul>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="w-full bg-gray-900 text-gray-400 py-6 px-4 mt-auto">
        <div className="max-w-5xl mx-auto text-xs text-center space-y-2">
          <div className="flex flex-wrap justify-center gap-4 mb-2">
            <a href="#" className="hover:text-white transition">개인정보처리방침</a>
            <span>|</span>
            <a href="#" className="hover:text-white transition">이용약관</a>
            <span>|</span>
            <a href="tel:15552137" className="hover:text-white transition">대표전화 1555-2137</a>
          </div>
          <p>새론금융대부중개 · 대부중개업 등록: 2026-수원-2324 · 사업자: 653-90-02268</p>
          <p>경기도 수원시 팔달구 권광로 159, 1동 5층 502호 (인계동, 수원프라자)</p>
          <p>&copy; 2026 새론금융대부중개. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
