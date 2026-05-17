import React, { useState } from "react";
import "./index.css";

const SERVICES = [
  {
    icon: "🏠",
    title: "자영업자 추가자금",
    sub: "은행 생활안정자금 1억 한도 초과",
    desc: "은행에서 1억 한도가 막힌 자영업자·법인대표를 위해 아파트 담보로 추가 자금을 안내드립니다.",
    badge: "1억~5억",
  },
];

const STEPS = [
  { num: "01", title: "무료 사전검토", desc: "아파트 주소·시세·기존대출 조건 확인" },
  { num: "02", title: "대부업체 안내", desc: "조건에 맞는 대부업체를 찾아 연결해 드립니다" },
  { num: "03", title: "서류 안내", desc: "필요 서류 목록 및 제출 방법 안내" },
  { num: "04", title: "대부업체 연결", desc: "대부업체와 고객님을 연결 (중개 완료)" },
];

const LTV_TABLE = [
  { label: "KB시세 15억 이하", bank: "최대 6억", note: "규제지역 LTV 40%" },
  { label: "KB시세 15억~25억", bank: "최대 4억", note: "규제지역 LTV 40%" },
  { label: "KB시세 25억 초과", bank: "최대 2억", note: "규제지역 LTV 40%" },
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
        <div className="inline-block bg-yellow-400 text-blue-900 text-xs font-bold px-4 py-1 rounded-full mb-4">
          서울·수도권 아파트담보대출 전문
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
          은행에서 안 된다고요?<br />
          <span className="text-yellow-300">아파트담보 대부업체 연결해 드립니다</span>
        </h1>
        <p className="text-blue-100 mb-3 text-lg">
          자영업자 추가자금 · 은행 한도 초과분
        </p>
        <p className="text-blue-200 mb-8 text-sm">
          중개수수료 0원 · 대부중개업 등록업체
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#consult"
            className="bg-yellow-400 text-blue-900 font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-300 shadow-lg transition">
            무료 사전검토 신청
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
          ※ 중개수수료 없음 · 선입금 요구 없음 · 대부업법 준수 · 등록 2026-수원-2324
        </p>
      </section>

      {/* ── 은행 한도 안내 배너 ── */}
      <section className="bg-red-50 border-b border-red-100 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-700 font-bold text-sm mb-4">⚠ 2026년 현재 은행 아파트담보대출 한도 (규제지역 기준)</p>
          <div className="grid grid-cols-3 gap-3">
            {LTV_TABLE.map((r) => (
              <div key={r.label} className="bg-white rounded-lg p-3 text-center shadow-sm border border-red-100">
                <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                <div className="font-extrabold text-red-600 text-lg">{r.bank}</div>
                <div className="text-xs text-gray-400">{r.note}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-red-600 font-semibold mt-4">
            한도가 부족하다면 → <span className="underline">대부업체 연결 중개를 통해 도움을 드립니다</span>
          </p>
        </div>
      </section>

      {/* ── 핵심 서비스 3가지 ── */}
      <section className="max-w-5xl mx-auto w-full px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">새론금융 중개 서비스</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">은행 한도가 부족한 고객님께 적합한 대부업체를 찾아 연결해 드립니다</p>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md mx-auto">
          {SERVICES.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition">
              <div className="text-4xl mb-3">{s.icon}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-extrabold text-gray-800 text-lg">{s.title}</span>
                <span className="bg-blue-800 text-white text-xs px-2 py-0.5 rounded-full">{s.badge}</span>
              </div>
              <div className="text-blue-700 text-xs font-semibold mb-2">{s.sub}</div>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ※ 실제 금리·한도는 물건 및 개인 조건에 따라 다릅니다. 무료 사전검토 후 확정됩니다.
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
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">무료 상담 신청</h2>
        <p className="text-center text-gray-500 mb-2 text-sm">아파트 주소·시세·기존대출 조건을 알려주시면 맞는 대부업체를 안내해 드립니다</p>
        <p className="text-center text-gray-500 mb-8 text-sm">신청 후 상담사가 연락드립니다 (평일 09:00~18:00)</p>
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
                <option>5,000만원 미만</option>
                <option>5,000만원~1억</option>
                <option>1억~2억</option>
                <option>2억~5억</option>
                <option>5억 이상</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의사항</label>
              <textarea name="memo" value={form.memo} onChange={handleChange} rows={3}
                placeholder="예) 서울 강동구 아파트 10억, 기존대출 3억, 추가 2억 필요 / 자영업자 추가자금 등"
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
            <li>새론금융대부중개는 대부중개업 등록업체로, 대출을 직접 실행하지 않으며 대부업체를 연결하는 중개 서비스만 제공합니다.</li>
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
