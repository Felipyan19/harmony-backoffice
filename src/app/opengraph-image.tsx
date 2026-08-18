import { ImageResponse } from 'next/og';
import { BrandMark, BRAND_COLORS } from '@/lib/brand-image';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: BRAND_COLORS.harmony900,
        }}
      >
        <BrandMark size={128} radius={24} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: '#ffffff', letterSpacing: -1 }}>
            Harmony Backoffice
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: BRAND_COLORS.gold500 }}>
            Clientes, conversaciones y atención de Harmony Spa
          </div>
        </div>
      </div>
    ),
    size,
  );
}
