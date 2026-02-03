import axios from 'axios';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/api/oauth/shopify/callback';

const SCOPES = 'read_orders,read_products,read_analytics';

/**
 * Generate OAuth URL for Shopify
 */
export function getAuthUrl(userId: string, shopDomain: string): string {
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state: userId,
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(params: {
  shop: string;
  code: string;
}) {
  const response = await axios.post(
    `https://${params.shop}/admin/oauth/access_token`,
    {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code: params.code,
    }
  );

  return response.data;
}

/**
 * Fetch Shopify orders
 */
export async function fetchShopifyOrders(params: {
  shop: string;
  accessToken: string;
  startDate: string;
  endDate: string;
}) {
  const response = await axios.get(
    `https://${params.shop}/admin/api/2024-01/orders.json`,
    {
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
      },
      params: {
        created_at_min: params.startDate,
        created_at_max: params.endDate,
        status: 'any',
      },
    }
  );

  return response.data.orders || [];
}

/**
 * Get shop info
 */
export async function getShopInfo(params: {
  shop: string;
  accessToken: string;
}) {
  const response = await axios.get(
    `https://${params.shop}/admin/api/2024-01/shop.json`,
    {
      headers: {
        'X-Shopify-Access-Token': params.accessToken,
      },
    }
  );

  return response.data.shop;
}
