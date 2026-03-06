import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useTiktokStore } from "./tiktokStore";
import { useInstagramStore } from "./instagramStore";
import { formatNumber } from "@/utils/format";
import api from "@/services/api";

export interface KpiCardData {
  label: string;
  value: string;
  rawValue: number;
  delta: number;
  deltaPercent: number;
  deltaLabel: string;
  icon: string;
  positive: boolean;
}

export interface PlatformSnapshot {
  platform: "instagram" | "tiktok";
  followers: number;
  followerGrowth: number;
  followerGrowthPercent: number;
  engagementRate: number;
  engagementRateGrowth: number;
  engagementRateGrowthPercent: number;
  postsThisWeek: number;
  views: number;
  viewsGrowth: number;
  viewsGrowthPercent: number;
  likes: number;
  likesGrowth: number;
  likesGrowthPercent: number;
  comments: number;
  commentsGrowth: number;
  commentsGrowthPercent: number;
  shares: number;
  sharesGrowth: number;
  sharesGrowthPercent: number;
  saves: number;
  savesGrowth: number;
  savesGrowthPercent: number;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const tiktokStore = useTiktokStore();
  const instagramStore = useInstagramStore();

  const isHistoryLoading = ref(false);

  const isLoading = computed(() => tiktokStore.isLoading || instagramStore.isLoading || isHistoryLoading.value);
  const error = computed(() => tiktokStore.error || instagramStore.error);

  // Aggregated KPI data - using platformHealth for clean data access
  const totalFollowers = computed(() => {
    const ig = instagramHealth.value?.followers ?? 0;
    const tt = tiktokHealth.value?.followers ?? 0;
    return ig + tt;
  });

  const totalEngagementRate = computed(() => {
    const igRate = instagramHealth.value?.engagementRate ?? 0;
    const ttRate = tiktokHealth.value?.engagementRate ?? 0;
    const count = (igRate > 0 ? 1 : 0) + (ttRate > 0 ? 1 : 0);
    return count > 0 ? (igRate + ttRate) / count : 0;
  });

  const totalPosts = computed(() => {
    const igPosts = instagramHealth.value?.postsThisWeek ?? 0;
    const ttPosts = tiktokHealth.value?.postsThisWeek ?? 0;
    return igPosts + ttPosts;
  });

  const totalViews = computed(() => {
    const igViews = instagramHealth.value?.views ?? 0;
    const ttViews = tiktokHealth.value?.views ?? 0;
    return igViews + ttViews;
  });

  // Compute growth delta from history snapshots for any numeric metric
  function getMetricDelta(
    platformKey: string,
    metric: 'followers' | 'totalViews' | 'totalLikes' | 'totalComments' | 'totalShares' | 'totalSaves' | 'engagementRate'
  ) {
    const entries = followerHistory.value[platformKey];
    if (!entries || entries.length < 2) return { growth: 0, percent: 0 };
    const oldest = entries[0][metric];
    const newest = entries[entries.length - 1][metric];
    const growth = newest - oldest;
    const percent = oldest > 0 ? (growth / oldest) * 100 : 0;
    return { growth, percent };
  }

  // Platform health snapshots - using history endpoint data for consistency
  const instagramHealth = computed<PlatformSnapshot | null>(() => {
    const igKey = followerHistory.value['instagram-graph'] ? 'instagram-graph' : 'instagram';
    const igHistory = followerHistory.value[igKey];

    // Need at least some data - either from history or from store
    if (!igHistory || igHistory.length === 0) {
      if (!instagramStore.data) return null;
    }

    // Calculate deltas for all metrics
    const followersDelta = getMetricDelta(igKey, 'followers');
    const viewsDelta = getMetricDelta(igKey, 'totalViews');
    const likesDelta = getMetricDelta(igKey, 'totalLikes');
    const commentsDelta = getMetricDelta(igKey, 'totalComments');
    const sharesDelta = getMetricDelta(igKey, 'totalShares');
    const savesDelta = getMetricDelta(igKey, 'totalSaves');
    const engagementDelta = getMetricDelta(igKey, 'engagementRate');

    // Use latest history data (from /api/analytics/history endpoint)
    const latest = igHistory && igHistory.length > 0 ? igHistory[igHistory.length - 1] : null;

    // Get posts from store if history doesn't have data
    const profile = instagramStore.data?.profile;
    const insights = instagramStore.data?.insights;
    const mediaCount = insights?.mediaCount ?? profile?.media_count ?? 0;

    return {
      platform: "instagram",
      followers: latest?.followers ?? profile?.followers_count ?? insights?.followers ?? 0,
      followerGrowth: followersDelta.growth,
      followerGrowthPercent: followersDelta.percent,
      engagementRate: latest?.engagementRate ?? 0,
      engagementRateGrowth: engagementDelta.growth,
      engagementRateGrowthPercent: engagementDelta.percent,
      postsThisWeek: mediaCount,
      views: latest?.totalViews ?? 0,
      viewsGrowth: viewsDelta.growth,
      viewsGrowthPercent: viewsDelta.percent,
      likes: latest?.totalLikes ?? 0,
      likesGrowth: likesDelta.growth,
      likesGrowthPercent: likesDelta.percent,
      comments: latest?.totalComments ?? 0,
      commentsGrowth: commentsDelta.growth,
      commentsGrowthPercent: commentsDelta.percent,
      shares: latest?.totalShares ?? 0,
      sharesGrowth: sharesDelta.growth,
      sharesGrowthPercent: sharesDelta.percent,
      saves: latest?.totalSaves ?? 0,
      savesGrowth: savesDelta.growth,
      savesGrowthPercent: savesDelta.percent,
    };
  });

