import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const owner = process.env.NEXT_PUBLIC_OWNER_NAME || "Aashni Shah";

export const metadata: Metadata = {
  title: owner ? `${owner}'s Birthday Wishlist` : "Birthday Wishlist",
  description: 'Pick a gift, tap "I\'ll get this", and keep it a surprise.',
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${hanken.variable} antialiased`}
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
