import React, { useState } from "react";
import "./index.css";

const SERVICES = [
  {
    icon: "🏠",
    title: "자영업자 추가자금",
    sub: "은행 생활안정자금 1억 한도 초과",
    desc: "은행 한도가 초과된 자영업자·법인대표님께 아파트 담보 취급 대부업체를 연결해 드립니다.",
    badge: "1억~5억",
  },
];

const STEPS = [
  { num: "01", title: "무료 상담", desc: "아파트 주소·시세·기존대출 조건 전화 상담" },
  { num: "02", title: "대부업체 탐색", desc: "조건에 맞는 대부업체를 찾아 안내" },
  { num: "03", title: "대부업체 연결", desc: "고객님과 대부업체를 연결 (중개 완료)" },
  { num: "04", title: "이후 절차", desc: "서류 접수·심사·실행은 대부업체가 진행" },
];

const LTV_TABLE = [
  { label: "KB시세 15억 이하", bank: "최대 6억", note: "규제지역 LTV 40%" },
  { label: "KB시세 15억~25억", bank: "최대 4억", note: "규제지역 LTV 40%" },
  { label: "KB시세 25억 초과", bank: "최대 2억", note: "규제지역 LTV 40%" },
];

function App() {
  const [form, setForm] = useState({ name: "", phone: "", addr: "", amount: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleConsult = (e) => {
    e.preventDefault();
    const msg =
      `[새론금융 무료상담신청]\n이름: ${form.name}\n연락처: ${form.phone}\n아파트주소: ${form.addr}\n희망금액: ${form.amount}만원`;
    window.location.href = `sms:01059279205?body=${encodeURIComponent(msg)}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── 헤더 ── */}
      <header className="w-full bg-blue-900 text-white shadow sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-blue-200 text-4xl font-extrabold block">등록번호 2026-수원-2324(대부중개업)</span>
            <span className="text-white font-bold text-xl block leading-tight mt-1">믿음이 가는 새론금융대부중개</span>
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
          서울·수도권 아파트담보 대부중개업
        </div>
        <h1 className="text-2xl font-extrabold mb-4 leading-tight">
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
          ※ 실제 금리·한도는 대부업체 심사 조건에 따라 결정됩니다. 새론금융은 중개만 합니다.
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

      {/* ── 무료상담신청 폼 ── */}
      <section id="consult" className="max-w-2xl mx-auto w-full px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">무료 상담 신청</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">
          아래 내용 입력 후 <strong>신청하기</strong>를 누르면 문자 앱이 열리고<br />
          전송하시면 담당자 핸드폰으로 바로 수신됩니다
        </p>
        <div className="bg-white rounded-2xl shadow p-8 space-y-5">
          {/* 대표 정보 */}
          <div className="text-center mb-2">
            <p className="text-gray-500 text-sm">담당 상담사</p>
            <p className="text-xl font-extrabold text-blue-900">김덕진</p>
            <p className="text-gray-400 text-xs">새론금융대부중개 대표 · 등록번호 2026-수원-2324</p>
          </div>

          {sent ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-blue-900 font-bold text-lg">문자 앱이 열렸습니다</p>
              <p className="text-gray-500 text-sm mt-1">전송 버튼을 눌러 발송해 주세요<br />담당자가 빠르게 연락드립니다</p>
              <button onClick={() => setSent(false)} className="mt-4 text-xs text-gray-400 underline">다시 작성</button>
            </div>
          ) : (
            <form onSubmit={handleConsult} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                <input
                  type="text" name="name" required
                  value={form.name} onChange={handleChange}
                  placeholder="홍길동"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">연락처 <span className="text-red-500">*</span></label>
                <input
                  type="tel" name="phone" required
                  value={form.phone} onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">아파트 주소 (지역)</label>
                <input
                  type="text" name="addr"
                  value={form.addr} onChange={handleChange}
                  placeholder="예: 수원 영통구 ○○아파트"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">희망 대출금액 (만원)</label>
                <input
                  type="text" name="amount"
                  value={form.amount} onChange={handleChange}
                  placeholder="예: 10000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-400 text-blue-900 font-bold py-4 rounded-xl text-lg hover:bg-yellow-300 active:scale-95 transition shadow-lg mt-2">
                ✉️ 문자로 상담신청하기
              </button>
            </form>
          )}

          {/* 직접 전화 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 mb-3">또는 바로 전화</p>
            <a href="tel:15552137"
              className="flex items-center justify-center gap-3 w-full bg-blue-800 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 active:scale-95 transition shadow">
              <span className="text-xl">📞</span>
              <span>대표번호 1555-2137</span>
            </a>
          </div>

          <p className="text-xs text-gray-400 text-center">
            ※ 입력하신 정보는 서버에 저장되지 않습니다.<br />
            문자 전송 시 고객님 핸드폰에서 직접 발송됩니다.
          </p>
        </div>
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
              ["등록기관", "수원시청 지역경제과 (031-5191-32181)"],
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

      {/* ── 중개수수료 불법 고지 ── */}
      <section className="max-w-3xl mx-auto w-full px-4 pt-4 pb-0">
        <p className="text-center text-base font-extrabold text-red-700 py-3 border-2 border-red-500 rounded-lg bg-red-50">
          "중개수수료를 요구하거나 받는 것은 불법입니다"
        </p>
      </section>

      {/* ── 법정 고지사항 ── */}
      <section className="max-w-3xl mx-auto w-full px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <h4 className="font-bold text-yellow-800 mb-3 text-lg">⚠ 법정 고지사항 (대부업법 제11조)</h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc ml-4 mb-3">
            <li>대출금리: 연 최고 20% 이내 (법정최고금리)</li>
            <li>대출 시 귀하의 신용등급이 하락할 수 있습니다.</li>
          </ul>
          {/* 상호와 동일 크기, 다른 광고사항과 쉽게 구별 */}
          <div className="space-y-2 mb-3">
            <div className="border-2 border-red-400 rounded-lg px-4 py-2 bg-white">
              <p className="text-base font-semibold text-red-700">• 중개수수료 없음 (대부중개업자는 중개수수료를 받을 수 없습니다)</p>
            </div>
            <div className="border-2 border-red-400 rounded-lg px-4 py-2 bg-white">
              <p className="text-base font-semibold text-red-700">• 과도한 대출은 개인신용평점 하락 및 금융거래 제한의 원인이 될 수 있습니다.</p>
            </div>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc ml-4">
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
