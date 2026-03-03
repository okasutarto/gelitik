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

// --- Enhanced Report v2.0 Data Model ---

interface ContentItem {
  title: string;
  date: string;
  type: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

interface FormatBreakdown {
  format: string;
  count: number;
  avgViews: number;
  avgEngagement: number;
}

interface GrowthTrend {
  peakGrowthDay: string;
  peakGrowthValue: number;
  engagementSpikeDay: string;
  engagementSpikeValue: number;
  insight: string;
}

interface AudiencePersona {
  primaryGender: string;
  primaryGenderPct: number;
  primaryAge: string;
  primaryAgePct: number;
  topGeos: { name: string; percentage: number }[];
  likesVsComments: string;
}

interface Demographics {
  ageRanges: { range: string; percentage: number }[];
  genderSplit: { gender: string; percentage: number }[];
  topCities: { city: string; percentage: number }[];
}

interface TrendData {
  date: string;
  followers: number;
  views: number;
  likes: number;
  engagement: number;
}

export interface ReportData {
  generatedAt: string;
  platform: string;
  accountName: string;
  period: string;
  // Section 1: Executive Summary
  kpi: {
    totalFollowers: number;
    totalReach: number;
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalSaves: number;
    profileVisits: number;
    linkTaps: number;
    engagementRate: number;
  };
  // Section 2: Content Efficiency
  contentFormats: FormatBreakdown[];
  contentInsight: string;
  // Section 3: Growth & Engagement Trends
  engagementTrend: TrendData[];
  growthTrend: GrowthTrend | null;
  // Section 4: Audience Deep-Dive
  demographics: Demographics | null;
  audiencePersona: AudiencePersona | null;
  // Section 5: Top Content
  topContent: ContentItem[];
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

