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

  const isLoading = computed(() => tiktokStore.isLoading || instagramStore.isLoading);
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
    if (!instagramStore.data?.insights) return null;
    const insights = instagramStore.data.insights;
    const igKey = followerHistory.value['instagram-graph'] ? 'instagram-graph' : 'instagram';
    const delta = getMetricDelta(igKey, 'followers');
    return {
      platform: "instagram",
      followers: insights.followers,
      followerGrowth: delta.growth,
      followerGrowthPercent: delta.percent,
      engagementRate: insights.reach > 0 ? (insights.totalInteractions / insights.reach) * 100 : 0,
      postsThisWeek: 0,
    };
  });

  const tiktokHealth = computed<PlatformSnapshot | null>(() => {
    if (!tiktokStore.data?.analytics) return null;
    const analytics = tiktokStore.data.analytics;
    const delta = getMetricDelta('tiktok', 'followers');
    return {
      platform: "tiktok",
      followers: analytics.followers,
      followerGrowth: delta.growth,
      followerGrowthPercent: delta.percent,
      engagementRate: analytics.engagementRate,
      postsThisWeek: 0,
    };
  });

  // Combined top content from both platforms
  const topContent = computed(() => {
    type PlatformContent = Record<string, unknown> & { _platform: "instagram" | "tiktok" };

    const igMedia: PlatformContent[] = (instagramStore.data?.media ?? []).map((m) => ({
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

  // Combined engagement history (merging both platforms by date)
  const combinedEngagementHistory = computed(() => {
    const igData = instagramStore.data as Record<string, unknown> | null;
    const ttData = tiktokStore.data as Record<string, unknown> | null;
    const igHistorical = (igData?.insights as Record<string, unknown>)?.historical as { likes?: { date: string; value: number }[]; comments?: { date: string; value: number }[] } | undefined;
    const ttHistorical = (ttData?.analytics as Record<string, unknown>)?.historical as { likes?: { date: string; value: number }[]; comments?: { date: string; value: number }[] } | undefined;

    const likesMap = new Map<string, number>();
    const commentsMap = new Map<string, number>();

    // Add Instagram data
    for (const entry of igHistorical?.likes ?? []) {
      likesMap.set(entry.date, (likesMap.get(entry.date) ?? 0) + entry.value);
    }
    for (const entry of igHistorical?.comments ?? []) {
      commentsMap.set(entry.date, (commentsMap.get(entry.date) ?? 0) + entry.value);
    }

    // Add TikTok data
    for (const entry of ttHistorical?.likes ?? []) {
      likesMap.set(entry.date, (likesMap.get(entry.date) ?? 0) + entry.value);
    }
    for (const entry of ttHistorical?.comments ?? []) {
      commentsMap.set(entry.date, (commentsMap.get(entry.date) ?? 0) + entry.value);
    }

    const allDates = [...new Set([...likesMap.keys(), ...commentsMap.keys()])].sort();

    return {
      likes: allDates.map(date => ({ date, value: likesMap.get(date) ?? 0 })),
      comments: allDates.map(date => ({ date, value: commentsMap.get(date) ?? 0 })),
    };
  });

  // Historical analytics data from DB snapshots
  const followerHistory = ref<Record<string, { date: string; followers: number; totalViews: number; engagementRate: number }[]>>({});

  // Fetch all data
  async function fetchAll() {
    await Promise.all([tiktokStore.fetch(), instagramStore.fetch(), fetchHistory()]);
  }

  async function fetchHistory(days: number = 30) {
    try {
      const { data } = await api.get('/api/analytics/history', { params: { days } });
      followerHistory.value = data;
    } catch (err) {
      console.error('[DashboardStore] History fetch error:', err);
    }
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
    fetchAll,
    fetchHistory,
    refreshAll,
    clearAll,
  };
});
