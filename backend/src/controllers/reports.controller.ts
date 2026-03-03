import { Request, Response } from 'express';
import { reportExportService, ExportOptions } from '../services/reportExport.service';

const VALID_FORMATS = ['csv', 'pdf'];
const VALID_PLATFORMS = ['instagram', 'tiktok', 'instagram-graph', 'all'];
const VALID_DAYS = [7, 14, 30, 90];

export class ReportsController {
  async exportReport(req: Request, res: Response): Promise<void> {
    const userId = (req.user as any)?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Validate and parse query parameters
      const format = (req.query.format as string)?.toLowerCase();
      const platform = (req.query.platform as string)?.toLowerCase();
      const days = parseInt(req.query.days as string, 10);

      // Validate format
      if (!format || !VALID_FORMATS.includes(format)) {
        res.status(400).json({
          error: `Invalid format. Must be one of: ${VALID_FORMATS.join(', ')}`
        });
        return;
      }

      // Validate platform
      if (!platform || !VALID_PLATFORMS.includes(platform)) {
        res.status(400).json({
          error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`
        });
        return;
      }

      // Validate days
      if (!days || !VALID_DAYS.includes(days)) {
        res.status(400).json({
          error: `Invalid days. Must be one of: ${VALID_DAYS.join(', ')}`
        });
        return;
      }

      const options: ExportOptions = {
        format: format as 'csv' | 'pdf',
        platform: platform as 'instagram' | 'tiktok' | 'instagram-graph' | 'all',
        days: days as 7 | 14 | 30 | 90
      };

      // Generate report data
      const reportData = await reportExportService.generateReport(userId, options);

      // Generate file based on format
      if (format === 'csv') {
        const csv = await reportExportService.generateCSV(reportData);

        const filename = `gelitik-report-${platform}-${days}days-${Date.now()}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
      } else {
        const pdfBuffer = await reportExportService.generatePDF(reportData);

        const filename = `gelitik-report-${platform}-${days}days-${Date.now()}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);
      }
    } catch (error: any) {
      console.error('Report export error:', error);

      if (error.message === 'No connected accounts found for the specified platform') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
}

export const reportsController = new ReportsController();
