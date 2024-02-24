import { uploadRouter } from "./routers/upload";
import { userRouter } from "./routers/users";
import { router } from "./trpc";

export const appRouter = router({
  ...userRouter,
  ...uploadRouter,
});

export type AppRouter = typeof appRouter;
