"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/** Accepts "YYYY-MM-DD" or "MM-DD". Returns the next birthday at local midnight. */
function nextBirthday(value: string, now: Date): Date | null {
  const parts = value.trim().split("-").map(Number);
  const [month, day] =
    parts.length === 3 ? [parts[1], parts[2]] : [parts[0], parts[1]];
  if (!month || !day || month > 12 || day > 31) return null;
  let target = new Date(now.getFullYear(), month - 1, day);
  const endOfDay = new Date(target.getTime() + 24 * 3600 * 1000);
  if (now >= endOfDay) target = new Date(now.getFullYear() + 1, month - 1, day);
  return target;
}

export function Countdown({ birthday }: { birthday: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = requestAnimationFrame(tick);
    const t = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(t);
    };
  }, []);

  if (!now) return <div className="mt-8 h-[84px]" aria-hidden />;
  const target = nextBirthday(birthday, now);
  if (!target) return null;

  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-8 font-display text-2xl font-semibold text-coral"
      >
        It’s the big day! 🎉
      </motion.p>
    );
  }

  const units = [
    { label: "days", value: Math.floor(diff / 86400000) },
    { label: "hrs", value: Math.floor(diff / 3600000) % 24 },
    { label: "min", value: Math.floor(diff / 60000) % 60 },
    { label: "sec", value: Math.floor(diff / 1000) % 60 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.5 }}
      className="mt-8 inline-flex items-stretch gap-2 sm:gap-3"
      role="timer"
      aria-label={`${units[0].value} days until the birthday`}
    >
      {units.map((u) => (
        <div
          key={u.label}
          className="min-w-[4.1rem] rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5 shadow-[0_8px_24px_-16px_rgba(67,34,82,0.5)]"
        >
          <div className="font-display text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-ink-soft">
            {u.label}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
