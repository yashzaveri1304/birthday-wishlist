// Decorative, slowly moving background. Pure CSS animations on transform/opacity.
const BALLOONS = [
  { left: "8%", size: 34, color: "#f2a59b", duration: 26, delay: -4 },
  { left: "78%", size: 42, color: "#c3aef0", duration: 31, delay: -15 },
  { left: "52%", size: 28, color: "#f5c27a", duration: 23, delay: -9 },
  { left: "90%", size: 30, color: "#9fd8c0", duration: 35, delay: -22 },
];

const SPARKLES = [
  { top: "12%", left: "18%", size: 14, delay: 0 },
  { top: "22%", left: "84%", size: 18, delay: 1.2 },
  { top: "48%", left: "6%", size: 12, delay: 2.1 },
  { top: "64%", left: "92%", size: 16, delay: 0.6 },
  { top: "80%", left: "30%", size: 12, delay: 1.7 },
];

function Balloon({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size * 1.9}
      viewBox="0 0 40 76"
      fill="none"
      aria-hidden
    >
      <ellipse cx="20" cy="22" rx="17" ry="21" fill={color} />
      <ellipse cx="13" cy="14" rx="4" ry="6" fill="white" opacity="0.35" />
      <path d="M17 42.5h6l-3 4z" fill={color} />
      <path
        d="M20 46c-4 8 4 14 0 22s3 8 0 8"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.7"
      />
    </svg>
  );
}

function Sparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0z"
        fill="#e3a93c"
      />
    </svg>
  );
}

export function Background() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="blob blob-a"
        style={{
          width: "90vmax",
          height: "90vmax",
          top: "-35vmax",
          left: "-30vmax",
        }}
      />
      <div
        className="blob blob-b"
        style={{
          width: "80vmax",
          height: "80vmax",
          top: "-10vmax",
          right: "-40vmax",
        }}
      />
      <div
        className="blob blob-c"
        style={{
          width: "70vmax",
          height: "70vmax",
          bottom: "-35vmax",
          left: "-10vmax",
        }}
      />
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="twinkle absolute"
          style={{ top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
        >
          <Sparkle size={s.size} />
        </div>
      ))}
      {BALLOONS.map((b, i) => (
        <div
          key={i}
          className="float-up absolute top-0"
          style={{
            left: b.left,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <Balloon color={b.color} size={b.size} />
        </div>
      ))}
    </div>
  );
}
