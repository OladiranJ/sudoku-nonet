import { ImageResponse } from "next/og";
import { createServerClient } from "@/server/db/client";

export const runtime = "nodejs";

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: "#d1fae5", text: "#047857" },
  medium: { bg: "#fef3c7", text: "#b45309" },
  hard: { bg: "#ffedd5", text: "#c2410c" },
  expert: { bg: "#fee2e2", text: "#b91c1c" },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params;

  const supabase = createServerClient();

  const { data: game } = await supabase
    .from("games")
    .select(
      "id, user_id, difficulty, time_seconds, error_count, hint_count, is_daily"
    )
    .eq("id", gameId)
    .single();

  if (!game) {
    return new Response("Game not found", { status: 404 });
  }

  let username = "Anonymous";
  if (game.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", game.user_id)
      .single();
    if (profile) username = profile.username;
  }

  const difficultyLabel =
    game.difficulty.charAt(0).toUpperCase() + game.difficulty.slice(1);
  const colors = DIFFICULTY_COLORS[game.difficulty] ?? DIFFICULTY_COLORS.easy;
  const typeLabel = game.is_daily ? "Daily" : "Random";
  const typeBg = game.is_daily ? "#dbeafe" : "#f3e8ff";
  const typeText = game.is_daily ? "#1d4ed8" : "#7e22ce";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #0d9488, #14b8a6, #2dd4bf)",
            display: "flex",
          }}
        />

        {/* Nonet wordmark */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: 8,
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          Nonet
        </div>

        {/* Username */}
        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginBottom: 32,
            display: "flex",
          }}
        >
          by {username}
        </div>

        {/* Badges row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              padding: "8px 20px",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
            }}
          >
            {difficultyLabel}
          </div>
          <div
            style={{
              backgroundColor: typeBg,
              color: typeText,
              padding: "8px 20px",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 600,
              display: "flex",
            }}
          >
            {typeLabel}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
          }}
        >
          {/* Time */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
              }}
            >
              {formatTime(game.time_seconds)}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                marginTop: 4,
                display: "flex",
              }}
            >
              Time
            </div>
          </div>

          {/* Errors */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
              }}
            >
              {game.error_count}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                marginTop: 4,
                display: "flex",
              }}
            >
              Errors
            </div>
          </div>

          {/* Hints */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                color: "#0f172a",
                display: "flex",
              }}
            >
              {game.hint_count}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#94a3b8",
                marginTop: 4,
                display: "flex",
              }}
            >
              Hints
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#cbd5e1",
            display: "flex",
          }}
        >
          nonet.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
