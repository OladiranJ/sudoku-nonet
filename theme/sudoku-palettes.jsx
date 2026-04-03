import { useState } from "react";

const palettes = [
  {
    name: "Warm Sand",
    emoji: "🏖️",
    light: {
      background: "#FFF8F0",
      cell: "#FFFFFF",
      primary: "#D4956A",
      secondary: "#E8C4A0",
      selected: "#FAEBD7",
      text: "#5C4033",
      grid: "#E0D0C0",
      boxBorder: "#C4A882",
    },
    dark: {
      background: "#2C2520",
      cell: "#3A322C",
      primary: "#D4956A",
      secondary: "#8B7355",
      selected: "#5C4A38",
      text: "#E8DDD0",
      grid: "#4A4038",
      boxBorder: "#6B5D4E",
    },
  },
  {
    name: "Forest Dusk",
    emoji: "🌿",
    light: {
      background: "#F5F0E8",
      cell: "#FEFCF8",
      primary: "#7A9E7E",
      secondary: "#B8CFA0",
      selected: "#E8F0E0",
      text: "#4A5540",
      grid: "#D0CDB8",
      boxBorder: "#9AB89E",
    },
    dark: {
      background: "#252D28",
      cell: "#303830",
      primary: "#7A9E7E",
      secondary: "#5A7A5E",
      selected: "#3A4E3E",
      text: "#D8E0D0",
      grid: "#404840",
      boxBorder: "#5A7060",
    },
  },
  {
    name: "Sunset Clay",
    emoji: "🌅",
    light: {
      background: "#FEF6F0",
      cell: "#FFFFFF",
      primary: "#C47D5A",
      secondary: "#E6A87C",
      selected: "#FDE8D8",
      text: "#5A3E30",
      grid: "#E8D8C8",
      boxBorder: "#C8A890",
    },
    dark: {
      background: "#2E2626",
      cell: "#3C3232",
      primary: "#C47D5A",
      secondary: "#8A6048",
      selected: "#564040",
      text: "#E8D8CC",
      grid: "#4A3E3E",
      boxBorder: "#6A5248",
    },
  },
  {
    name: "Lavender Calm",
    emoji: "💜",
    light: {
      background: "#F8F4FA",
      cell: "#FEFEFF",
      primary: "#9B8EC4",
      secondary: "#C4B8D8",
      selected: "#EDE6F5",
      text: "#4A4458",
      grid: "#D8D0E0",
      boxBorder: "#B0A4C8",
    },
    dark: {
      background: "#282630",
      cell: "#32303C",
      primary: "#9B8EC4",
      secondary: "#6A6080",
      selected: "#484058",
      text: "#DCD6E8",
      grid: "#403C4C",
      boxBorder: "#5A5270",
    },
  },
  {
    name: "Amber Glow",
    emoji: "✨",
    light: {
      background: "#FFFBF2",
      cell: "#FFFFFF",
      primary: "#D4A843",
      secondary: "#E8D088",
      selected: "#FFF3D4",
      text: "#5A4E30",
      grid: "#E0D8C0",
      boxBorder: "#C8B878",
    },
    dark: {
      background: "#2A2820",
      cell: "#36332A",
      primary: "#D4A843",
      secondary: "#8A7A40",
      selected: "#4E4830",
      text: "#E8E0C8",
      grid: "#484030",
      boxBorder: "#6A6040",
    },
  },
];

// G = given (puzzle clue), U = user-entered
const miniSudoku = [
  [{ v: 5, t: "G" }, { v: 3, t: "G" }, null,             { v: 4, t: "U" }],
  [{ v: 6, t: "U" }, null,              { v: 1, t: "G" }, { v: 9, t: "G" }],
  [{ v: 8, t: "G" }, null,              null,              { v: 6, t: "G" }],
  [{ v: 3, t: "U" }, { v: 2, t: "G" }, { v: 8, t: "G" }, null            ],
];

