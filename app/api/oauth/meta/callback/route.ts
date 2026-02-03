import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode, getLongLivedToken, getAdAccounts } from '@/lib/integrations/meta';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // userId
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=missing_params`
    );
  }

  try {
    // Exchange code for short-lived token
    const shortLivedTokenData = await getTokensFromCode(code);
    
    // Exchange for long-lived token
    const longLivedTokenData = await getLongLivedToken(shortLivedTokenData.access_token);
    
    // Get ad accounts
    const accounts = await getAdAccounts(longLivedTokenData.access_token);
    const primaryAccount = accounts[0];

    if (!primaryAccount) {
      throw new Error('No ad accounts found');
    }

    // Save integration to database
    await prisma.integration.create({
      data: {
        userId: state,
        platform: 'meta',
        accountId: primaryAccount.id,
        accountName: primaryAccount.name,
        accessToken: longLivedTokenData.access_token,
        expiresAt: longLivedTokenData.expires_in
          ? new Date(Date.now() + longLivedTokenData.expires_in * 1000)
          : null,
        isActive: true,
        syncStatus: 'idle',
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?success=meta`
    );
  } catch (error) {
    console.error('Meta OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/integrations?error=oauth_failed`
    );
  }
}
