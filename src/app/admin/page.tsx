import type { Metadata } from "next";
import { AdminApp } from "./AdminApp";
import { MotionProvider } from "@/components/MotionProvider";

export const metadata: Metadata = {
  title: "Wishlist admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <MotionProvider>
      <AdminApp />
    </MotionProvider>
  );
}
