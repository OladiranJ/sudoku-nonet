/**
 * Achievement badge definitions and client-side detection logic.
 *
 * Game-completion badges are checked after each puzzle completion.
 * Social badges (social_butterfly, challenger) are checked at follow/challenge time.
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
}

export interface GameCompletionContext {
  difficulty: "easy" | "medium" | "hard" | "expert";
  timeSeconds: number;
  errorCount: number;
  hintCount: number;
  totalGamesCompleted: number; // including this game
}

export interface SocialContext {
  followingCount: number;
  challengesIssued: number;
}

export const BADGES: Badge[] = [
  {
    id: "first_solve",
    name: "First Solve",
    description: "Complete your first puzzle",
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Solve Easy in under 3 minutes",
  },
  {
    id: "expert_mind",
    name: "Expert Mind",
    description: "Solve Expert in under 10 minutes",
  },
  {
    id: "clean_sheet",
    name: "Clean Sheet",
    description: "Complete a puzzle with 0 errors",
  },
  {
    id: "hint_free",
    name: "Hint-Free",
    description: "Complete a puzzle with 0 hints",
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Follow 5 or more players",
  },
  {
    id: "challenger",
    name: "Challenger",
    description: "Issue your first challenge",
  },
];

export const VALID_BADGE_IDS = new Set(BADGES.map((b) => b.id));

export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

/**
 * Detect which game-completion badges were earned from this game.
 * Returns an array of badge IDs that should be granted.
 * Does NOT check whether the user already has them — that's handled server-side.
 */
export function detectGameCompletionBadges(
  ctx: GameCompletionContext
): string[] {
  const earned: string[] = [];

  // First Solve — first completed game ever
  if (ctx.totalGamesCompleted === 1) {
    earned.push("first_solve");
  }

  // Speed Demon — Easy < 3 min (180s)
  if (ctx.difficulty === "easy" && ctx.timeSeconds < 180) {
    earned.push("speed_demon");
  }

  // Expert Mind — Expert < 10 min (600s)
  if (ctx.difficulty === "expert" && ctx.timeSeconds < 600) {
    earned.push("expert_mind");
  }

  // Clean Sheet — 0 errors
  if (ctx.errorCount === 0) {
    earned.push("clean_sheet");
  }

  // Hint-Free — 0 hints
  if (ctx.hintCount === 0) {
    earned.push("hint_free");
  }

  return earned;
}

/**
 * Detect which social badges were earned.
 * Returns an array of badge IDs that should be granted.
 */
export function detectSocialBadges(ctx: SocialContext): string[] {
  const earned: string[] = [];

  // Social Butterfly — following 5+ users
  if (ctx.followingCount >= 5) {
    earned.push("social_butterfly");
  }

  // Challenger — issued at least 1 challenge
  if (ctx.challengesIssued >= 1) {
    earned.push("challenger");
  }

  return earned;
}
