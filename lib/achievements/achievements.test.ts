import {
  detectGameCompletionBadges,
  detectSocialBadges,
  BADGES,
  VALID_BADGE_IDS,
  getBadgeById,
  type GameCompletionContext,
  type SocialContext,
} from "./badges";

describe("Badge definitions", () => {
  test("BADGES contains 7 badges", () => {
    expect(BADGES).toHaveLength(7);
  });

  test("VALID_BADGE_IDS matches BADGES", () => {
    expect(VALID_BADGE_IDS.size).toBe(7);
    for (const badge of BADGES) {
      expect(VALID_BADGE_IDS.has(badge.id)).toBe(true);
    }
  });

  test("getBadgeById returns correct badge", () => {
    expect(getBadgeById("first_solve")?.name).toBe("First Solve");
    expect(getBadgeById("nonexistent")).toBeUndefined();
  });
});

describe("detectGameCompletionBadges", () => {
  function makeCtx(
    overrides: Partial<GameCompletionContext> = {}
  ): GameCompletionContext {
    return {
      difficulty: "medium",
      timeSeconds: 300,
      errorCount: 2,
      hintCount: 1,
      totalGamesCompleted: 5,
      ...overrides,
    };
  }

  test("First Solve awarded on first completed game", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ totalGamesCompleted: 1 })
    );
    expect(badges).toContain("first_solve");
  });

  test("First Solve NOT awarded on subsequent games", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ totalGamesCompleted: 2 })
    );
    expect(badges).not.toContain("first_solve");
  });

  test("Speed Demon awarded for Easy < 3 min", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "easy", timeSeconds: 179 })
    );
    expect(badges).toContain("speed_demon");
  });

  test("Speed Demon NOT awarded for Easy at exactly 3 min", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "easy", timeSeconds: 180 })
    );
    expect(badges).not.toContain("speed_demon");
  });

  test("Speed Demon NOT awarded for non-Easy difficulty", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "hard", timeSeconds: 100 })
    );
    expect(badges).not.toContain("speed_demon");
  });

  test("Expert Mind awarded for Expert < 10 min", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "expert", timeSeconds: 599 })
    );
    expect(badges).toContain("expert_mind");
  });

  test("Expert Mind NOT awarded for Expert at exactly 10 min", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "expert", timeSeconds: 600 })
    );
    expect(badges).not.toContain("expert_mind");
  });

  test("Expert Mind NOT awarded for non-Expert difficulty", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({ difficulty: "easy", timeSeconds: 100 })
    );
    expect(badges).not.toContain("expert_mind");
  });

  test("Clean Sheet awarded for 0 errors", () => {
    const badges = detectGameCompletionBadges(makeCtx({ errorCount: 0 }));
    expect(badges).toContain("clean_sheet");
  });

  test("Clean Sheet NOT awarded for errors > 0", () => {
    const badges = detectGameCompletionBadges(makeCtx({ errorCount: 1 }));
    expect(badges).not.toContain("clean_sheet");
  });

  test("Hint-Free awarded for 0 hints", () => {
    const badges = detectGameCompletionBadges(makeCtx({ hintCount: 0 }));
    expect(badges).toContain("hint_free");
  });

  test("Hint-Free NOT awarded for hints > 0", () => {
    const badges = detectGameCompletionBadges(makeCtx({ hintCount: 3 }));
    expect(badges).not.toContain("hint_free");
  });

  test("multiple badges can be earned at once", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({
        difficulty: "easy",
        timeSeconds: 120,
        errorCount: 0,
        hintCount: 0,
        totalGamesCompleted: 1,
      })
    );
    expect(badges).toContain("first_solve");
    expect(badges).toContain("speed_demon");
    expect(badges).toContain("clean_sheet");
    expect(badges).toContain("hint_free");
    expect(badges).not.toContain("expert_mind");
  });

  test("no game-completion badges include social badges", () => {
    const badges = detectGameCompletionBadges(
      makeCtx({
        difficulty: "easy",
        timeSeconds: 60,
        errorCount: 0,
        hintCount: 0,
        totalGamesCompleted: 1,
      })
    );
    expect(badges).not.toContain("social_butterfly");
    expect(badges).not.toContain("challenger");
  });
});

describe("detectSocialBadges", () => {
  function makeCtx(overrides: Partial<SocialContext> = {}): SocialContext {
    return {
      followingCount: 0,
      challengesIssued: 0,
      ...overrides,
    };
  }

  test("Social Butterfly awarded when following 5+ users", () => {
    const badges = detectSocialBadges(makeCtx({ followingCount: 5 }));
    expect(badges).toContain("social_butterfly");
  });

  test("Social Butterfly awarded when following more than 5 users", () => {
    const badges = detectSocialBadges(makeCtx({ followingCount: 10 }));
    expect(badges).toContain("social_butterfly");
  });

  test("Social Butterfly NOT awarded when following < 5 users", () => {
    const badges = detectSocialBadges(makeCtx({ followingCount: 4 }));
    expect(badges).not.toContain("social_butterfly");
  });

  test("Challenger awarded on first challenge issued", () => {
    const badges = detectSocialBadges(makeCtx({ challengesIssued: 1 }));
    expect(badges).toContain("challenger");
  });

  test("Challenger NOT awarded with 0 challenges", () => {
    const badges = detectSocialBadges(makeCtx({ challengesIssued: 0 }));
    expect(badges).not.toContain("challenger");
  });

  test("no social badges include game-completion badges", () => {
    const badges = detectSocialBadges(
      makeCtx({ followingCount: 10, challengesIssued: 5 })
    );
    expect(badges).not.toContain("first_solve");
    expect(badges).not.toContain("speed_demon");
    expect(badges).not.toContain("expert_mind");
    expect(badges).not.toContain("clean_sheet");
    expect(badges).not.toContain("hint_free");
  });
});
