"use client";
import { motion } from "framer-motion";
import { Countdown } from "./Countdown";

const letter = {
  hidden: { opacity: 0, y: 28, rotate: -8 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 18 },
  },
};

export function Hero({
  owner,
  birthday,
}: {
  owner?: string;
  birthday?: string;
}) {
  const line1 = owner ? `${owner}'s` : "My";
  const line2 = "birthday wishlist";
  const words = [...line1.split(" "), ...line2.split(" ")];

  return (
    <header className="relative mx-auto max-w-3xl px-5 pb-6 pt-14 text-center sm:pt-20">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-ink-soft"
      >
        <span aria-hidden>✦</span> A little list of happy things{" "}
        <span aria-hidden>✦</span>
      </motion.p>

      <h1
        aria-label={`${line1} ${line2}`}
        className="font-display text-[2.7rem] leading-[1.02] font-semibold tracking-tight text-ink sm:text-7xl"
        style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}
      >
        <motion.span
          aria-hidden
          className="inline"
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: { staggerChildren: 0.035, delayChildren: 0.15 },
            },
          }}
        >
          {words.map((word, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {[...word].map((ch, ci) => (
                <motion.span
                  key={ci}
                  variants={letter}
                  className={`inline-block ${wi >= line1.split(" ").length ? "" : "italic text-coral"}`}
                >
                  {ch}
                </motion.span>
              ))}
              {wi < words.length - 1 && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.span>
      </h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg"
      >
        Pick something, tap{" "}
        <strong className="font-semibold text-ink">“I’ll get this”</strong>, and
        it’s yours to give. Nobody else will see who chose what.
      </motion.p>

      {birthday && <Countdown birthday={birthday} />}
    </header>
  );
}
