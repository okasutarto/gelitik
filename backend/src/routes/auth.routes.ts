import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktok.service';
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

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // State carries userId to callback to link account
    const state = JSON.stringify({ userId, platform });

    if (platform === 'instagram') {
        return res.redirect(instagramService.getAuthUrl(state));
    } else if (platform === 'tiktok') {
        return res.redirect(tiktokService.getAuthUrl(state));
    }

    res.status(400).json({ error: 'Unsupported platform' });
});

// Platform Callback
router.get('/:platform/callback', async (req, res) => {
    const { platform } = req.params;
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'No authorization code provided' });
    }

    try {
        let result;
        if (platform === 'instagram') {
            result = await instagramService.exchangeCode(code);
        } else if (platform === 'tiktok') {
            result = await tiktokService.exchangeCode(code);
        } else {
            throw new Error('Unsupported platform');
        }

        // Parse state to get userId
        const stateData = state ? JSON.parse(String(state)) : {};
        const userId = stateData.userId;

        if (!userId) {
            return res.status(400).json({ error: 'Session lost during auth' });
        }

        // Save/Update Account
        await prisma.socialAccount.upsert({
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
                scope: result.scope
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
                scope: result.scope
            }
        });

        res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=${platform}`);

    } catch (error) {
        console.error('Auth Error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/connections?error=auth_failed`);
    }
});

export default router;
