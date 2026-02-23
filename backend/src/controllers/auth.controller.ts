import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { JWT_SECRET, FRONTEND_URL } from '../config/env';
import { emailService } from '../services/email.service';

export class AuthController {

    // Register User
    static async register(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Create User
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    verificationToken
                }
            });

            // Send Verification Email
            await emailService.sendVerificationEmail(user.email, verificationToken, user.name || 'User');

            res.status(201).json({
                message: 'Registration successful. Please check your email to verify your account.'
            });

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    // Login User
    static async login(req: Request, res: Response, next: NextFunction) {
        passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ error: info.message || 'Login failed' });

            if (!user.emailVerified) {
                return res.status(403).json({ error: 'Please verify your email address before logging in.' });
            }

            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            return res.json({
                token,
                user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
            });
        })(req, res, next);
    }

    // Google Callback
    static async googleCallback(req: Request, res: Response) {
        // User is already authenticated by passport middleware before this
        const user = req.user as any;
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/login?token=${token}`);
    }

    // Get Current User (Session Check)
    static async getMe(req: Request, res: Response) {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
        });
    }

    // Verify Email
    static async verifyEmail(req: Request, res: Response) {
        try {
            const { token } = req.query;

            if (!token || typeof token !== 'string') {
                return res.status(400).json({ error: 'Invalid verification token' });
            }

            const user = await prisma.user.findUnique({
                where: { verificationToken: token }
            });

            if (!user) {
                return res.status(400).json({ error: 'Invalid or expired verification token' });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    verificationToken: null
                }
            });

            res.json({ success: true, message: 'Email verified successfully' });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({ error: 'Failed to verify email' });
        }
    }
}
