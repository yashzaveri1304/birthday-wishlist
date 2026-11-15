"use client";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import type { PublicItem } from "@/lib/types";

type Props = {
  item: PublicItem;
  index: number;
  mine: boolean;
  onClaim: () => void;
  onUnclaim: () => void;
};

const TINTS = [
  "from-peach to-blush",
  "from-lilac to-blush",
  "from-mint to-lilac",
  "from-blush to-peach",
];

export const GiftCard = forwardRef<HTMLElement, Props>(function GiftCard(
  { item, index, mine, onClaim, onUnclaim },
  ref,
) {
  const taken = item.is_claimed;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(index % 6, 5) * 0.07,
      }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      className="lift-shadow group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white/85 shadow-[0_10px_30px_-22px_rgba(67,34,82,0.55)]"
    >
      {/* Picture */}
      <motion.div
        animate={{ opacity: taken ? 0.55 : 1 }}
        transition={{ duration: 0.5 }}
        className={`relative aspect-[16/10] overflow-hidden sm:aspect-[4/3] bg-gradient-to-br ${TINTS[index % TINTS.length]}`}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-6xl"
            aria-hidden
          >
            🎁
          </div>
        )}
      </motion.div>

      {/* "Taken" sticker */}
      <AnimatePresence>
        {taken && (
          <motion.div
            key="sticker"
            initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            exit={{ opacity: 0, scale: 0.4, rotate: 20, transition: { duration: 0.2 } }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 20,
              delay: 0.15,
            }}
            className={`absolute right-3 top-3 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-lg ${
              mine ? "bg-coral text-white" : "bg-ink text-cream"
            }`}
          >
            {mine ? "You’re on it 💝" : "Taken 🎁"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details */}
      <motion.div
        animate={{ opacity: taken && !mine ? 0.7 : 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col gap-1 p-5"
      >
        <h3 className="font-display text-xl leading-snug font-semibold text-ink">
          {item.name}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {item.price && (
            <span className="font-semibold text-coral-deep">{item.price}</span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              Where to buy ↗
            </a>
          )}
        </div>
      </motion.div>

      {/* Action area: flips between states */}
      <div className="px-5 pb-5" style={{ perspective: 600 }}>
        <AnimatePresence mode="wait" initial={false}>
          {!taken ? (
            <motion.button
              key="claim"
              type="button"
              onClick={onClaim}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              whileTap={{ scale: 0.96 }}
              className="w-full rounded-full bg-ink px-5 py-3.5 text-base font-semibold text-cream transition-colors hover:bg-[#3d2a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              I’ll get this
            </motion.button>
          ) : mine ? (
            <motion.div
              key="mine"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between gap-3 rounded-full bg-blush/50 py-1.5 pl-5 pr-1.5"
            >
              <span className="text-sm font-medium text-ink">
                You’re getting this
              </span>
              <button
                type="button"
                onClick={onUnclaim}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
              >
                Undo
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="taken"
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full rounded-full border border-dashed border-line py-3.5 text-center text-sm font-medium text-ink-soft"
            >
              Already taken. Thank you! 🎁
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
});