function BambooStencil({ color, style }) {
  return (
    <svg
      viewBox="0 0 200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Main bamboo stalk */}
      <path
        d="M100 390 Q98 350 100 310 Q102 270 99 230 Q97 190 100 150 Q103 110 100 70 Q98 40 100 10"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nodes */}
      <ellipse cx="100" cy="310" rx="7" ry="2.5" fill={color} />
      <ellipse cx="100" cy="230" rx="7" ry="2.5" fill={color} />
      <ellipse cx="100" cy="150" rx="7" ry="2.5" fill={color} />
      <ellipse cx="100" cy="70" rx="7" ry="2.5" fill={color} />
      {/* Leaves right cluster */}
      <path
        d="M100 145 Q130 120 160 130 Q135 135 115 150"
        fill={color}
      />
      <path
        d="M100 140 Q140 105 170 108 Q140 118 110 142"
        fill={color}
      />
      <path
        d="M100 150 Q125 145 150 155 Q128 152 108 158"
        fill={color}
      />
      {/* Leaves left cluster */}
      <path
        d="M100 225 Q70 200 40 210 Q65 215 85 230"
        fill={color}
      />
      <path
        d="M100 220 Q60 185 30 188 Q60 198 90 222"
        fill={color}
      />
      <path
        d="M100 232 Q75 228 48 240 Q72 234 92 238"
        fill={color}
      />
      {/* Small upper leaves right */}
      <path
        d="M100 65 Q120 45 145 50 Q122 56 106 70"
        fill={color}
      />
      <path
        d="M100 70 Q125 60 148 68 Q125 68 106 76"
        fill={color}
      />
      {/* Small lower leaves left */}
      <path
        d="M100 305 Q80 285 55 290 Q75 295 94 310"
        fill={color}
      />
      <path
        d="M100 312 Q72 308 50 318 Q72 314 94 316"
        fill={color}
      />
    </svg>
  );
}

function BambooStencil2({ color, style }) {
  return (
    <svg
      viewBox="0 0 180 350"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Thinner secondary stalk */}
      <path
        d="M90 340 Q88 300 90 260 Q92 220 89 180 Q87 140 90 100 Q92 60 90 20"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="90" cy="260" rx="5" ry="2" fill={color} />
      <ellipse cx="90" cy="180" rx="5" ry="2" fill={color} />
      <ellipse cx="90" cy="100" rx="5" ry="2" fill={color} />
      {/* Drooping leaves */}
      <path
        d="M90 178 Q115 155 140 162 Q118 165 96 182"
        fill={color}
      />
      <path
        d="M90 182 Q120 172 142 180 Q118 178 96 188"
        fill={color}
      />
      <path
        d="M90 98 Q60 75 38 82 Q58 86 84 102"
        fill={color}
      />
      <path
        d="M90 102 Q65 92 42 100 Q62 98 84 108"
        fill={color}
      />
      {/* Wispy top leaves */}
      <path
        d="M90 25 Q110 8 132 15 Q112 18 95 30"
        fill={color}
      />
      <path
        d="M90 258 Q68 240 45 248 Q64 250 85 262"
        fill={color}
      />
    </svg>
  );
}

