import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktokService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const instagramService = new InstagramService();
const tiktokService = new TikTokService();

// === User Authentication ===
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticateJwt, AuthController.getMe);

// Google Auth
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(501).json({ error: 'Google Login not configured on server' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    const user = req.user as any;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
});

// === Platform Connection (Protected) ===
// Initiate Auth Flow
router.get('/:platform/connect', authenticateJwt, (req, res) => {
    const { platform } = req.params;
    const userId = (req.user as any)?.id;

    console.log(`[${platform.toUpperCase()} Connect] Request received`, { userId, platform });

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // State carries userId to callback to link account
    const state = JSON.stringify({ userId, platform });
    console.log(`[${platform.toUpperCase()} Connect] State:`, state);

    let authUrl;
    if (platform === 'instagram') {
        authUrl = instagramService.getAuthUrl(state);
    } else if (platform === 'tiktok') {
        authUrl = tiktokService.getAuthUrl(state);
    } else {
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    console.log(`[${platform.toUpperCase()} Connect] Auth URL:`, authUrl);

    // Return authUrl as JSON for frontend to handle redirect
    res.json({ success: true, data: { authUrl } });
});

// Platform Callback
router.get('/:platform/callback', async (req, res) => {
    const { platform } = req.params;
    const { code, state, error } = req.query;

    console.log(`[${platform.toUpperCase()} Callback]`, { code: code ? 'present' : 'missing', state, error });

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
        let result;
        if (platform === 'instagram') {
            result = await instagramService.exchangeCode(code);
        } else if (platform === 'tiktok') {
            result = await tiktokService.exchangeCode(code);
            console.log('[TikTok] Exchange result:', result);
        } else {
            throw new Error('Unsupported platform');
        }

        const stateData = state ? JSON.parse(String(state)) : {};
        const userId = stateData.userId;

        console.log(`[${platform.toUpperCase()}] User ID from state:`, userId);

        if (!userId) {
            console.error(`[${platform.toUpperCase()}] No userId in state`);
            return res.status(400).json({ error: 'Session lost during auth' });
        }

        const account = await prisma.socialAccount.upsert({
            where: {
                userId_platform_accountId: {
                    userId,
                    platform,
                    accountId: result.platformUserId
                }
            },
            update: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null,
                displayName: result.displayName,
                username: result.username,
                avatar: result.avatar,
                scope: result.scope,
                isActive: true
            },
            create: {
                userId,
                platform,
                accountId: result.platformUserId,
                displayName: result.displayName,
                username: result.username,
                avatar: result.avatar,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null,
                scope: result.scope,
                isActive: true
            }
        });

        console.log(`[${platform.toUpperCase()}] Account saved:`, account.id);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=${platform}`);

    } catch (error) {
        console.error('Auth Error:', error);
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        } else if (error && typeof (error as any).message === 'string') {
            errorMsg = (error as any).message;
        }
        res.redirect(`${process.env.FRONTEND_URL}/connections?error=${encodeURIComponent(errorMsg)}`);
    }
});

export default router;