    // Handle instagram/instagram-graph mismatch
    const getPlatformWhere = () => {
      if (platform === 'all') return {};
      if (platform === 'instagram' || platform === 'instagram-graph') {
        return { platform: { in: ['instagram', 'instagram-graph'] } };
      }
      return { platform };
    };

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        isActive: true,
        ...getPlatformWhere()
      },
      include: {
        analytics: {
          where: { date: { gte: since } },
          orderBy: { date: 'asc' }
        },
        content: {
          orderBy: { views: 'desc' },
          take: 30
        }
      }
    });

    if (accounts.length === 0) {
      throw new Error('No connected accounts found for the specified platform');
    }

    // Get account name
    const accountName = accounts.map(a => a.displayName || a.username || a.accountId).join(', ');

    // Base KPIs from analytics
    const kpi = this.calculateKPIs(accounts);

    // Get content — for Instagram, fetch live from API
    let topContent = this.getTopContent(accounts);
    if (topContent.length === 0) {
      const igAccount = accounts.find(a =>
        a.platform === 'instagram' || a.platform === 'instagram-graph'
      );
      if (igAccount) {
        topContent = await this.fetchInstagramContent(igAccount);
      }
    }

    // Content format breakdown
    const contentFormats = this.analyzeContentFormats(topContent);
    const contentInsight = this.generateContentInsight(contentFormats);

    // Engagement trends
    const engagementTrend = this.getEngagementTrend(accounts);
    const growthTrend = this.analyzeGrowthTrend(engagementTrend);

    // Demographics & persona (Instagram only)
    const demographics = await this.getDemographics(accounts, userId, days);
    const audiencePersona = this.buildAudiencePersona(demographics, kpi);

    // Enrich KPIs with Instagram-specific data
    const igAccount = accounts.find(a =>
      a.platform === 'instagram' || a.platform === 'instagram-graph'
    );
    if (igAccount) {
      await this.enrichWithInstagramKPIs(igAccount, kpi);
    }

    // Platform name
    const platformNames: Record<string, string> = {
      'instagram': 'Instagram',
      'instagram-graph': 'Instagram',
      'tiktok': 'TikTok',
      'all': 'All Platforms'
    };

    return {
      generatedAt: new Date().toISOString(),
      platform: platformNames[platform] || platform,
      accountName,
      period: `Last ${days} days`,
      kpi,
      contentFormats,
      contentInsight,
      engagementTrend,
      growthTrend,
      demographics,
      audiencePersona,
      topContent: topContent.sort((a, b) => b.saves - a.saves || b.engagementRate - a.engagementRate).slice(0, 10)
    };
  }

  private calculateKPIs(accounts: any[]): ReportData['kpi'] {
    let totalFollowers = 0, totalViews = 0, totalLikes = 0;
    let totalComments = 0, totalShares = 0, totalEngagement = 0;

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
      ? totalEngagement / accounts.length : 0;

    return {
      totalFollowers,
      totalReach: 0,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalSaves: 0,
      profileVisits: 0,
      linkTaps: 0,
      engagementRate: Math.round(avgEngagement * 10) / 10
    };
  }

  private async enrichWithInstagramKPIs(account: any, kpi: ReportData['kpi']): Promise<void> {
    try {
      const accessToken = await tokenManager.getAccessToken(account.id);
      if (!accessToken) return;

      const insights = await this.instagramGraphService.getInsights(accessToken, 'this_week');
      if (insights) {
        kpi.totalReach = insights.reach || 0;
        kpi.totalSaves = insights.saves || 0;
        kpi.profileVisits = insights.profileViews || 0;
        kpi.linkTaps = insights.profileLinkTaps || 0;
      }
    } catch (error) {
      console.error('Error enriching Instagram KPIs:', error);
    }
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
          type: content.type || 'post',
          views: content.views,
          likes: content.likes,
          comments: content.comments,
          shares: content.shares,
          saves: content.saves || 0,
          engagementRate: Math.round(engagementRate * 10) / 10
        });
      }
    }

    return allContent.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 15);
  }

  private async fetchInstagramContent(account: any): Promise<ContentItem[]> {
    try {
      const accessToken = await tokenManager.getAccessToken(account.id);
      if (!accessToken) return [];

      const media = await this.instagramGraphService.getMedia(accessToken, 25);
      const mediaItems = media?.data || media || [];
      if (!Array.isArray(mediaItems)) return [];

      return mediaItems.map((item: any) => {
        const likes = item.like_count || 0;
        const comments = item.comments_count || item.comment_count || 0;
        const shares = item.shares_count || item.share_count || 0;
        const saves = item.saves_count || item.save_count || 0;
        const views = item.impressions || item.reach || item.views || 1;
        const engagementRate = views > 0
          ? Math.round(((likes + comments + shares + saves) / views) * 1000) / 10
          : 0;

        // Determine content type
        let type = (item.media_type || 'IMAGE').toLowerCase();
        if (type === 'carousel_album') type = 'carousel';
        if (type === 'video') type = 'reel';

        return {
          title: item.caption?.substring(0, 80) || item.media_type || 'Post',
          date: item.timestamp?.split('T')[0] || '',
          type,
          views,
          likes,
          comments,
          shares,
          saves,
          engagementRate
        };
      })
      .sort((a: ContentItem, b: ContentItem) => b.engagementRate - a.engagementRate)
      .slice(0, 15);
    } catch (error) {
      console.error('Error fetching Instagram content for report:', error);
      return [];
    }
  }

  private analyzeContentFormats(content: ContentItem[]): FormatBreakdown[] {
    const formatMap = new Map<string, { count: number; totalViews: number; totalEng: number }>();

    for (const item of content) {
      const fmt = item.type || 'post';
      const existing = formatMap.get(fmt) || { count: 0, totalViews: 0, totalEng: 0 };
      existing.count++;
      existing.totalViews += item.views;
      existing.totalEng += item.engagementRate;
      formatMap.set(fmt, existing);
    }

    return Array.from(formatMap.entries()).map(([format, data]) => ({
      format: format.charAt(0).toUpperCase() + format.slice(1),
      count: data.count,
      avgViews: Math.round(data.totalViews / data.count),
      avgEngagement: Math.round((data.totalEng / data.count) * 10) / 10
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);
  }

  private generateContentInsight(formats: FormatBreakdown[]): string {
    if (formats.length < 2) {
      return formats.length === 1
        ? `All content is ${formats[0].format} format with ${formats[0].avgEngagement}% avg engagement.`
        : 'No content data available for format analysis.';
    }

    const top = formats[0];
    const runner = formats[1];
    const diff = Math.round(((top.avgEngagement - runner.avgEngagement) / runner.avgEngagement) * 100);

    if (diff > 0) {
      return `${top.format}s drive ${diff}% higher engagement than ${runner.format}s despite ${
        top.count < runner.count ? 'lower posting frequency' : 'similar volume'
      }. Consider increasing ${top.format} content.`;
    }
    return `${top.format}s and ${runner.format}s show similar engagement levels. Diversify content formats.`;
  }

  private getEngagementTrend(accounts: any[]): TrendData[] {
    const trendMap = new Map<string, TrendData>();

    for (const account of accounts) {
      for (const analytics of account.analytics) {
        const dateKey = analytics.date.toISOString().split('T')[0];

        if (!trendMap.has(dateKey)) {
          trendMap.set(dateKey, { date: dateKey, followers: 0, views: 0, likes: 0, engagement: 0 });
        }

        const trend = trendMap.get(dateKey)!;
        trend.followers += analytics.followers || 0;
        trend.views += analytics.totalViews || 0;
        trend.likes += analytics.totalLikes || 0;
        trend.engagement += analytics.engagementRate || 0;
      }
    }

    const trends = Array.from(trendMap.values());
    for (const trend of trends) {
      trend.engagement = Math.round((trend.engagement / accounts.length) * 10) / 10;
    }
    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }

  private analyzeGrowthTrend(trends: TrendData[]): GrowthTrend | null {
    if (trends.length < 2) return null;

    let peakGrowthDay = trends[0].date;
    let peakGrowthValue = 0;
    let engagementSpikeDay = trends[0].date;
    let engagementSpikeValue = 0;

    for (let i = 1; i < trends.length; i++) {
      const followerDelta = trends[i].followers - trends[i - 1].followers;
      if (followerDelta > peakGrowthValue) {
        peakGrowthValue = followerDelta;
        peakGrowthDay = trends[i].date;
      }
      if (trends[i].likes > engagementSpikeValue) {
        engagementSpikeValue = trends[i].likes;
        engagementSpikeDay = trends[i].date;
      }
    }

    const insight = peakGrowthDay === engagementSpikeDay
      ? `Content on ${peakGrowthDay} drove both peak growth and engagement — high-impact day.`
      : `Peak growth on ${peakGrowthDay} (+${peakGrowthValue}), engagement spike on ${engagementSpikeDay} (${engagementSpikeValue} likes).`;

    return { peakGrowthDay, peakGrowthValue, engagementSpikeDay, engagementSpikeValue, insight };
  }

  private async getDemographics(accounts: any[], userId: string, days: number): Promise<Demographics | null> {
    const instagramAccount = accounts.find(a =>
      a.platform === 'instagram' || a.platform === 'instagram-graph'
    );

    if (!instagramAccount) return null;

    try {
      const accessToken = await tokenManager.getAccessToken(instagramAccount.id);
      if (accessToken) {
        const insights = await this.instagramGraphService.getInsights(accessToken, 'this_week');

        if (insights?.demographics) {
          const demo = insights.demographics;
          const ageRanges = (demo.age || []).map((a: any) => ({
            range: a.label || a.range || a.group,
            percentage: a.percentage || 0
          })).filter((a: any) => a.percentage > 0);

          const genderSplit = (demo.gender || []).map((g: any) => ({
            gender: g.gender,
            percentage: g.percentage || 0
          })).filter((g: any) => g.percentage > 0);

          const topCities = (demo.cities || []).map((c: any) => ({
            city: c.name || c.city,
            percentage: c.percentage || 0
          })).filter((c: any) => c.percentage > 0);

          if (ageRanges.length > 0 || genderSplit.length > 0 || topCities.length > 0) {
            return { ageRanges, genderSplit, topCities };
          }
        }
      }
    } catch (error) {
      console.error('Error fetching demographics:', error);
    }

    return null;
  }

  private buildAudiencePersona(demographics: Demographics | null, kpi: ReportData['kpi']): AudiencePersona | null {
    if (!demographics) return null;

    const topGender = demographics.genderSplit.sort((a, b) => b.percentage - a.percentage)[0];
    const topAge = demographics.ageRanges.sort((a, b) => b.percentage - a.percentage)[0];

    const likesVsComments = kpi.totalLikes > 0 && kpi.totalComments > 0
      ? `${kpi.totalLikes} Likes vs ${kpi.totalComments} Comments — ${
          kpi.totalLikes / kpi.totalComments > 10
            ? 'Passive engagement. Add question-based captions to drive comments.'
            : 'Good comment-to-like ratio. Audience is actively engaging.'
        }`
      : 'Insufficient engagement data.';

    return {
      primaryGender: topGender?.gender || 'Unknown',
      primaryGenderPct: topGender?.percentage || 0,
      primaryAge: topAge?.range || 'Unknown',
      primaryAgePct: topAge?.percentage || 0,
      topGeos: demographics.topCities.slice(0, 5).map(c => ({ name: c.city, percentage: c.percentage })),
      likesVsComments
    };
  }

  // ===========================================================================
  // CSV Generation
  // ===========================================================================

  async generateCSV(reportData: ReportData): Promise<string> {
    const kpiData = [
      { Metric: 'Account', Value: reportData.accountName },
      { Metric: 'Platform', Value: reportData.platform },
      { Metric: 'Period', Value: reportData.period },
      { Metric: 'Total Followers', Value: reportData.kpi.totalFollowers },
      { Metric: 'Total Reach', Value: reportData.kpi.totalReach },
      { Metric: 'Total Views', Value: reportData.kpi.totalViews },
      { Metric: 'Total Likes', Value: reportData.kpi.totalLikes },
      { Metric: 'Total Comments', Value: reportData.kpi.totalComments },
      { Metric: 'Total Shares', Value: reportData.kpi.totalShares },
      { Metric: 'Total Saves', Value: reportData.kpi.totalSaves },
      { Metric: 'Profile Visits', Value: reportData.kpi.profileVisits },
      { Metric: 'Link Taps', Value: reportData.kpi.linkTaps },
      { Metric: 'Engagement Rate (%)', Value: reportData.kpi.engagementRate }
    ];

    const contentData = reportData.topContent.map(c => ({
      Title: c.title,
      Type: c.type,
      Date: c.date,
      Views: c.views,
      Likes: c.likes,
      Comments: c.comments,
      Shares: c.shares,
      Saves: c.saves,
      'Engagement Rate (%)': c.engagementRate
    }));

    const formatData = reportData.contentFormats.map(f => ({
      Format: f.format,
      Count: f.count,
      'Avg Views': f.avgViews,
      'Avg Engagement (%)': f.avgEngagement
    }));

    const kpiParser = new Parser({ fields: ['Metric', 'Value'] });
    const contentParser = new Parser({ fields: ['Title', 'Type', 'Date', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Engagement Rate (%)'] });

    let csv = 'Executive Summary\n' + kpiParser.parse(kpiData);
    csv += '\n\nTop Content\n' + contentParser.parse(contentData);

    if (formatData.length > 0) {
      const formatParser = new Parser({ fields: ['Format', 'Count', 'Avg Views', 'Avg Engagement (%)'] });
      csv += '\n\nContent Format Analysis\n' + formatParser.parse(formatData);
    }

    // Content Insight
    if (reportData.contentInsight) {
      csv += '\n\nContent Insight\n' + reportData.contentInsight + '\n';
    }

    // Growth & Engagement Trends
    if (reportData.growthTrend) {
      const gt = reportData.growthTrend;
      const growthData = [
        { Metric: 'Peak Growth Day', Value: gt.peakGrowthDay },
        { Metric: 'Peak Growth Value', Value: `+${gt.peakGrowthValue} followers` },
        { Metric: 'Engagement Spike Day', Value: gt.engagementSpikeDay },
        { Metric: 'Engagement Spike Value', Value: `${gt.engagementSpikeValue} likes` },
        { Metric: 'Insight', Value: gt.insight }
      ];
      const growthParser = new Parser({ fields: ['Metric', 'Value'] });
      csv += '\n\nGrowth & Engagement Trends\n' + growthParser.parse(growthData);
    }

    if (reportData.demographics) {
      const demoData = [
        ...reportData.demographics.genderSplit.map(g => ({ Category: 'Gender', Label: g.gender, Percentage: g.percentage })),
        ...reportData.demographics.ageRanges.map(a => ({ Category: 'Age', Label: a.range, Percentage: a.percentage })),
        ...reportData.demographics.topCities.map(c => ({ Category: 'City', Label: c.city, Percentage: c.percentage }))
      ];
      const demoParser = new Parser({ fields: ['Category', 'Label', 'Percentage'] });
      csv += '\n\nAudience Demographics\n' + demoParser.parse(demoData);
    }

    // Audience Persona
    if (reportData.audiencePersona) {
      const ap = reportData.audiencePersona;
      const personaData = [
        { Metric: 'Primary Gender', Value: `${ap.primaryGender} (${ap.primaryGenderPct}%)` },
        { Metric: 'Primary Age Group', Value: `${ap.primaryAge} (${ap.primaryAgePct}%)` },
        { Metric: 'Top Locations', Value: ap.topGeos.map(g => `${g.name} (${g.percentage}%)`).join(', ') },
        { Metric: 'Engagement Analysis', Value: ap.likesVsComments }
      ];
      const personaParser = new Parser({ fields: ['Metric', 'Value'] });
      csv += '\n\nAudience Persona\n' + personaParser.parse(personaData);
    }

    return csv;
  }

  // ===========================================================================
  // PDF Generation — Enhanced Report v2.0
  // ===========================================================================

  async generatePDF(reportData: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Register fonts to avoid garbled text
        doc.registerFont('Helvetica', 'Helvetica');
        doc.registerFont('Helvetica-Bold', 'Helvetica-Bold');

        const W = doc.page.width;
        const H = doc.page.height;
        const M = 50; // margin
        const CW = W - M * 2; // content width

        // Brand colors
        const BLACK = '#0a0a1a';
        const YELLOW = '#ffcc00';
        const PINK = '#ff0099';
        const GRAY = '#475569';
        const LGRAY = '#f1f5f9';
        const WHITE = '#ffffff';

        // =====================================================================
        // PAGE 1: Header + Executive Summary + Content Efficiency
        // =====================================================================

        // --- Header Banner ---
        doc.rect(0, 0, W, 110).fill(BLACK);
        doc.fillColor(YELLOW).fontSize(30).font('Helvetica-Bold').text('GELITIK', M, 25);
        doc.fillColor(WHITE).fontSize(10).font('Helvetica').text('ANALYTICS PERFORMANCE REPORT', M, 60);
        doc.fillColor(YELLOW).fontSize(10).font('Helvetica-Bold')
          .text(reportData.accountName, M, 80);
        doc.fillColor(WHITE).font('Helvetica').fontSize(9)
          .text(`${reportData.platform}  •  ${reportData.period}  •  Generated ${new Date(reportData.generatedAt).toLocaleDateString()}`, M, 95);

        let y = 130;

        // --- Section 1: Executive Summary ---
        y = this.drawSectionHeader(doc, 'EXECUTIVE SUMMARY', y, M, CW, BLACK, YELLOW);
        y += 10;

        const kpiBoxW = Math.floor((CW - 20) / 3);
        const kpiBoxH = 58;

        const kpiItems = [
          { label: 'TOTAL FOLLOWERS', value: reportData.kpi.totalFollowers.toLocaleString() },
          { label: 'TOTAL REACH', value: reportData.kpi.totalReach.toLocaleString() },
          { label: 'ENGAGEMENT RATE', value: `${reportData.kpi.engagementRate}%` },
          { label: 'PROFILE VISITS', value: reportData.kpi.profileVisits.toLocaleString() },
          { label: 'LINK TAPS', value: reportData.kpi.linkTaps.toLocaleString() },
          { label: 'TOTAL SAVES', value: reportData.kpi.totalSaves.toLocaleString() }
        ];

        kpiItems.forEach((kpi, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const bx = M + col * (kpiBoxW + 10);
          const by = y + row * (kpiBoxH + 10);

          // Shadow
          doc.rect(bx + 3, by + 3, kpiBoxW, kpiBoxH).fill(YELLOW);
          // Box
          doc.rect(bx, by, kpiBoxW, kpiBoxH).fillAndStroke(WHITE, BLACK).lineWidth(2);
          // Label
          doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text(kpi.label, bx + 10, by + 10, { width: kpiBoxW - 20 });
          // Value
          doc.fillColor(BLACK).fontSize(20).font('Helvetica-Bold').text(kpi.value, bx + 10, by + 28, { width: kpiBoxW - 20 });
        });

        y += 2 * (kpiBoxH + 10) + 15;

        // Additional KPIs row
        const extraKpis = [
          { label: 'Views', value: reportData.kpi.totalViews.toLocaleString() },
          { label: 'Likes', value: reportData.kpi.totalLikes.toLocaleString() },
          { label: 'Comments', value: reportData.kpi.totalComments.toLocaleString() },
          { label: 'Shares', value: reportData.kpi.totalShares.toLocaleString() }
        ];

        const extraW = Math.floor((CW - 30) / 4);
        extraKpis.forEach((item, i) => {
          const bx = M + i * (extraW + 10);
          doc.rect(bx, y, extraW, 35).fill(LGRAY);
          doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text(item.label.toUpperCase(), bx + 8, y + 6, { width: extraW - 16 });
          doc.fillColor(BLACK).fontSize(14).font('Helvetica-Bold').text(item.value, bx + 8, y + 18, { width: extraW - 16 });
        });

        y += 55;

        // --- Section 2: Content Efficiency ---
        if (reportData.contentFormats.length > 0) {
          y = this.drawSectionHeader(doc, 'CONTENT EFFICIENCY', y, M, CW, BLACK, YELLOW);
          y += 10;

          // Table header
          doc.rect(M, y, CW, 22).fill(BLACK);
          doc.fillColor(WHITE).fontSize(9).font('Helvetica-Bold');
          doc.text('FORMAT', M + 10, y + 6);
          doc.text('COUNT', M + 160, y + 6);
          doc.text('AVG. VIEWS', M + 260, y + 6);
          doc.text('AVG. ENG.', M + 380, y + 6);
          y += 22;

          doc.fillColor(BLACK).font('Helvetica').fontSize(9);
          reportData.contentFormats.forEach((fmt, i) => {
            if (i % 2 === 1) doc.rect(M, y, CW, 20).fill(LGRAY);
            doc.fillColor(BLACK);
            doc.text(fmt.format, M + 10, y + 5);
            doc.text(fmt.count.toString(), M + 160, y + 5);
            doc.text(fmt.avgViews.toLocaleString(), M + 260, y + 5);
            doc.font('Helvetica-Bold').text(`${fmt.avgEngagement}%`, M + 380, y + 5).font('Helvetica');
            y += 20;
          });

          doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(2).stroke(BLACK);
          y += 10;

          // Insight callout
          if (reportData.contentInsight) {
            doc.rect(M, y, CW, 30).fill('#fffbeb');
            doc.rect(M, y, 4, 30).fill(YELLOW);
            doc.fillColor(BLACK).fontSize(8).font('Helvetica-Bold').text('INSIGHT: ', M + 12, y + 5, { continued: true });
            doc.font('Helvetica').text(reportData.contentInsight, { width: CW - 30 });
            y += 38;
          }
        }

        // =====================================================================
        // PAGE 2: Growth Trends + Audience + Top Content
        // =====================================================================
        doc.addPage();
        y = 50;

        // --- Section 3: Growth & Engagement Trends ---
        if (reportData.growthTrend) {
          y = this.drawSectionHeader(doc, 'GROWTH & ENGAGEMENT TRENDS', y, M, CW, BLACK, YELLOW);
          y += 10;

          const gt = reportData.growthTrend;

          // Trend stats in boxes
          const trendBoxW = Math.floor((CW - 10) / 2);

          // Peak Growth
          doc.rect(M + 3, y + 3, trendBoxW, 50).fill(PINK);
          doc.rect(M, y, trendBoxW, 50).fillAndStroke(WHITE, BLACK).lineWidth(2);
          doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text('PEAK GROWTH DAY', M + 10, y + 8);
          doc.fillColor(BLACK).fontSize(16).font('Helvetica-Bold').text(gt.peakGrowthDay, M + 10, y + 22);
          doc.fillColor(PINK).fontSize(10).text(`+${gt.peakGrowthValue} followers`, M + 10, y + 38);

          // Engagement Spike
          const rx = M + trendBoxW + 10;
          doc.rect(rx + 3, y + 3, trendBoxW, 50).fill(YELLOW);
          doc.rect(rx, y, trendBoxW, 50).fillAndStroke(WHITE, BLACK).lineWidth(2);
          doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text('ENGAGEMENT SPIKE', rx + 10, y + 8);
          doc.fillColor(BLACK).fontSize(16).font('Helvetica-Bold').text(gt.engagementSpikeDay, rx + 10, y + 22);
          doc.fillColor(YELLOW).fontSize(10).text(`${gt.engagementSpikeValue} likes`, rx + 10, y + 38);

          y += 60;

          // Insight
          doc.rect(M, y, CW, 28).fill('#fffbeb');
          doc.rect(M, y, 4, 28).fill(YELLOW);
          doc.fillColor(BLACK).fontSize(8).font('Helvetica-Bold').text('INSIGHT: ', M + 12, y + 8, { continued: true });
          doc.font('Helvetica').text(gt.insight, { width: CW - 30 });
          y += 40;
        }

        // --- Section 4: Audience Deep-Dive ---
        if (reportData.audiencePersona || reportData.demographics) {
          y = this.drawSectionHeader(doc, 'AUDIENCE DEEP-DIVE', y, M, CW, BLACK, YELLOW);
          y += 10;

          if (reportData.audiencePersona) {
            const ap = reportData.audiencePersona;

            // Persona box
            doc.rect(M + 3, y + 3, CW, 45).fill(PINK);
            doc.rect(M, y, CW, 45).fillAndStroke(WHITE, BLACK).lineWidth(2);
            doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text('PRIMARY PERSONA', M + 10, y + 8);
            doc.fillColor(BLACK).fontSize(14).font('Helvetica-Bold')
              .text(`${ap.primaryGender} (${ap.primaryGenderPct}%)  |  Age ${ap.primaryAge} (${ap.primaryAgePct}%)`, M + 10, y + 24);
            y += 55;
          }

          if (reportData.demographics) {
            const demo = reportData.demographics;
            // Use fixed column widths to ensure no overlap
            const genderColW = 140;
            const ageColW = 140;
            const cityColW = CW - genderColW - ageColW - 40;

            // Gender column - draw first to avoid overlap
            doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text('GENDER', M, y);
            let genderY = y + 18;
            doc.fontSize(9).font('Helvetica');
            for (const g of demo.genderSplit) {
              const barW = Math.floor((g.percentage / 100) * (genderColW - 50));
              doc.rect(M, genderY, barW, 14).fill(PINK);
              doc.fillColor(BLACK).text(`${g.gender}: ${g.percentage}%`, M + barW + 5, genderY + 2);
              genderY += 20;
            }

            // Age column - offset from gender column
            const ageX = M + genderColW + 20;
            doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text('AGE RANGE', ageX, y);
            let ageY = y + 18;
            doc.fontSize(9).font('Helvetica');
            for (const a of demo.ageRanges) {
              const barW = Math.floor((a.percentage / 100) * (ageColW - 50));
              doc.rect(ageX, ageY, barW, 14).fill(YELLOW);
              doc.fillColor(BLACK).text(`${a.range}: ${a.percentage}%`, ageX + barW + 5, ageY + 2);
              ageY += 20;
            }

            // Cities column
            const cityX = M + genderColW + ageColW + 40;
            doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text('TOP CITIES', cityX, y);
            let cityY = y + 18;
            doc.fontSize(9).font('Helvetica');
            for (const c of demo.topCities.slice(0, 5)) {
              doc.fillColor(BLACK).text(`${c.city}`, cityX, cityY);
              doc.font('Helvetica-Bold').text(`${c.percentage}%`, cityX + 80, cityY).font('Helvetica');
              cityY += 18;
            }

            // Set y to below the tallest column
            y = Math.max(genderY, ageY, cityY) + 15;
          }

          // Sentiment note
          if (reportData.audiencePersona?.likesVsComments) {
            doc.rect(M, y, CW, 28).fill('#fffbeb');
            doc.rect(M, y, 4, 28).fill(YELLOW);
            doc.fillColor(BLACK).fontSize(8).font('Helvetica-Bold').text('INSIGHT: ', M + 12, y + 8, { continued: true });
            doc.font('Helvetica').text(reportData.audiencePersona.likesVsComments, { width: CW - 30 });
            y += 38;
          }
        }

        // --- Section 5: Top Content ---
        if (y > H - 200) { doc.addPage(); y = 50; }

        y = this.drawSectionHeader(doc, 'TOP PERFORMING CONTENT', y, M, CW, BLACK, YELLOW);
        y += 10;

        // Table header
        doc.rect(M, y, CW, 22).fill(BLACK);
        doc.fillColor(WHITE).fontSize(8).font('Helvetica-Bold');
        doc.text('TITLE', M + 8, y + 7);
        doc.text('TYPE', M + 210, y + 7);
        doc.text('VIEWS', M + 270, y + 7);
        doc.text('LIKES', M + 325, y + 7);
        doc.text('SAVES', M + 375, y + 7);
        doc.text('ENG.', M + 425, y + 7);
        y += 22;

        doc.fillColor(BLACK).font('Helvetica').fontSize(8);
        const displayContent = reportData.topContent.slice(0, 8);

        if (displayContent.length === 0) {
          doc.text('No content data available for this period.', M + 8, y + 8);
          y += 25;
        }

        displayContent.forEach((content, i) => {
          if (y > H - 80) return;
          if (i % 2 === 1) {
            doc.rect(M, y, CW, 22).fill(LGRAY);
            doc.fillColor(BLACK);
          }

          const title = content.title.length > 35 ? content.title.substring(0, 35) + '...' : content.title;
          doc.text(title, M + 8, y + 6, { width: 195 });
          doc.text(content.type, M + 210, y + 6);
          doc.text(content.views.toLocaleString(), M + 270, y + 6);
          doc.text(content.likes.toLocaleString(), M + 325, y + 6);
          doc.text(content.saves.toLocaleString(), M + 375, y + 6);
          doc.font('Helvetica-Bold').text(`${content.engagementRate}%`, M + 425, y + 6).font('Helvetica');

          y += 22;
        });

        doc.moveTo(M, y).lineTo(M + CW, y).lineWidth(2).stroke(BLACK);

        // --- Footer ---
        const footerY = H - 40;
        doc.moveTo(M, footerY - 10).lineTo(W - M, footerY - 10).lineWidth(1).stroke(LGRAY);
        doc.fillColor(GRAY).fontSize(7).font('Helvetica')
          .text(`Generated by Gelitik Analytics  •  ${reportData.platform}  •  ${reportData.accountName}`, M, footerY, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Helper: Draw a section header with yellow underline
  private drawSectionHeader(doc: any, title: string, y: number, m: number, cw: number, black: string, yellow: string): number {
    doc.fillColor(black).fontSize(14).font('Helvetica-Bold').text(title, m, y);
    y += 18;
    doc.rect(m, y, 60, 3).fill(yellow);
    doc.moveTo(m + 60, y + 1.5).lineTo(m + cw, y + 1.5).lineWidth(0.5).stroke('#e2e8f0');
    return y + 8;
  }
}

export const reportExportService = new ReportExportService();
