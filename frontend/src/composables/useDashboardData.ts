import { computed, onMounted } from "vue";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useTiktokStore } from "@/stores/tiktokStore";
import { useInstagramStore } from "@/stores/instagramStore";
import { formatNumber } from "@/utils/format";

export interface DashboardKpiCard {
  title: string;
  value: string;
  rawValue: number;
  delta: number;
  deltaPercent: number;
  deltaLabel: string;
  icon: string;
  positive: boolean;
}

export function useDashboardData() {
  const dashboardStore = useDashboardStore();
  const tiktokStore = useTiktokStore();
  const instagramStore = useInstagramStore();

  // KPI cards for the overview page
  const kpiCards = computed(() => {
    const deltas = dashboardStore.kpiDeltas;
    return [
      {
        title: "Total Audience",
        value: formatNumber(dashboardStore.totalFollowers),
        rawValue: dashboardStore.totalFollowers,
        subtitle: "Combined followers",
        delta: deltas.followers.delta,
        deltaPercent: deltas.followers.percent,
        deltaLabel: "vs. earliest snapshot",
      },
      {
        title: "Engagement Rate",
        value: dashboardStore.totalEngagementRate.toFixed(2) + "%",
        rawValue: dashboardStore.totalEngagementRate,
        subtitle: "Avg. across platforms",
      },
      {
        title: "Total Posts",
        value: formatNumber(dashboardStore.totalPosts),
        rawValue: dashboardStore.totalPosts,
        subtitle: "Published content",
      },
      {
        title: "Total Views",
        value: formatNumber(dashboardStore.totalViews),
        rawValue: dashboardStore.totalViews,
        subtitle: "Combined platform views",
      },
    ];
  });

  // Platform health snapshots
  const platformHealth = computed(() => ({
    instagram: dashboardStore.instagramHealth,
    tiktok: dashboardStore.tiktokHealth,
  }));

  // Combined top content
  const topContent = computed(() => dashboardStore.topContent);

  // Historical follower data from DB snapshots
  const followerHistory = computed(() => dashboardStore.followerHistory);

  // Combined engagement history for the engagement chart
  const engagementHistory = computed(() => dashboardStore.combinedEngagementHistory);

  // Heatmap data derived from media post times
  const heatmapData = computed(() => {
    const allMedia = [...(instagramStore.data?.media ?? []), ...(tiktokStore.data?.videos ?? [])];

    const scores: Record<string, number> = {};

    for (const item of allMedia) {
      const timestamp =
        (item as Record<string, unknown>).create_time ??
        (item as Record<string, unknown>).timestamp;
      if (!timestamp) continue;

      const date =
        typeof timestamp === "number" ? new Date(timestamp * 1000) : new Date(timestamp as string);

      if (isNaN(date.getTime())) continue;

      const day = date.getDay(); // 0=Sun ... 6=Sat
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      scores[key] = (scores[key] || 0) + 1;
    }

    // Normalize to 0–100
    const max = Math.max(...Object.values(scores), 1);
    return Object.entries(scores).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { day, hour, score: Math.round((count / max) * 100) };
    });
  });

  const isLoading = computed(() => dashboardStore.isLoading);
  const error = computed(() => dashboardStore.error);
  const hasData = computed(() => tiktokStore.data !== null || instagramStore.data !== null);
  const lastUpdated = computed(() => {
    const ttFetch = tiktokStore.lastFetched ?? 0;
    const igFetch = instagramStore.lastFetched ?? 0;
    const latest = Math.max(ttFetch, igFetch);
    return latest > 0 ? new Date(latest) : null;
  });

  // Actions
  async function fetchAll() {
    await dashboardStore.fetchAll();
  }

  async function refresh() {
    await dashboardStore.refreshAll();
  }

  // Auto-fetch on mount
  onMounted(() => {
    fetchAll();
  });

  return {
    kpiCards,
    platformHealth,
    topContent,
    followerHistory,
    engagementHistory,
    heatmapData,
    isLoading,
    error,
    hasData,
    lastUpdated,
    fetchAll,
    refresh,
  };
}
