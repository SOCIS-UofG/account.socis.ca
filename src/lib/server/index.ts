import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  ...userRouter,
  ...uploadRouter,
});

export type AppRouter = typeof appRouter;
