"use client";
import { motion } from "framer-motion";
import { Bow } from "./Bow";
import { Countdown } from "./Countdown";

const EASE = [0.22, 1, 0.36, 1] as const;

const letter = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function Hero({
  owner,
  birthday,
}: {
  owner?: string;
  birthday?: string;
}) {
  const first = (owner ?? "").trim().split(/\s+/)[0];
  const headline = first ? `${first}’s wishlist` : "My birthday wishlist";
  const words = headline.split(" ");

  return (
    <header className="relative px-5 pb-10 pt-10 text-center sm:pb-14 sm:pt-14">
      {/* The ribbon: one orchestrated opening moment */}
      <div className="relative mx-auto mb-8 h-24 sm:mb-10 sm:h-28" aria-hidden>
        <motion.div
          className="satin absolute inset-x-[-20px] top-[38%] h-[14px] shadow-[0_6px_14px_-8px_rgba(166,60,100,0.5)] sm:h-[16px]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.1, ease: EASE }}
          style={{ transformOrigin: "50% 50%" }}
        />
        <motion.div
          className="absolute left-1/2 top-0 w-36 -translate-x-1/2 sm:w-44"
          initial={{ opacity: 0, scale: 0.6, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 210,
            damping: 15,
            delay: 0.55,
          }}
        >
          <Bow
            className="h-auto w-full drop-shadow-[0_8px_10px_rgba(166,60,100,0.18)]"
            idPrefix="hero"
          />
        </motion.div>
      </div>

      <h1
        aria-label={headline}
        className="mx-auto max-w-4xl font-display text-[3.4rem] leading-[0.95] font-medium tracking-[-0.02em] text-ink italic sm:text-[6.5rem]"
      >
        <motion.span
          aria-hidden
          initial="hidden"
          animate="show"
          variants={{
            show: { transition: { staggerChildren: 0.04, delayChildren: 0.9 } },
          }}
        >
          {words.map((word, wi) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {[...word].map((ch, ci) => (
                <motion.span
                  key={ci}
                  variants={letter}
                  className="inline-block"
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8, ease: EASE }}
      >
        {birthday && <Countdown birthday={birthday} />}
        <p className="mx-auto mt-6 max-w-[34ch] text-[0.98rem] leading-relaxed text-ink-soft sm:text-lg">
          Choose a gift and tap “I’ll get this” to reserve it. Other guests only
          see that it’s taken, never who took it.
        </p>
      </motion.div>
    </header>
  );
}
