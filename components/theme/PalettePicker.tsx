"use client";

import { useState, useRef, useEffect } from "react";
import { useThemeStore } from "@/lib/store/themeStore";
import { palettes, getPaletteById, getActiveColors } from "@/lib/theme/palettes";

function PaletteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="10.5" r="2.5" />
      <circle cx="8.5" cy="7.5" r="2.5" />
      <circle cx="6.5" cy="12" r="2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

/** Small preview of a palette's colors */
function PaletteSwatch({ paletteId, isActive }: { paletteId: string; isActive: boolean }) {
  const theme = useThemeStore((s) => s.theme);
  const palette = getPaletteById(paletteId);
  const colors = getActiveColors(palette, theme);

  return (
    <div
      className="flex gap-0.5 rounded-sm overflow-hidden"
      style={{ width: 28, height: 16 }}
    >
      <div style={{ flex: 1, background: colors.primary }} />
      <div style={{ flex: 1, background: colors.secondary }} />
      <div style={{ flex: 1, background: colors.selected }} />
      <div style={{ flex: 1, background: colors.boxBorder }} />
    </div>
  );
}

export default function PalettePicker() {
  const [open, setOpen] = useState(false);
  const paletteId = useThemeStore((s) => s.paletteId);
  const theme = useThemeStore((s) => s.theme);
  const setPalette = useThemeStore((s) => s.setPalette);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Change color palette"
        data-testid="nav-palette"
        className="p-2 rounded-lg transition-colors duration-150 cursor-pointer"
        style={{
          color: "var(--p-text)",
          ...(open ? { background: "var(--p-primary-hover)" } : {}),
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "var(--p-primary-soft)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <PaletteIcon />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
          style={{
            background: "var(--p-cell)",
            border: "1px solid var(--p-grid)",
            boxShadow: `0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)`,
            minWidth: 220,
          }}
        >
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--p-text-muted)", borderBottom: "1px solid var(--p-grid)" }}
          >
            Color Palette
          </div>
          <div className="py-1">
            {palettes.map((p) => {
              const isActive = p.id === paletteId;
              const colors = getActiveColors(p, theme);
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPalette(p.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                  style={{
                    color: "var(--p-text)",
                    background: isActive ? "var(--p-primary-soft)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "var(--p-cell-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isActive ? "var(--p-primary-soft)" : "transparent";
                  }}
                  data-palette={p.id}
                >
                  {/* Mini color preview */}
                  <div
                    className="flex gap-px rounded-md overflow-hidden flex-shrink-0"
                    style={{
                      width: 32,
                      height: 20,
                      border: isActive ? `2px solid ${colors.primary}` : "2px solid transparent",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ flex: 1, background: colors.primary }} />
                    <div style={{ flex: 1, background: colors.secondary }} />
                    <div style={{ flex: 1, background: colors.boxBorder }} />
                    <div style={{ flex: 1, background: colors.background }} />
                  </div>

                  <span className="text-sm font-medium flex-1">
                    <span className="mr-1.5">{p.emoji}</span>
                    {p.name}
                  </span>

                  {isActive && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--p-primary)" }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
