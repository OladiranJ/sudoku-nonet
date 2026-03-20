import { router, publicProcedure } from "./init";
import { gameRouter } from "./game";
import { authRouter } from "@/server/auth/auth";
import { inviteRouter } from "./invite";
import { profileRouter } from "./profile";
import { followRouter } from "./follow";
import { feedRouter } from "./feed";
import { challengeRouter } from "./challenge";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),
  game: gameRouter,
  auth: authRouter,
  invite: inviteRouter,
  profile: profileRouter,
  follow: followRouter,
  feed: feedRouter,
  challenge: challengeRouter,
});

export type AppRouter = typeof appRouter;
