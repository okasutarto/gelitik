import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

// Serialize user for session (or JWT payload building)
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            return done(null, false, { message: 'No account found with this email' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }

        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists by Google ID
            let user = await prisma.user.findUnique({
                where: { googleId: profile.id }
            });

            if (!user) {
                // Check if user exists by email (link accounts)
                const email = profile.emails?.[0]?.value;
                if (email) {
                    user = await prisma.user.findUnique({ where: { email } });
                    if (user) {
                        // Link Google ID to existing user
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { googleId: profile.id, avatar: user.avatar || profile.photos?.[0]?.value }
                        });
                    } else {
                        // Create new user
                        user = await prisma.user.create({
                            data: {
                                googleId: profile.id,
                                email: email,
                                name: profile.displayName,
                                avatar: profile.photos?.[0]?.value
                            }
                        });
                    }
                }
            }

            return done(null, user as any);
        } catch (error) {
            return done(error, undefined);
        }
    }));
}

export default passport;
