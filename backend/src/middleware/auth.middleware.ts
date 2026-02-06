import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    console.log('[Auth Middleware] Request path:', req.path);
    console.log('[Auth Middleware] Auth header present:', !!authHeader);

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log('[Auth Middleware] Token length:', token?.length);
        
        jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
            if (err) {
                console.error('[Auth Middleware] JWT verification failed:', err.message);
                return res.status(403).json({ error: 'Token is invalid or expired' });
            }
            
            console.log('[Auth Middleware] User ID:', user.id);
            
            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            if (!dbUser) {
                console.error('[Auth Middleware] User not found in database:', user.id);
                return res.status(401).json({ error: 'User not found' });
            }
            
            console.log('[Auth Middleware] User authenticated:', dbUser.email);
            (req as any).user = dbUser;
            next();
        });
    } else {
        console.error('[Auth Middleware] No auth header');
        res.status(401).json({ error: 'Authorization header missing' });
    }
};
