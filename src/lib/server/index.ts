import { userRouter } from "./routers/users";
import { router } from "./trpc";

export const appRouter = router({
  ...userRouter,
});

export type AppRouter = typeof appRouter;
