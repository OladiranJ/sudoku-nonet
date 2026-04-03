"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";
import { useAudioStore } from "@/lib/store/audioStore";
import { useSettingsStore } from "@/lib/store/settingsStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateAudio = useAudioStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTheme();
    hydrateAudio();
    hydrateSettings();
  }, [hydrateTheme, hydrateAudio, hydrateSettings]);

  return <>{children}</>;
}
