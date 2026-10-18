import { protectedProcedure, publicProcedure, router } from "../index";
import { attachmentRouter } from "./attachment";

export const appRouter = router({
   healthCheck: publicProcedure.query(() => {
      return "OK";
   }),
   privateData: protectedProcedure.query(({ ctx }) => {
      return {
         message: "This is private",
         user: ctx.session.user,
      };
   }),
   attachment: attachmentRouter,
});
export type AppRouter = typeof appRouter;
