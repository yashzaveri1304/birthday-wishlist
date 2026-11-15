import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Aashni Shah";

export const metadata: Metadata = {
  title: owner ? `${owner}'s Birthday Wishlist` : "Birthday Wishlist",
  description: 'Pick a gift, tap "I\'ll get this", and keep it a surprise.',
};

export const viewport: Viewport = {
  themeColor: "#fff8f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
