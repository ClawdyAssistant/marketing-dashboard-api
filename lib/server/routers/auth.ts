import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const authRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),
  
  // Register new user
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check if user exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email }
      });
      
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
        }
      });
      
      return { success: true, user };
    }),
});
