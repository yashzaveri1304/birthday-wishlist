// A satin bow, drawn as SVG so it stays crisp at any size.
export function Bow({
  className,
  idPrefix = "bow",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const g = `${idPrefix}-satin`;
  const s = `${idPrefix}-shade`;
  return (
    <svg viewBox="0 0 240 150" className={className} aria-hidden>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbdce5" />
          <stop offset="0.5" stopColor="#eda5ba" />
          <stop offset="1" stopColor="#f5bccc" />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d9819c" stopOpacity="0.55" />
          <stop offset="1" stopColor="#d9819c" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* tails */}
      <path
        d="M114 70 C100 96 84 118 62 140 L84 138 L92 150 C104 124 116 98 124 74 Z"
        fill={`url(#${g})`}
      />
      <path
        d="M126 70 C140 96 156 118 178 140 L156 138 L148 150 C136 124 124 98 116 74 Z"
        fill={`url(#${g})`}
      />
      {/* loops */}
      <path
        d="M120 62 C96 28 44 10 30 38 C18 64 52 86 120 70 Z"
        fill={`url(#${g})`}
      />
      <path
        d="M120 62 C144 28 196 10 210 38 C222 64 188 86 120 70 Z"
        fill={`url(#${g})`}
      />
      <path
        d="M120 64 C100 44 66 34 52 44 C70 46 96 56 120 68 Z"
        fill={`url(#${s})`}
      />
      <path
        d="M120 64 C140 44 174 34 188 44 C170 46 144 56 120 68 Z"
        fill={`url(#${s})`}
      />
      {/* highlights */}
      <path
        d="M44 34 C58 22 84 26 104 40"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M196 34 C182 22 156 26 136 40"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* knot */}
      <rect x="107" y="52" width="26" height="28" rx="9" fill={`url(#${g})`} />
      <rect
        x="111"
        y="56"
        width="8"
        height="18"
        rx="4"
        fill="#fff"
        fillOpacity="0.45"
      />
    </svg>
  );
}
