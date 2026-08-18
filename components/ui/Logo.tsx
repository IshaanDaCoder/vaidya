// A small custom mark for Vaidya: a vital-signs pulse line on a warm
// burnt-orange badge, in the "warmth" half of the existing palette
// (globals.css --warmth) rather than the red "trust" accent used for
// actions — keeps the mark distinct from CTAs while staying in-brand.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Vaidya"
    >
      <defs>
        <linearGradient id="vaidya-logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f0a24a" />
          <stop offset="100%" stopColor="#8a430f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#vaidya-logo-gradient)" />
      <path
        d="M6 17.2h4.9l2.3-6.6L16.4 23l2.5-5.8H26"
        fill="none"
        stroke="#fff6ea"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
