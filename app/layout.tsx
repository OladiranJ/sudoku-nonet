import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nonet — Sudoku",
  description: "A browser-based Sudoku game with social features and leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
