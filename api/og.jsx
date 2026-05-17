/**
 * 새론금융대부중개 — Instagram 카드 이미지 자동 생성 API
 * =====================================================
 * URL 예시: /api/og?cat=금융상식
 * 반환: 1080x1080 PNG 이미지 (Instagram 최적 규격)
 *
 * 이 API는 AI 에이전트가 Instagram 게시물을 올릴 때
 * 자동으로 호출합니다. 직접 접근할 필요 없습니다.
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('cat') || '금융상식';

  // 카테고리별 테마 색상 + 아이콘
  const themes = {
    '금융상식': { from: '#1e3a8a', to: '#2563eb', icon: '💡', label: 'FINANCE TIPS' },
    '상담안내': { from: '#065f46', to: '#059669', icon: '📋', label: 'CONSULTATION' },
    '법규안내': { from: '#7c2d12', to: '#dc2626', icon: '⚖️', label: 'LEGAL INFO' },
    '지역정보': { from: '#4c1d95', to: '#7c3aed', icon: '🏠', label: 'LOCAL INFO' },
    'QA':       { from: '#1f2937', to: '#374151', icon: '❓', label: 'FAQ' },
  };
  const t = themes[category] || themes['금융상식'];

  return new ImageResponse(
    (
      <div
        style={{
          background: `linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '80px 64px',
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* 상단 배지 */}
        <div
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '2px solid rgba(255,255,255,0.35)',
            borderRadius: '999px',
            padding: '14px 40px',
            color: 'white',
            fontSize: 26,
            letterSpacing: '4px',
            fontWeight: '600',
          }}
        >
          {t.label}
        </div>

        {/* 중앙 콘텐츠 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          <div style={{ fontSize: 130 }}>{t.icon}</div>

          {/* 전화번호 버튼 */}
          <div
            style={{
              background: '#fbbf24',
              color: '#1e3a8a',
              borderRadius: '999px',
              padding: '20px 56px',
              fontSize: 44,
              fontWeight: '800',
              letterSpacing: '2px',
            }}
          >
            1555-2137
          </div>

          <div style={{ color: '#bfdbfe', fontSize: 30 }}>
            010-5927-9205
          </div>
        </div>

        {/* 하단 회사 정보 */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.25)',
            paddingTop: '32px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ color: 'white', fontSize: 26, fontWeight: '700' }}>
            SAELOAN FINANCIAL
          </div>
          <div
            style={{
              color: '#fbbf24',
              fontSize: 22,
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 20px',
              borderRadius: '8px',
            }}
          >
            FREE · NO FEE · LEGAL
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
