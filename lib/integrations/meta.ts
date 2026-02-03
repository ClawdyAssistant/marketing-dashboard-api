import axios from 'axios';

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || 'http://localhost:3001/api/oauth/meta/callback';

const SCOPES = 'ads_read,ads_management';

/**
 * Generate OAuth URL for Meta Ads
 */
export function getAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_REDIRECT_URI,
    scope: SCOPES,
    state: userId,
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getTokensFromCode(code: string) {
  const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
    params: {
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: META_REDIRECT_URI,
      code,
    },
  });

  return response.data;
}

/**
 * Get long-lived access token
 */
export async function getLongLivedToken(shortLivedToken: string) {
  const response = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });

  return response.data;
}

/**
 * Get Meta ad accounts
 */
export async function getAdAccounts(accessToken: string) {
  const response = await axios.get('https://graph.facebook.com/v18.0/me/adaccounts', {
    params: {
      access_token: accessToken,
      fields: 'id,name,account_status',
    },
  });

  return response.data.data || [];
}

/**
 * Fetch Meta Ads campaigns
 */
export async function fetchMetaCampaigns(params: {
  accessToken: string;
  accountId: string;
  startDate: string;
  endDate: string;
}) {
  const response = await axios.get(
    `https://graph.facebook.com/v18.0/${params.accountId}/campaigns`,
    {
      params: {
        access_token: params.accessToken,
        fields: 'id,name,status,insights{impressions,clicks,spend,conversions}',
        time_range: JSON.stringify({
          since: params.startDate,
          until: params.endDate,
        }),
      },
    }
  );

  return response.data.data || [];
}
