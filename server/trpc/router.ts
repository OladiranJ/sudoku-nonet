import { router, publicProcedure } from "./init";
import { gameRouter } from "./game";
import { authRouter } from "@/server/auth/auth";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),
  game: gameRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
