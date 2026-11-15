"use client";
import { AnimatePresence, motion } from "framer-motion";
import { forwardRef } from "react";
import type { PublicItem } from "@/lib/types";
import { Bow } from "./Bow";

type Props = {
  item: PublicItem;
  index: number;
  mine: boolean;
  onClaim: () => void;
  onUnclaim: () => void;
};

const EASE = [0.22, 1, 0.36, 1] as const;
const flip = {
  initial: { rotateX: -90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1 },
  exit: { rotateX: 90, opacity: 0 },
  transition: { duration: 0.25 },
};

export const GiftCard = forwardRef<HTMLElement, Props>(function GiftCard(
  { item, index, mine, onClaim, onUnclaim },
  ref,
) {
  const taken = item.is_claimed;

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.7, ease: EASE, delay: (index % 3) * 0.08 }}
      className="group flex flex-col"
    >
      {/* Picture */}
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="lift-shadow relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-petal sm:rounded-[1.6rem]"
      >
        <motion.div
          animate={{ opacity: taken ? 0.45 : 1 }}
          transition={{ duration: 0.6 }}
          className="h-full w-full"
        >
          {item.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="zoom-img h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Bow className="w-1/2 opacity-80" idPrefix={`card-${item.id}`} />
            </div>
          )}
        </motion.div>

        {/* Satin ribbon tied across the corner once claimed */}
        <AnimatePresence>
          {taken && (
            <motion.div
              key="ribbon"
              className="pointer-events-none absolute -right-11 top-6 w-44 rotate-45 sm:-right-10 sm:top-7 sm:w-48"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
            >
              <div className="satin py-1.5 text-center font-display text-[0.95rem] text-ink italic shadow-[0_6px_14px_-6px_rgba(166,60,100,0.55)] sm:text-base">
                {mine ? "Yours" : "Taken"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Details */}
      <div className="mt-3.5 flex flex-1 flex-col px-0.5 sm:mt-4">
        <h3 className="font-display text-[1.08rem] leading-snug font-medium text-ink sm:text-[1.35rem]">
          {item.name}
        </h3>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-[0.84rem] sm:text-[0.95rem]">
          {item.price && (
            <span className="tabular-nums text-ink">{item.price}</span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-soft underline decoration-blush decoration-[1.5px] underline-offset-[5px] transition-colors hover:text-coral-deep"
            >
              Shop
            </a>
          )}
        </div>

        <div className="mt-auto pt-3.5" style={{ perspective: 600 }}>
          <AnimatePresence mode="wait" initial={false}>
            {!taken ? (
              <motion.button
                key="claim"
                type="button"
                onClick={onClaim}
                {...flip}
                whileTap={{ scale: 0.96 }}
                className="min-h-11 w-full rounded-full bg-blush px-4 py-2.5 text-[0.9rem] font-semibold text-ink transition-colors hover:bg-satin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:text-[0.95rem]"
              >
                I’ll get this
              </motion.button>
            ) : mine ? (
              <motion.button
                key="mine"
                type="button"
                onClick={onUnclaim}
                {...flip}
                className="min-h-11 w-full rounded-full border border-blush px-4 py-2.5 text-[0.85rem] font-medium text-ink-soft transition-colors hover:border-satin hover:text-ink sm:text-[0.9rem]"
              >
                Changed my mind
              </motion.button>
            ) : (
              <motion.p
                key="taken"
                {...flip}
                className="flex min-h-11 items-center justify-center text-[0.85rem] text-ink-soft sm:text-[0.9rem]"
              >
                Already taken
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.article>
  );
});
