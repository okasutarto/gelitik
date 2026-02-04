import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

            // Create User
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name
                }
            });

            // Generate JWT
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.status(201).json({
                token,
                user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
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
        res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
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
}
