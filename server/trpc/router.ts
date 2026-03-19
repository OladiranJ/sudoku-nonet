import { router, publicProcedure } from "./init";
import { gameRouter } from "./game";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
