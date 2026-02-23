import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { JWT_SECRET } from '../config/env';

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
            if (err) {
                return res.status(403).json({ error: 'Token is invalid or expired' });
            }

            const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
            if (!dbUser) {
                return res.status(401).json({ error: 'User not found' });
            }

            (req as any).user = dbUser;
            next();
        });
    } else {
        res.status(401).json({ error: 'Authorization header missing' });
    }
};
