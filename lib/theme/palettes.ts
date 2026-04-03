/**
 * Color palette definitions for the Nonet Sudoku app.
 * Each palette provides semantic color tokens for both light and dark modes.
 * Derived from theme/sudoku-palettes.jsx reference file.
 */

export interface PaletteColors {
  background: string;
  cell: string;
  primary: string;
  secondary: string;
  selected: string;
  peer: string;
  sameNumber: string;
  text: string;
  grid: string;
  boxBorder: string;
}

export interface Palette {
  id: string;
  name: string;
  emoji: string;
  light: PaletteColors;
  dark: PaletteColors;
}

export const palettes: Palette[] = [
  {
    id: "warm-sand",
    name: "Warm Sand",
    emoji: "\u{1F3D6}\uFE0F",
    light: {
      background: "#FFF8F0",
      cell: "#FFFFFF",
      primary: "#D4956A",
      secondary: "#E8C4A0",
      selected: "#F0A040",
      peer: "#F5E6D0",
      sameNumber: "#F5C882",
      text: "#5C4033",
      grid: "#E0D0C0",
      boxBorder: "#C4A882",
    },
    dark: {
      background: "#2C2520",
      cell: "#3A322C",
      primary: "#D4956A",
      secondary: "#8B7355",
      selected: "#D4956A",
      peer: "#4E4030",
      sameNumber: "#6B5530",
      text: "#E8DDD0",
      grid: "#4A4038",
      boxBorder: "#6B5D4E",
    },
  },
  {
    id: "forest-dusk",
    name: "Forest Dusk",
    emoji: "\u{1F33F}",
    light: {
      background: "#F5F0E8",
      cell: "#FEFCF8",
      primary: "#7A9E7E",
      secondary: "#B8CFA0",
      selected: "#5DA06A",
      peer: "#DEE8D8",
      sameNumber: "#A8D0A0",
      text: "#4A5540",
      grid: "#D0CDB8",
      boxBorder: "#9AB89E",
    },
    dark: {
      background: "#252D28",
      cell: "#303830",
      primary: "#7A9E7E",
      secondary: "#5A7A5E",
      selected: "#5DA06A",
      peer: "#384838",
      sameNumber: "#3E5E3E",
      text: "#D8E0D0",
      grid: "#404840",
      boxBorder: "#5A7060",
    },
  },
  {
    id: "sunset-clay",
    name: "Sunset Clay",
    emoji: "\u{1F305}",
    light: {
      background: "#FEF6F0",
      cell: "#FFFFFF",
      primary: "#C47D5A",
      secondary: "#E6A87C",
      selected: "#E07840",
      peer: "#F5E0D0",
      sameNumber: "#E8B898",
      text: "#5A3E30",
      grid: "#E8D8C8",
      boxBorder: "#C8A890",
    },
    dark: {
      background: "#2E2626",
      cell: "#3C3232",
      primary: "#C47D5A",
      secondary: "#8A6048",
      selected: "#C47D5A",
      peer: "#4A3838",
      sameNumber: "#604838",
      text: "#E8D8CC",
      grid: "#4A3E3E",
      boxBorder: "#6A5248",
    },
  },
  {
    id: "lavender-calm",
    name: "Lavender Calm",
    emoji: "\u{1F49C}",
    light: {
      background: "#F8F4FA",
      cell: "#FEFEFF",
      primary: "#9B8EC4",
      secondary: "#C4B8D8",
      selected: "#8B78C0",
      peer: "#E8E0F0",
      sameNumber: "#C8B8E0",
      text: "#4A4458",
      grid: "#D8D0E0",
      boxBorder: "#B0A4C8",
    },
    dark: {
      background: "#282630",
      cell: "#32303C",
      primary: "#9B8EC4",
      secondary: "#6A6080",
      selected: "#8B78C0",
      peer: "#3C384A",
      sameNumber: "#504868",
      text: "#DCD6E8",
      grid: "#403C4C",
      boxBorder: "#5A5270",
    },
  },
  {
    id: "amber-glow",
    name: "Amber Glow",
    emoji: "\u2728",
    light: {
      background: "#FFFBF2",
      cell: "#FFFFFF",
      primary: "#D4A843",
      secondary: "#E8D088",
      selected: "#E8A020",
      peer: "#F5EBD0",
      sameNumber: "#F0D070",
      text: "#5A4E30",
      grid: "#E0D8C0",
      boxBorder: "#C8B878",
    },
    dark: {
      background: "#2A2820",
      cell: "#36332A",
      primary: "#D4A843",
      secondary: "#8A7A40",
      selected: "#D4A843",
      peer: "#40382A",
      sameNumber: "#5A4E28",
      text: "#E8E0C8",
      grid: "#484030",
      boxBorder: "#6A6040",
    },
  },
];

export const DEFAULT_PALETTE_ID = "warm-sand";

export function getPaletteById(id: string): Palette {
  return palettes.find((p) => p.id === id) ?? palettes[0];
}

/**
 * Returns the active color set for a palette given the current theme mode.
 */
export function getActiveColors(palette: Palette, mode: "light" | "dark"): PaletteColors {
  return palette[mode];
}

/**
 * Generates CSS custom property declarations for a palette color set.
 */
export function getPaletteCSSVars(colors: PaletteColors): Record<string, string> {
  return {
    "--p-bg": colors.background,
    "--p-cell": colors.cell,
    "--p-primary": colors.primary,
    "--p-secondary": colors.secondary,
    "--p-selected": colors.selected,
    "--p-peer": colors.peer,
    "--p-same-number": colors.sameNumber,
    "--p-text": colors.text,
    "--p-grid": colors.grid,
    "--p-box": colors.boxBorder,
    // Derived utility colors
    "--p-primary-hover": adjustAlpha(colors.primary, 0.15),
    "--p-primary-soft": adjustAlpha(colors.primary, 0.08),
    "--p-text-muted": adjustAlpha(colors.text, 0.55),
    "--p-text-subtle": adjustAlpha(colors.text, 0.35),
    "--p-cell-hover": adjustAlpha(colors.primary, 0.06),
    "--p-error": "#dc2626",
    "--p-error-bg-light": "#fef2f2",
    "--p-error-bg-dark": "rgba(153, 27, 27, 0.4)",
  };
}

function adjustAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
