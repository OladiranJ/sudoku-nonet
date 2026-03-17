import { router, publicProcedure } from "./init";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: "ok" as const };
  }),
});

export type AppRouter = typeof appRouter;
