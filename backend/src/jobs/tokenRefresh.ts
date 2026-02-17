import cron from 'node-cron';
import prisma from '../config/prisma';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktokService';

const instagramService = new InstagramService();
const tiktokService = new TikTokService();

async function refreshTokens() {
  console.log('[Token Refresh] Starting token refresh job...');

  try {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: { lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
          { expiresAt: null }
        ]
      }
    });

    console.log(`[Token Refresh] Found ${accounts.length} accounts to check`);

    for (const account of accounts) {
      try {
        let result;

        if (account.platform === 'instagram' && account.refreshToken) {
          console.log(`[Token Refresh] Refreshing Instagram token for account ${account.id}`);
          result = await instagramService.refreshToken(account.refreshToken);

          await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken || account.refreshToken,
              expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null
            }
          });
        } else if (account.platform === 'tiktok' && account.refreshToken) {
          console.log(`[Token Refresh] Refreshing TikTok token for account ${account.id}`);
          const tokenData = await tiktokService.refreshToken(account.refreshToken);

          await prisma.socialAccount.update({
            where: { id: account.id },
            data: {
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token || account.refreshToken,
              expiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
            }
          });
        } else {
          console.log(`[Token Refresh] Skipping ${account.platform} account ${account.id} - no refresh token`);
        }

        console.log(`[Token Refresh] Successfully refreshed ${account.platform} account ${account.id}`);
      } catch (error) {
        console.error(`[Token Refresh] Failed to refresh ${account.platform} account ${account.id}:`, error);

        await prisma.socialAccount.update({
          where: { id: account.id },
          data: { isActive: false }
        });
      }
    }

    console.log('[Token Refresh] Token refresh job completed');
  } catch (error) {
    console.error('[Token Refresh] Job failed:', error);
  }
}

export function startTokenRefreshCron() {
  cron.schedule('0 */6 * * *', refreshTokens, {
    timezone: 'UTC'
  });

  console.log('[Token Refresh] Cron job scheduled to run every 6 hours');

  refreshTokens();
}

export { refreshTokens };