  const tiktokHealth = computed<PlatformSnapshot | null>(() => {
    // Need at least some data - either from history or from store
    const ttHistory = followerHistory.value['tiktok'];
    if ((!ttHistory || ttHistory.length === 0) && !tiktokStore.data) {
      return null;
    }

    const analytics = tiktokStore.data?.analytics;
    const userInfo = tiktokStore.data?.userInfo;

    // Calculate deltas for all metrics
    const followersDelta = getMetricDelta('tiktok', 'followers');
    const viewsDelta = getMetricDelta('tiktok', 'totalViews');
    const likesDelta = getMetricDelta('tiktok', 'totalLikes');
    const commentsDelta = getMetricDelta('tiktok', 'totalComments');
    const sharesDelta = getMetricDelta('tiktok', 'totalShares');
    const engagementDelta = getMetricDelta('tiktok', 'engagementRate');

    // Use latest history data (from /api/analytics/history endpoint)
    const latest = ttHistory && ttHistory.length > 0 ? ttHistory[ttHistory.length - 1] : null;

    return {
      platform: "tiktok",
      followers: latest?.followers ?? analytics?.followers ?? 0,
      followerGrowth: followersDelta.growth,
      followerGrowthPercent: followersDelta.percent,
      engagementRate: latest?.engagementRate ?? analytics?.engagementRate ?? 0,
      engagementRateGrowth: engagementDelta.growth,
      engagementRateGrowthPercent: engagementDelta.percent,
      postsThisWeek: userInfo?.video_count ?? 0,
      views: latest?.totalViews ?? analytics?.totalViews ?? 0,
      viewsGrowth: viewsDelta.growth,
      viewsGrowthPercent: viewsDelta.percent,
      likes: latest?.totalLikes ?? analytics?.totalLikes ?? 0,
      likesGrowth: likesDelta.growth,
      likesGrowthPercent: likesDelta.percent,
      comments: latest?.totalComments ?? analytics?.totalComments ?? 0,
      commentsGrowth: commentsDelta.growth,
      commentsGrowthPercent: commentsDelta.percent,
      shares: latest?.totalShares ?? analytics?.totalShares ?? 0,
      sharesGrowth: sharesDelta.growth,
      sharesGrowthPercent: sharesDelta.percent,
      saves: 0, // TikTok doesn't have saves
      savesGrowth: 0,
      savesGrowthPercent: 0,
    };
  });

  // Combined top content from both platforms
  const topContent = computed(() => {
    type PlatformContent = Record<string, unknown> & { _platform: "instagram" | "tiktok" };

    // Instagram media can be at data.media or data.insights.media (Graph API)
    const igMediaRaw = instagramStore.data?.media ?? instagramStore.data?.insights?.media ?? [];
    const igMedia: PlatformContent[] = (Array.isArray(igMediaRaw) ? igMediaRaw : []).map((m) => ({
      ...m,
      _platform: "instagram" as const,
    }));
    const ttVideos: PlatformContent[] = (tiktokStore.data?.videos ?? []).map((v) => ({
      ...v,
      _platform: "tiktok" as const,
    }));

    return [...igMedia, ...ttVideos]
      .sort((a, b) => {
        // TikTok: view_count, impressions | Instagram: views, reach
        const aViews = Number(
          a["view_count"] ?? a["impressions"] ?? a["views"] ?? a["reach"] ?? 0
        );
        const bViews = Number(
          b["view_count"] ?? b["impressions"] ?? b["views"] ?? b["reach"] ?? 0
        );
        return bViews - aViews;
      });
  });

  // Formatted KPI summaries
  const kpiSummary = computed(() => ({
    totalFollowers: formatNumber(totalFollowers.value),
    totalEngagementRate: totalEngagementRate.value.toFixed(2) + "%",
    totalPosts: formatNumber(totalPosts.value),
    totalViews: formatNumber(totalViews.value),
  }));

