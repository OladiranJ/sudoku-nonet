"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";
import { useAudioStore } from "@/lib/store/audioStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateAudio = useAudioStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTheme();
    hydrateAudio();
  }, [hydrateTheme, hydrateAudio]);

  return <>{children}</>;
}
