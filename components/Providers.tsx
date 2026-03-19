"use client";

import ThemeProvider from "@/components/ThemeProvider";
import { TRPCProvider } from "@/lib/trpc/client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </TRPCProvider>
  );
}
