import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import {
  createCheckoutSession,
  createBillingPortalSession,
  PRICING_PLANS,
  type PlanId,
} from '../../lib/stripe';

export const billingRouter = router({
  // Get available plans
  getPlans: protectedProcedure.query(() => {
    return Object.values(PRICING_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features,
    }));
  }),

  // Get current subscription
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    return subscription;
  }),

  // Create checkout session
  createCheckout: protectedProcedure
    .input(z.object({
      planId: z.enum(['FREE', 'STARTER', 'PRO']),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id;
      const userEmail = ctx.user?.email;
      
      if (!userId || !userEmail) throw new Error('Unauthorized');

      if (input.planId === 'FREE') {
        throw new Error('Free plan does not require checkout');
      }

      const session = await createCheckoutSession({
        userId,
        userEmail,
        planId: input.planId as PlanId,
        successUrl: `${process.env.NEXTAUTH_URL}/dashboard?checkout=success`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/settings?checkout=canceled`,
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  // Create billing portal session
  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    const session = await createBillingPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: `${process.env.NEXTAUTH_URL}/settings`,
    });

    return {
      url: session.url,
    };
  }),

  // Cancel subscription
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new Error('Unauthorized');

    const subscription = await ctx.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription');
    }

    // Update in database
    await ctx.prisma.subscription.update({
      where: { userId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    return { success: true };
  }),
});
