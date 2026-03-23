import type { Metadata } from "next";
import { createServerClient } from "@/server/db/client";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ gameId: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
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
    return {
      title: "Result Not Found — Nonet",
      description: "This game result doesn't exist.",
    };
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
  const time = formatTime(game.time_seconds);
  const typeLabel = game.is_daily ? "Daily" : "Random";

  const title = `Nonet — ${username} solved ${difficultyLabel} in ${time}`;
  const description = `Errors: ${game.error_count} | Hints: ${game.hint_count} | ${typeLabel} Puzzle`;
  const ogImageUrl = `/result/${gameId}/og`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${username}'s Sudoku result on Nonet`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function ResultLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
