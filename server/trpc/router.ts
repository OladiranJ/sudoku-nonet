import { router, publicProcedure } from "./init";
import { gameRouter } from "./game";
import { authRouter } from "@/server/auth/auth";
import { inviteRouter } from "./invite";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),
  game: gameRouter,
  auth: authRouter,
  invite: inviteRouter,
});

export type AppRouter = typeof appRouter;
