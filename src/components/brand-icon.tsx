export function BrandIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#1c2b1f" />
      <g fill="none" stroke="#dcc08f" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 47c-10-3-17-11-17-24 8 0 14 3 17 11 3-8 9-11 17-11 0 13-7 21-17 24Z" />
        <path d="M32 34V14" />
        <path d="M32 20c-6-7-13-6-17-2 4 6 11 7 17 2Z" />
        <path d="M32 20c6-7 13-6 17-2-4 6-11 7-17 2Z" />
      </g>
    </svg>
  );
}
