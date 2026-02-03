import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const authRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  
  // Register (placeholder)
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // TODO: Hash password, create user
      // For now, just return success
      return { success: true, message: 'Registration endpoint (TODO)' };
    }),
});