function MiniGrid({ colors, isSelected }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3px",
        background: colors.boxBorder,
        padding: "3px",
        borderRadius: "8px",
        width: "100%",
        aspectRatio: "1",
        boxShadow: isSelected
          ? `0 0 0 3px ${colors.primary}40, 0 8px 24px ${colors.primary}20`
          : `0 2px 8px ${colors.text}10`,
        transition: "box-shadow 0.3s ease",
      }}
    >
      {[0, 1, 2, 3].map((box) => {
        const boxRow = Math.floor(box / 2);
        const boxCol = box % 2;
        return (
          <div
            key={box}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5px",
              background: colors.grid,
              padding: "1.5px",
              borderRadius: "4px",
            }}
          >
            {[0, 1, 2, 3].map((cell) => {
              const cellRow = Math.floor(cell / 2);
              const cellCol = cell % 2;
              const globalRow = boxRow * 2 + cellRow;
              const globalCol = boxCol * 2 + cellCol;
              const entry = miniSudoku[globalRow][globalCol];
              const globalIdx = globalRow * 4 + globalCol;
              const isHighlighted = globalIdx === 5 || globalIdx === 9;
              const isGiven = entry && entry.t === "G";
              const isUser = entry && entry.t === "U";
              return (
                <div
                  key={cell}
                  style={{
                    background: isHighlighted ? colors.selected : colors.cell,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "3px",
                    fontSize: "17px",
                    fontWeight: isGiven ? "700" : "400",
                    color: isGiven
                      ? colors.text
                      : isUser
                        ? colors.primary
                        : colors.secondary,
                    fontFamily: "'Georgia', serif",
                    fontStyle: isUser ? "italic" : "normal",
                    aspectRatio: "1",
                    transition: "background 0.2s ease",
                  }}
                >
                  {entry ? entry.v : ""}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Swatch({ color, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: "pointer",
      }}
      onClick={() => {
        navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={`Click to copy ${color}`}
    >
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "6px",
          background: color,
          border: "1px solid rgba(128,128,128,0.2)",
          flexShrink: 0,
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "scale(1.15)")}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
      />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "11px", opacity: 0.55, lineHeight: 1.2 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            opacity: 0.85,
            lineHeight: 1.3,
          }}
        >
          {copied ? "Copied!" : color}
        </span>
      </div>
    </div>
  );
}

function PaletteCard({ palette, mode, isActive, onSelect }) {
  const colors = palette[mode];
  const stencilColor = mode === "light"
    ? `${colors.text}18`
    : `${colors.text}14`;

  return (
    <div
      onClick={onSelect}
      style={{
        background: colors.background,
        borderRadius: "16px",
        padding: "20px",
        cursor: "pointer",
        border: isActive
          ? `2px solid ${colors.primary}`
          : "2px solid transparent",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          e.currentTarget.style.border = `2px solid ${colors.primary}60`;
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          e.currentTarget.style.border = "2px solid transparent";
      }}
    >
      {/* Bamboo stencil background decorations */}
      <BambooStencil
        color={stencilColor}
        style={{
          width: "120px",
          height: "240px",
          right: "-15px",
          top: "-10px",
          opacity: 0.7,
        }}
      />
      <BambooStencil2
        color={stencilColor}
        style={{
          width: "90px",
          height: "200px",
          left: "-10px",
          bottom: "-10px",
          opacity: 0.5,
          transform: "scaleX(-1)",
        }}
      />
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: colors.primary,
            color: mode === "light" ? "#fff" : colors.text,
            fontSize: "10px",
            fontWeight: "700",
            padding: "3px 8px",
            borderRadius: "20px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Selected
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: colors.text,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span style={{ fontSize: "20px" }}>{palette.emoji}</span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: "700",
            fontFamily: "'Georgia', serif",
            letterSpacing: "-0.3px",
          }}
        >
          {palette.name}
        </span>
      </div>

      <div style={{ width: "60%", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <MiniGrid colors={colors} isSelected={isActive} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
          color: colors.text,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Swatch color={colors.background} label="Background" />
        <Swatch color={colors.cell} label="Cell" />
        <Swatch color={colors.primary} label="Primary" />
        <Swatch color={colors.secondary} label="Secondary" />
        <Swatch color={colors.selected} label="Selected" />
        <Swatch color={colors.text} label="Text" />
        <Swatch color={colors.grid} label="Grid" />
        <Swatch color={colors.boxBorder} label="Box Border" />
      </div>
    </div>
  );
}

export default function SudokuPalettes() {
  const [mode, setMode] = useState("light");
  const [activeIdx, setActiveIdx] = useState(null);

  const outerBg = mode === "light" ? "#F0ECE4" : "#1A1816";
  const outerText = mode === "light" ? "#4A4540" : "#C8C0B4";
  const toggleBg = mode === "light" ? "#E0D8CC" : "#2A2622";
  const toggleActive = mode === "light" ? "#FFFFFF" : "#3C3630";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: outerBg,
        color: outerText,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: "32px 20px",
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              fontFamily: "'Georgia', serif",
              marginBottom: "6px",
              letterSpacing: "-0.5px",
            }}
          >
            Sudoku Color Palettes
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.6, margin: "0 0 20px" }}>
            Click any palette to select it · Click a swatch to copy its hex
          </p>

          <div
            style={{
              display: "inline-flex",
              background: toggleBg,
              borderRadius: "12px",
              padding: "4px",
              gap: "2px",
            }}
          >
            {["light", "dark"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "9px",
                  border: "none",
                  background: mode === m ? toggleActive : "transparent",
                  color: outerText,
                  fontSize: "13px",
                  fontWeight: mode === m ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow:
                    mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  textTransform: "capitalize",
                }}
              >
                {m === "light" ? "☀️ " : "🌙 "}
                {m}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {palettes.map((p, i) => (
            <PaletteCard
              key={p.name}
              palette={p}
              mode={mode}
              isActive={activeIdx === i}
              onSelect={() => setActiveIdx(activeIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
