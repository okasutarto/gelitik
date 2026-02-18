import { Router } from 'express';
import { InstagramGraphService } from '../services/instagramGraph.service';
import { tokenManager } from '../services/tokenManager';
import { authenticateJwt } from '../middleware/auth.middleware';
import { generateOAuthState, validateOAuthState } from '../config/oauthState';
import prisma from '../config/prisma';
import { FRONTEND_URL } from '../config/env';

const router = Router();
const instagramGraphService = new InstagramGraphService();

// Initiate Instagram Graph API OAuth
router.get('/connect', authenticateJwt, async (req, res) => {
    const userId = (req.user as any)?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!process.env.INSTAGRAM_GRAPH_APP_ID) {
        return res.status(501).json({ error: 'Instagram Graph API not configured' });
    }

    try {
        const state = await generateOAuthState(userId, 'instagram-graph');
        const authUrl = instagramGraphService.getAuthUrl(state);

        res.json({ success: true, data: { authUrl } });
    } catch (error) {
        console.error('[Instagram Graph] Failed to generate auth URL:', error);
        res.status(500).json({ error: 'Failed to generate auth URL' });
    }
});

// OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
        console.error('[Instagram Graph] OAuth error:', oauthError);
        return res.redirect(`${FRONTEND_URL}/connections?error=${oauthError}`);
    }

    // Validate state
    const stateData = typeof state === 'string' ? await validateOAuthState(state) : null;
    if (!stateData) {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=invalid_state`);
    }

    if (stateData.platform !== 'instagram-graph') {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=platform_mismatch`);
    }

    if (!code || typeof code !== 'string') {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=missing_code`);
    }

    try {
        const result = await instagramGraphService.exchangeCode(code);
        const userId = stateData.userId;

        // Create or update social account
        const account = await prisma.socialAccount.upsert({
            where: {
                userId_platform_accountId: {
                    userId,
                    platform: 'instagram-graph',
                    accountId: result.platformUserId
                }
            },
            update: {
                displayName: result.displayName,
                username: result.username,
                avatar: result.avatar,
                isActive: true
            },
            create: {
                userId,
                platform: 'instagram-graph',
                accountId: result.platformUserId,
                displayName: result.displayName,
                username: result.username,
                avatar: result.avatar,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null,
                isActive: true
            }
        });

        // Store tokens with encryption
        await tokenManager.storeTokens(account.id, result.accessToken, result.refreshToken);

        res.redirect(`${FRONTEND_URL}/dashboard/instagram-graph`);
    } catch (error) {
        console.error('[Instagram Graph] Token exchange failed:', error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        res.redirect(`${FRONTEND_URL}/connections?error=${encodeURIComponent(errorMsg)}`);
    }
});

export default router;
