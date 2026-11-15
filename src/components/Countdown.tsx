"use client";
import { useEffect, useState } from "react";

const NUMBER_WORDS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
  "twenty-one",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Accepts "YYYY-MM-DD" or "MM-DD". Returns the next birthday at local midnight. */
function nextBirthday(value: string, now: Date): Date | null {
  const parts = value.trim().split("-").map(Number);
  const [month, day] =
    parts.length === 3 ? [parts[1], parts[2]] : [parts[0], parts[1]];
  if (!month || !day || month > 12 || day > 31) return null;
  let target = new Date(now.getFullYear(), month - 1, day);
  if (now.getTime() >= target.getTime() + 86400000)
    target = new Date(now.getFullYear() + 1, month - 1, day);
  return target;
}

const pad = (n: number) => String(n).padStart(2, "0");

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

  if (!now) return <div className="mt-7 h-[3.6rem]" aria-hidden />;
  const target = nextBirthday(birthday, now);
  if (!target) return null;

  const birthYear =
    birthday.trim().split("-").length === 3 ? Number(birthday.slice(0, 4)) : 0;
  const age = birthYear > 1900 ? target.getFullYear() - birthYear : null;
  const ageText = age ? NUMBER_WORDS[age] || String(age) : null;
  const dateText = `${target.getDate()} ${MONTHS[target.getMonth()]}`;
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return (
      <p className="mt-7 font-display text-2xl text-coral italic">
        {ageText
          ? `${ageText[0].toUpperCase()}${ageText.slice(1)} today. Happy birthday!`
          : "Happy birthday!"}
      </p>
    );
  }

  const days = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000) % 24;
  const m = Math.floor(diff / 60000) % 60;
  const s = Math.floor(diff / 1000) % 60;

  return (
    <div className="mt-7">
      <p className="text-[0.95rem] text-ink sm:text-lg">
        {ageText
          ? `Turning ${ageText} on ${dateText}`
          : `Birthday on ${dateText}`}
      </p>
      <p
        className="mt-1 text-sm tabular-nums text-ink-soft sm:text-base"
        role="timer"
        aria-label={`${days} days to go`}
      >
        {days} {days === 1 ? "day" : "days"}, {pad(h)}:{pad(m)}:{pad(s)} to go
      </p>
    </div>
  );
}
