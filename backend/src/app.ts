import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport'; // Import passport config
import { authenticateJwt } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ];
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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
app.use(passport.initialize()); // Initialize Passport

// Routes
app.use('/auth', authRoutes);
app.use('/api/analytics', authenticateJwt, analyticsRoutes); // Protect analytics routes

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;