import { Router } from 'express';
import { reportsController } from '../controllers/reports.controller';

const router = Router();

/**
 * GET /api/reports/export
 * Export analytics report in CSV or PDF format
 *
 * Query parameters:
 *   - format: 'csv' | 'pdf' (required)
 *   - platform: 'instagram' | 'tiktok' | 'instagram-graph' | 'all' (required)
 *   - days: 7 | 14 | 30 | 90 (required)
 *
 * Example:
 *   GET /api/reports/export?format=csv&platform=all&days=30
 *   GET /api/reports/export?format=pdf&platform=instagram&days=7
 */
router.get('/export', reportsController.exportReport);

export default router;
