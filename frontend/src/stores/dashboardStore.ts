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
  postsThisWeek: number;
}

export const useDashboardStore = defineStore("dashboard", () => {
  const tiktokStore = useTiktokStore();
  const instagramStore = useInstagramStore();

  const isHistoryLoading = ref(false);

  const isLoading = computed(() => tiktokStore.isLoading || instagramStore.isLoading || isHistoryLoading.value);
  const error = computed(() => tiktokStore.error || instagramStore.error);

  // Aggregated KPI data
  const totalFollowers = computed(() => {
    const ig = instagramStore.data?.insights?.followers ?? 0;
    const tt = tiktokStore.data?.analytics?.followers ?? 0;
    return ig + tt;
  });

  const totalEngagementRate = computed(() => {
    const igRate = instagramStore.data?.insights
      ? instagramStore.data.insights.totalInteractions > 0 && instagramStore.data.insights.reach > 0
        ? (instagramStore.data.insights.totalInteractions / instagramStore.data.insights.reach) *
          100
        : 0
      : 0;
    const ttRate = tiktokStore.data?.analytics?.engagementRate ?? 0;
    const count = (igRate > 0 ? 1 : 0) + (ttRate > 0 ? 1 : 0);
    return count > 0 ? (igRate + ttRate) / count : 0;
  });

  const totalPosts = computed(() => {
    const igPosts = instagramStore.data?.insights?.mediaCount ?? 0;
    const ttPosts = tiktokStore.data?.userInfo?.video_count ?? 0;
    return igPosts + ttPosts;
  });

  const totalViews = computed(() => {
    const igViews = instagramStore.data?.insights?.views ?? 0;
    const ttViews = tiktokStore.data?.analytics?.totalViews ?? 0;
    return igViews + ttViews;
  });

  // Compute growth delta from history snapshots for any numeric metric
  function getMetricDelta(platformKey: string, metric: 'followers' | 'totalViews' | 'engagementRate') {
    const entries = followerHistory.value[platformKey];
    if (!entries || entries.length < 2) return { growth: 0, percent: 0 };
    const oldest = entries[0][metric];
    const newest = entries[entries.length - 1][metric];
    const growth = newest - oldest;
    const percent = oldest > 0 ? (growth / oldest) * 100 : 0;
    return { growth, percent };
  }

  // Platform health snapshots (with real follower growth from history)
  const instagramHealth = computed<PlatformSnapshot | null>(() => {
    // Check both insights and profile data
    const insights = instagramStore.data?.insights;
    const profile = instagramStore.data?.profile;

    if (!insights && !profile) return null;

    const igKey = followerHistory.value['instagram-graph'] ? 'instagram-graph' : 'instagram';
    const delta = getMetricDelta(igKey, 'followers');

    // Prefer profile.followers_count (more reliable), fallback to insights.followers
    const followers = profile?.followers_count ?? insights?.followers ?? 0;
    // Get accountActivity for fallback calculations
    const accountActivity = (insights as Record<string, unknown>)?.accountActivity as Record<string, number> | undefined;
    const totalInteractions = accountActivity?.profileViews ?? 0;
    const mediaCount = insights?.mediaCount ?? profile?.media_count ?? 0;

    // Get actual engagement rate from history (latest record)
    const igHistory = followerHistory.value[igKey];
    let engagementRate = 0;
    if (igHistory && igHistory.length > 0) {
      const latest = igHistory[igHistory.length - 1];
      engagementRate = latest.engagementRate ?? 0;
    }
    // Fallback: engagement per follower if history doesn't have it
    if (engagementRate === 0 && followers > 0) {
      engagementRate = (totalInteractions / followers) * 100;
    }

    return {
      platform: "instagram",
      followers,
      followerGrowth: delta.growth,
      followerGrowthPercent: delta.percent,
      engagementRate: isNaN(engagementRate) ? 0 : engagementRate,
      postsThisWeek: mediaCount,
    };
  });

  const tiktokHealth = computed<PlatformSnapshot | null>(() => {
    if (!tiktokStore.data?.analytics) return null;
    const analytics = tiktokStore.data.analytics;
    const userInfo = tiktokStore.data.userInfo;
    const delta = getMetricDelta('tiktok', 'followers');

    // Get actual engagement rate from history (latest record) - same pattern as Instagram
    const ttHistory = followerHistory.value['tiktok'];
    let engagementRate = 0;
    if (ttHistory && ttHistory.length > 0) {
      const latest = ttHistory[ttHistory.length - 1];
      engagementRate = latest.engagementRate ?? 0;
    }
    // Fallback: use backend-calculated rate if history doesn't have it
    if (engagementRate === 0) {
      engagementRate = analytics.engagementRate ?? 0;
    }

    return {
      platform: "tiktok",
      followers: analytics.followers,
      followerGrowth: delta.growth,
      followerGrowthPercent: delta.percent,
      engagementRate: isNaN(engagementRate) ? 0 : engagementRate,
      postsThisWeek: userInfo?.video_count ?? 0,
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
  const followerHistory = ref<Record<string, { date: string; followers: number; totalViews: number; totalLikes: number; totalComments: number; totalShares: number; engagementRate: number }[]>>({});

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
