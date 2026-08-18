const HARMONY_900 = '#1c2b1f';
const GOLD_500 = '#dcc08f';

const BRAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="${HARMONY_900}"/>
  <g fill="none" stroke="${GOLD_500}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M32 47c-10-3-17-11-17-24 8 0 14 3 17 11 3-8 9-11 17-11 0 13-7 21-17 24Z"/>
    <path d="M32 34V14"/>
    <path d="M32 20c-6-7-13-6-17-2 4 6 11 7 17 2Z"/>
    <path d="M32 20c6-7 13-6 17-2-4 6-11 7-17 2Z"/>
  </g>
</svg>`;

export const BRAND_ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(BRAND_SVG).toString('base64')}`;

export function BrandMark({ size, radius }: { size: number; radius?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_ICON_DATA_URI}
      width={size}
      height={size}
      style={{ borderRadius: radius ?? size * 0.25 }}
      alt=""
    />
  );
}

export const BRAND_COLORS = { harmony900: HARMONY_900, gold500: GOLD_500 };
