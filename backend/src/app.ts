import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport';
import rateLimit from 'express-rate-limit';
import { authenticateJwt } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { FRONTEND_URL, PORT as CONFIG_PORT, SESSION_SECRET } from './config/env';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';
import socialAccountsRoutes from './routes/socialAccounts';
import instagramGraphRoutes from './routes/instagramGraph.routes';
import reportsRoutes from './routes/reports.routes';
import { startTokenRefreshCron } from './jobs/tokenRefresh';
import session from 'express-session';

const app = express();

// Rate limiting for auth endpoints (prevent brute force attacks)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for login
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL,
  process.env.ALLOWED_ORIGINS?.split(',') // Allow additional origins via env
].flat().filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins
      return callback(null, true);
    }

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

// Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // false for local/ngrok
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize()); // Initialize Passport

// Routes
// Apply rate limiting to auth routes
app.use('/auth/instagram-graph', instagramGraphRoutes);
app.use('/auth', authRateLimiter, authRoutes);
app.use('/api/analytics', authenticateJwt, analyticsRoutes);
app.use('/api/accounts', authenticateJwt, socialAccountsRoutes);
app.use('/api/reports', authenticateJwt, reportsRoutes);

// Start token refresh cron job
startTokenRefreshCron();

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(CONFIG_PORT, () => {
    console.log(`Server running on port ${CONFIG_PORT}`); // Gelitik Backend Ready
  });
}

export default app;
