import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock User Middleware (Replace with real JWT auth)
app.use((req, res, next) => {
  // Simulating logged in user for dev
  (req as any).user = { id: 'user_123', email: 'admin@gelitik.com' };
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

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