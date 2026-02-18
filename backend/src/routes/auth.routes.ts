import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation';
import { InstagramService } from '../services/instagram.service';
import { TikTokService } from '../services/tiktokService';
import { tokenManager } from '../services/tokenManager';
import prisma from '../config/prisma';
import { JWT_SECRET, FRONTEND_URL } from '../config/env';
import { generateOAuthState, validateOAuthState } from '../config/oauthState';

const router = Router();
const instagramService = new InstagramService();
const tiktokService = new TikTokService();

// === User Authentication ===
router.post('/register', validate(schemas.register), AuthController.register);
router.post('/login', validate(schemas.login), AuthController.login);
router.get('/me', authenticateJwt, AuthController.getMe);

// Google Auth
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(501).json({ error: 'Google Login not configured on server' });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    // User is serialized by Passport - redirect to login with success flag
    // Token is stored server-side in session, no token in URL
    res.redirect(`${FRONTEND_URL}/login?auth=success`);
});

// === Platform Connection (Protected) ===
// Initiate Auth Flow
router.get('/:platform/connect', authenticateJwt, (req, res) => {
    const { platform } = req.params;
    const userId = (req.user as any)?.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Generate secure OAuth state with CSRF protection
    const state = generateOAuthState(userId, platform);

    let authUrl;
    if (platform === 'instagram') {
        authUrl = instagramService.getAuthUrl(state);
    } else if (platform === 'tiktok') {
        authUrl = tiktokService.getAuthUrl(state);
    } else {
        return res.status(400).json({ error: 'Unsupported platform' });
    }

    // Return authUrl as JSON for frontend to handle redirect
    res.json({ success: true, data: { authUrl } });
});

// Platform Callback
router.get('/:platform/callback', async (req, res) => {
    const { platform } = req.params;
    const { code, state, error } = req.query;

    // Validate OAuth state for CSRF protection
    const stateData = typeof state === 'string' ? validateOAuthState(state) : null;
    if (!stateData) {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=invalid_state`);
    }

    // Verify platform matches
    if (stateData.platform !== platform) {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=platform_mismatch`);
    }

    if (!code || typeof code !== 'string') {
        return res.redirect(`${FRONTEND_URL}/auth/error?error=missing_code`);
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

        const userId = stateData.userId;

        // First, create or update the account to get the ID
        const account = await prisma.socialAccount.upsert({
            where: {
                userId_platform_accountId: {
                    userId,
                    platform,
                    accountId: result.platformUserId
                }
            },
            update: {
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
                accessToken: result.accessToken, // Legacy field - will be migrated
                refreshToken: result.refreshToken, // Legacy field - will be migrated
                expiresAt: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000) : null,
                scope: result.scope,
                isActive: true
            }
        });

        // Store tokens with encryption
        await tokenManager.storeTokens(account.id, result.accessToken, result.refreshToken);

        res.redirect(`${FRONTEND_URL}/dashboard/${platform}`);

    } catch (error) {
        let errorMsg = 'Unknown error';
        if (error instanceof Error) {
            errorMsg = error.message;
        } else if (typeof error === 'string') {
            errorMsg = error;
        } else if (error && typeof (error as any).message === 'string') {
            errorMsg = (error as any).message;
        }
        res.redirect(`${FRONTEND_URL}/connections?error=${encodeURIComponent(errorMsg)}`);
    }
});

export default router;
