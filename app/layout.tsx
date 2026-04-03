import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Nonet \u2014 Sudoku",
  description: "A browser-based Sudoku game with social features and leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body
        className="font-sans transition-colors duration-150"
        style={{ background: "var(--p-bg)", color: "var(--p-text)" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