  // KPI deltas from history (combined across platforms)
  const kpiDeltas = computed(() => {
    const igKey = followerHistory.value['instagram-graph'] ? 'instagram-graph' : 'instagram';

    // Followers delta
    const igFDelta = getMetricDelta(igKey, 'followers');
    const ttFDelta = getMetricDelta('tiktok', 'followers');
    const followersDelta = igFDelta.growth + ttFDelta.growth;
    const igOldestF = (followerHistory.value[igKey]?.[0]?.followers) ?? 0;
    const ttOldestF = (followerHistory.value['tiktok']?.[0]?.followers) ?? 0;
    const totalOldestF = igOldestF + ttOldestF;
    const followersPercent = totalOldestF > 0 ? (followersDelta / totalOldestF) * 100 : 0;

    // Views delta
    const igVDelta = getMetricDelta(igKey, 'totalViews');
    const ttVDelta = getMetricDelta('tiktok', 'totalViews');
    const viewsDelta = igVDelta.growth + ttVDelta.growth;
    const igOldestV = (followerHistory.value[igKey]?.[0]?.totalViews) ?? 0;
    const ttOldestV = (followerHistory.value['tiktok']?.[0]?.totalViews) ?? 0;
    const totalOldestV = igOldestV + ttOldestV;
    const viewsPercent = totalOldestV > 0 ? (viewsDelta / totalOldestV) * 100 : 0;

    // Engagement rate delta (average across platforms)
    const igEDelta = getMetricDelta(igKey, 'engagementRate');
    const ttEDelta = getMetricDelta('tiktok', 'engagementRate');
    const platformCount = (igEDelta.growth !== 0 ? 1 : 0) + (ttEDelta.growth !== 0 ? 1 : 0);
    const engagementDelta = platformCount > 0 ? (igEDelta.growth + ttEDelta.growth) / platformCount : 0;
    const engagementPercent = platformCount > 0 ? (igEDelta.percent + ttEDelta.percent) / platformCount : 0;

    return {
      followers: { delta: followersDelta, percent: followersPercent },
      views: { delta: viewsDelta, percent: viewsPercent },
      engagement: { delta: engagementDelta, percent: engagementPercent },
    };
  });

  // Combined engagement history from DB snapshots (totalLikes + engagementRate by date)
  const combinedEngagementHistory = computed(() => {
    const igKey = followerHistory.value['instagram-graph'] ? 'instagram-graph' : 'instagram';
    const igEntries = followerHistory.value[igKey] ?? [];
    const ttEntries = followerHistory.value['tiktok'] ?? [];

    const likesMap = new Map<string, number>();
    const viewsMap = new Map<string, number>();
    const engagementMap = new Map<string, { sum: number; count: number }>();

    for (const entry of [...igEntries, ...ttEntries]) {
      likesMap.set(entry.date, (likesMap.get(entry.date) ?? 0) + (entry.totalLikes ?? 0));
      viewsMap.set(entry.date, (viewsMap.get(entry.date) ?? 0) + (entry.totalViews ?? 0));
      const existing = engagementMap.get(entry.date) ?? { sum: 0, count: 0 };
      engagementMap.set(entry.date, { sum: existing.sum + (entry.engagementRate ?? 0), count: existing.count + 1 });
    }

    const allDates = [...new Set([...likesMap.keys()])].sort();

    return {
      likes: allDates.map(date => ({ date, value: likesMap.get(date) ?? 0 })),
      views: allDates.map(date => ({ date, value: viewsMap.get(date) ?? 0 })),
      comments: allDates.map(date => {
        const eng = engagementMap.get(date);
        return { date, value: eng ? parseFloat((eng.sum / eng.count).toFixed(2)) : 0 };
      }),
    };
  });

  // Historical analytics data from DB snapshots
  const selectedDays = ref(30);
  const followerHistory = ref<Record<string, { date: string; followers: number; totalViews: number; totalLikes: number; totalComments: number; totalShares: number; totalSaves: number; engagementRate: number }[]>>({});

  // Fetch all data
  async function fetchAll() {
    await Promise.all([tiktokStore.fetch(), instagramStore.fetch(), fetchHistory()]);
  }

  async function fetchHistory(days?: number, platform?: string) {
    isHistoryLoading.value = true;
    try {
      const d = days ?? selectedDays.value;
      const params: Record<string, number | string> = { days: d };
      if (platform) {
        params.platform = platform;
      }
      const { data } = await api.get('/api/analytics/history', { params });
      followerHistory.value = data;
    } catch (err) {
      console.error('[DashboardStore] History fetch error:', err);
    } finally {
      isHistoryLoading.value = false;
    }
  }

  async function setDateRange(days: number) {
    selectedDays.value = days;
    await fetchHistory(days);
  }

  async function refreshAll() {
    await Promise.all([tiktokStore.refresh(), instagramStore.refresh()]);
    // Re-fetch history after refresh to pick up the new snapshot
    await fetchHistory();
  }

  function clearAll() {
    tiktokStore.clear();
    instagramStore.clear();
    followerHistory.value = {};
  }

  return {
    isLoading,
    error,
    totalFollowers,
    totalEngagementRate,
    totalPosts,
    totalViews,
    instagramHealth,
    tiktokHealth,
    topContent,
    kpiSummary,
    kpiDeltas,
    followerHistory,
    combinedEngagementHistory,
    selectedDays,
    fetchAll,
    fetchHistory,
    setDateRange,
    refreshAll,
    clearAll,
  };
});
