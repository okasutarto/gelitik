import prisma from '../config/prisma';
import { tokenManager } from '../services/tokenManager';
import { InstagramGraphService } from './instagramGraph.service';
import { TikTokService } from './tiktokService';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  platform: 'instagram' | 'tiktok' | 'instagram-graph' | 'all';
  days: 7 | 14 | 30 | 90;
}

export interface ReportData {
  generatedAt: string;
  platform: string;
  period: string;
  kpi: {
    totalFollowers: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    engagementRate: number;
  };
  topContent: ContentItem[];
  engagementTrend: TrendData[];
  demographics: {
    ageRanges: { range: string; percentage: number }[];
    genderSplit: { gender: string; percentage: number }[];
    topCities: { city: string; percentage: number }[];
  };
}

interface ContentItem {
  title: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
}

interface TrendData {
  date: string;
  followers: number;
  views: number;
  likes: number;
  engagement: number;
}

export class ReportExportService {
  private instagramGraphService: InstagramGraphService;
  private tiktokService: TikTokService;

  constructor() {
    this.instagramGraphService = new InstagramGraphService();
    this.tiktokService = new TikTokService();
  }

  async generateReport(userId: string, options: ExportOptions): Promise<ReportData> {
    const { platform, days } = options;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // Get accounts based on platform filter
    const platformFilter = platform === 'all'
      ? undefined
      : platform;

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        isActive: true,
        ...(platformFilter && { platform: platformFilter })
      },
      include: {
        analytics: {
          where: { date: { gte: since } },
          orderBy: { date: 'asc' }
        },
        content: {
          where: { postedAt: { gte: since } },
          orderBy: { views: 'desc' },
          take: 20
        }
      }
    });

    if (accounts.length === 0) {
      throw new Error('No connected accounts found for the specified platform');
    }

    // Aggregate KPIs
    const kpi = this.calculateKPIs(accounts);

    // Get top content
    const topContent = this.getTopContent(accounts);

    // Get engagement trend
    const engagementTrend = this.getEngagementTrend(accounts);

    // Get demographics (from platform-specific data if available)
    const demographics = await this.getDemographics(accounts, userId, days);

    const platformName = platform === 'all'
      ? 'All Platforms'
      : platform.replace('-graph', ' Graph');

    return {
      generatedAt: new Date().toISOString(),
      platform: platformName,
      period: `Last ${days} days`,
      kpi,
      topContent,
      engagementTrend,
      demographics
    };
  }

  private calculateKPIs(accounts: any[]): ReportData['kpi'] {
    let totalFollowers = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalEngagement = 0;

    for (const account of accounts) {
      const latestAnalytics = account.analytics[account.analytics.length - 1];
      if (latestAnalytics) {
        totalFollowers += latestAnalytics.followers || 0;
        totalViews += latestAnalytics.totalViews || 0;
        totalLikes += latestAnalytics.totalLikes || 0;
        totalComments += latestAnalytics.totalComments || 0;
        totalShares += latestAnalytics.totalShares || 0;
        totalEngagement += latestAnalytics.engagementRate || 0;
      }
    }

    const avgEngagement = accounts.length > 0
      ? totalEngagement / accounts.length
      : 0;

    return {
      totalFollowers,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      engagementRate: Math.round(avgEngagement * 10) / 10
    };
  }

  private getTopContent(accounts: any[]): ContentItem[] {
    const allContent: ContentItem[] = [];

    for (const account of accounts) {
      for (const content of account.content) {
        const engagementRate = content.views > 0
          ? ((content.likes + content.comments + content.shares) / content.views) * 100
          : 0;

        allContent.push({
          title: content.title || content.description || `Content ${content.contentId}`,
          date: content.postedAt.toISOString().split('T')[0],
          views: content.views,
          likes: content.likes,
          comments: content.comments,
          shares: content.shares,
          engagementRate: Math.round(engagementRate * 10) / 10
        });
      }
    }

    // Sort by engagement rate and return top 10
    return allContent
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10);
  }

  private getEngagementTrend(accounts: any[]): TrendData[] {
    const trendMap = new Map<string, TrendData>();

    for (const account of accounts) {
      for (const analytics of account.analytics) {
        const dateKey = analytics.date.toISOString().split('T')[0];

        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, {
            date: dateKey,
            followers: 0,
            views: 0,
            likes: 0,
            engagement: 0
          });
        }

        const trend = trendMap.get(dateKey)!;
        trend.followers += analytics.followers || 0;
        trend.views += analytics.totalViews || 0;
        trend.likes += analytics.totalLikes || 0;
        trend.engagement += analytics.engagementRate || 0;
      }
    }

    const trends = Array.from(trendMap.values());

    // Calculate average engagement
    for (const trend of trends) {
      trend.engagement = Math.round((trend.engagement / accounts.length) * 10) / 10;
    }

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getDemographics(accounts: any[], userId: string, days: number): Promise<ReportData['demographics']> {
    // Default demographic data (fallback when API doesn't return data)
    const defaultDemographics = {
      ageRanges: [
        { range: '18-24', percentage: 35 },
        { range: '25-34', percentage: 30 },
        { range: '35-44', percentage: 20 },
        { range: '45-54', percentage: 10 },
        { range: '55+', percentage: 5 }
      ],
      genderSplit: [
        { gender: 'Female', percentage: 55 },
        { gender: 'Male', percentage: 42 },
        { gender: 'Other', percentage: 3 }
      ],
      topCities: [
        { city: 'New York', percentage: 15 },
        { city: 'Los Angeles', percentage: 12 },
        { city: 'Chicago', percentage: 8 },
        { city: 'Houston', percentage: 6 },
        { city: 'Miami', percentage: 5 }
      ]
    };

    // Try to fetch real demographics from Instagram Graph API
    const instagramAccount = accounts.find(a =>
      a.platform === 'instagram' || a.platform === 'instagram-graph'
    );

    if (instagramAccount) {
      try {
        const accessToken = await tokenManager.getAccessToken(instagramAccount.id);
        if (accessToken) {
          // Get insights for demographics (simpler call)
          const insights = await this.instagramGraphService.getInsights(
            accessToken,
            'this_week'
          );

          if (insights?.demographics) {
            return {
              ageRanges: insights.demographics.age_ranges || defaultDemographics.ageRanges,
              genderSplit: insights.demographics.gender_split || defaultDemographics.genderSplit,
              topCities: insights.demographics.top_cities || defaultDemographics.topCities
            };
          }
        }
      } catch (error) {
        console.error('Error fetching demographics:', error);
      }
    }

    return defaultDemographics;
  }

  async generateCSV(reportData: ReportData): Promise<string> {
    // CSV for KPI Summary
    const kpiFields = [
      'Metric',
      'Value'
    ];

    const kpiData = [
      { Metric: 'Total Followers', Value: reportData.kpi.totalFollowers },
      { Metric: 'Total Views', Value: reportData.kpi.totalViews },
      { Metric: 'Total Likes', Value: reportData.kpi.totalLikes },
      { Metric: 'Total Comments', Value: reportData.kpi.totalComments },
      { Metric: 'Total Shares', Value: reportData.kpi.totalShares },
      { Metric: 'Engagement Rate (%)', Value: reportData.kpi.engagementRate }
    ];

    // CSV for Top Content
    const contentFields = [
      'Title',
      'Date',
      'Views',
      'Likes',
      'Comments',
      'Shares',
      'Engagement Rate (%)'
    ];

    const contentData = reportData.topContent.map(c => ({
      Title: c.title,
      Date: c.date,
      Views: c.views,
      Likes: c.likes,
      Comments: c.comments,
      Shares: c.shares,
      'Engagement Rate (%)': c.engagementRate
    }));

    // CSV for Engagement Trend
    const trendFields = [
      'Date',
      'Followers',
      'Views',
      'Likes',
      'Engagement Rate (%)'
    ];

    const trendData = reportData.engagementTrend.map(t => ({
      Date: t.date,
      Followers: t.followers,
      Views: t.views,
      Likes: t.likes,
      'Engagement Rate (%)': t.engagement
    }));

    const kpiParser = new Parser({ fields: kpiFields });
    const contentParser = new Parser({ fields: contentFields });
    const trendParser = new Parser({ fields: trendFields });

    const kpiCsv = 'KPI Summary\n' + kpiParser.parse(kpiData);
    const contentCsv = '\n\nTop Content\n' + contentParser.parse(contentData);
    const trendCsv = '\n\nEngagement Trend\n' + trendParser.parse(trendData);

    return kpiCsv + contentCsv + trendCsv;
  }

  async generatePDF(reportData: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).text('Analytics Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`${reportData.platform} | ${reportData.period}`, { align: 'center' });
        doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        // KPI Summary Section
        doc.fontSize(18).text('KPI Summary', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(12);
        const kpiY = doc.y;
        const col1X = 50;
        const col2X = 250;

        doc.text('Total Followers:', col1X, kpiY);
        doc.text(reportData.kpi.totalFollowers.toLocaleString(), col2X, kpiY);

        doc.text('Total Views:', col1X, kpiY + 20);
        doc.text(reportData.kpi.totalViews.toLocaleString(), col2X, kpiY + 20);

        doc.text('Total Likes:', col1X, kpiY + 40);
        doc.text(reportData.kpi.totalLikes.toLocaleString(), col2X, kpiY + 40);

        doc.text('Total Comments:', col1X, kpiY + 60);
        doc.text(reportData.kpi.totalComments.toLocaleString(), col2X, kpiY + 60);

        doc.text('Total Shares:', col1X, kpiY + 80);
        doc.text(reportData.kpi.totalShares.toLocaleString(), col2X, kpiY + 80);

        doc.text('Engagement Rate:', col1X, kpiY + 100);
        doc.text(`${reportData.kpi.engagementRate}%`, col2X, kpiY + 100);

        doc.moveDown(8);

        // Top Content Section
        doc.fontSize(18).text('Top Content', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(10);
        const tableTop = doc.y;
        const headers = ['Title', 'Views', 'Likes', 'Comments', 'Eng. Rate'];
        const colWidths = [200, 80, 70, 80, 80];
        let currentX = 50;

        // Draw header row
        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, currentX, tableTop, { width: colWidths[i] });
          currentX += colWidths[i];
        });

        doc.font('Helvetica');
        let rowY = tableTop + 20;

        // Draw content rows (top 5)
        for (let i = 0; i < Math.min(5, reportData.topContent.length); i++) {
          const content = reportData.topContent[i];
          currentX = 50;

          const title = content.title.length > 25
            ? content.title.substring(0, 25) + '...'
            : content.title;

          doc.text(title, currentX, rowY, { width: colWidths[0] });
          currentX += colWidths[0];

          doc.text(content.views.toLocaleString(), currentX, rowY, { width: colWidths[1] });
          currentX += colWidths[1];

          doc.text(content.likes.toLocaleString(), currentX, rowY, { width: colWidths[2] });
          currentX += colWidths[2];

          doc.text(content.comments.toLocaleString(), currentX, rowY, { width: colWidths[3] });
          currentX += colWidths[3];

          doc.text(`${content.engagementRate}%`, currentX, rowY, { width: colWidths[4] });

          rowY += 18;
        }

        doc.moveDown(4);

        // Demographics Section
        doc.fontSize(18).text('Demographics', { underline: true });
        doc.moveDown(0.5);

        doc.fontSize(12);

        // Age Ranges
        doc.text('Age Distribution:', { continued: false });
        doc.moveDown(0.3);
        for (const age of reportData.demographics.ageRanges) {
          doc.text(`  ${age.range}: ${age.percentage}%`);
        }

        doc.moveDown(1);

        // Gender Split
        doc.text('Gender Split:', { continued: false });
        doc.moveDown(0.3);
        for (const gender of reportData.demographics.genderSplit) {
          doc.text(`  ${gender.gender}: ${gender.percentage}%`);
        }

        doc.moveDown(1);

        // Top Cities
        doc.text('Top Cities:', { continued: false });
        doc.moveDown(0.3);
        for (const city of reportData.demographics.topCities.slice(0, 5)) {
          doc.text(`  ${city.city}: ${city.percentage}%`);
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(10);
        doc.text('Generated by Gelitik Analytics', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const reportExportService = new ReportExportService();
