import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

if (!STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY not set');
}

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Pricing Plans
export const PRICING_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Up to 2 integrations',
      'Basic dashboard',
      '30 days data history',
      'Manual sync only',
    ],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 4900, // $49/month in cents
    priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter',
    features: [
      'Up to 5 integrations',
      'Advanced dashboard',
      '90 days data history',
      'Auto-sync every 6 hours',
      'Email reports',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 19900, // $199/month in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    features: [
      'Unlimited integrations',
      'Full dashboard access',
      'Unlimited data history',
      'Auto-sync every 1 hour',
      'AI-powered insights',
      'PDF reports',
      'Priority support',
      'API access',
    ],
  },
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  planId: PlanId;
  successUrl: string;
  cancelUrl: string;
}) {
  const plan = PRICING_PLANS[params.planId];
  
  if (!plan.priceId) {
    throw new Error('Free plan does not require checkout');
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      userId: params.userId,
      planId: params.planId,
    },
  });

  return session;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return session;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Update subscription
 */
export async function updateSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
}) {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  
  return await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
