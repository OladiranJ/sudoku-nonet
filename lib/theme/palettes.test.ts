import {
  palettes,
  getPaletteById,
  getActiveColors,
  getPaletteCSSVars,
  DEFAULT_PALETTE_ID,
} from "@/lib/theme/palettes";

describe("palettes", () => {
  it("has 5 defined palettes", () => {
    expect(palettes).toHaveLength(5);
  });

  it("each palette has a unique id", () => {
    const ids = palettes.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each palette has both light and dark color sets", () => {
    for (const p of palettes) {
      expect(p.light).toBeDefined();
      expect(p.dark).toBeDefined();
      expect(p.light.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(p.dark.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("getPaletteById returns the correct palette", () => {
    const p = getPaletteById("forest-dusk");
    expect(p.name).toBe("Forest Dusk");
  });

  it("getPaletteById returns first palette for unknown id", () => {
    const p = getPaletteById("nonexistent");
    expect(p.id).toBe(palettes[0].id);
  });

  it("getActiveColors returns light colors for light mode", () => {
    const p = getPaletteById("warm-sand");
    const colors = getActiveColors(p, "light");
    expect(colors.background).toBe("#FFF8F0");
  });

  it("getActiveColors returns dark colors for dark mode", () => {
    const p = getPaletteById("warm-sand");
    const colors = getActiveColors(p, "dark");
    expect(colors.background).toBe("#2C2520");
  });

  it("getPaletteCSSVars returns all required CSS variables", () => {
    const p = getPaletteById("lavender-calm");
    const vars = getPaletteCSSVars(p.light);
    expect(vars["--p-bg"]).toBe("#F8F4FA");
    expect(vars["--p-primary"]).toBe("#9B8EC4");
    expect(vars["--p-text"]).toBe("#4A4458");
    expect(vars["--p-cell"]).toBe("#FEFEFF");
    expect(vars["--p-grid"]).toBe("#D8D0E0");
    expect(vars["--p-box"]).toBe("#B0A4C8");
    expect(vars["--p-selected"]).toBe("#8B78C0");
    expect(vars["--p-secondary"]).toBe("#C4B8D8");
    // Highlight colors
    expect(vars["--p-peer"]).toBe("#E8E0F0");
    expect(vars["--p-same-number"]).toBe("#C8B8E0");
    // Derived utility colors
    expect(vars["--p-primary-hover"]).toBeDefined();
    expect(vars["--p-primary-soft"]).toBeDefined();
    expect(vars["--p-text-muted"]).toBeDefined();
  });

  it("DEFAULT_PALETTE_ID matches the first palette", () => {
    expect(DEFAULT_PALETTE_ID).toBe("warm-sand");
    const p = getPaletteById(DEFAULT_PALETTE_ID);
    expect(p.name).toBe("Warm Sand");
  });
});

describe("themeStore palette integration", () => {
  const { useThemeStore } = require("@/lib/store/themeStore");

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    useThemeStore.setState({ theme: "light", paletteId: DEFAULT_PALETTE_ID });
  });

  it("setPalette updates the palette id", () => {
    useThemeStore.getState().setPalette("forest-dusk");
    expect(useThemeStore.getState().paletteId).toBe("forest-dusk");
  });

  it("setPalette persists to localStorage", () => {
    useThemeStore.getState().setPalette("lavender-calm");
    expect(localStorage.getItem("nonet:palette")).toBe("lavender-calm");
  });

  it("setPalette applies CSS variables to document", () => {
    useThemeStore.getState().setPalette("amber-glow");
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--p-bg")).toBe("#FFFBF2");
    expect(root.style.getPropertyValue("--p-primary")).toBe("#D4A843");
  });

  it("hydrate restores palette from localStorage", () => {
    localStorage.setItem("nonet:palette", "sunset-clay");
    useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().paletteId).toBe("sunset-clay");
  });

  it("hydrate defaults to warm-sand when no saved palette", () => {
    localStorage.clear();
    useThemeStore.getState().hydrate();
    expect(useThemeStore.getState().paletteId).toBe("warm-sand");
  });

  it("toggling theme re-applies palette with new mode colors", () => {
    useThemeStore.getState().setPalette("warm-sand");
    useThemeStore.getState().toggle(); // to dark
    const root = document.documentElement;
    expect(root.style.getPropertyValue("--p-bg")).toBe("#2C2520");
  });
});
