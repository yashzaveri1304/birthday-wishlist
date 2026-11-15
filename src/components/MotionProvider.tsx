"use client";
import { MotionConfig } from "framer-motion";

// reducedMotion="user": if the phone has "Reduce motion" on, Framer Motion
// skips movement (transforms) and keeps only gentle fades.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
