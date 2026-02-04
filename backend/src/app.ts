import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport'; // Import passport config
import { authenticateJwt } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// Middleware
app.use(cors());
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