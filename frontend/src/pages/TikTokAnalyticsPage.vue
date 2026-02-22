<script setup lang="ts">
import { onMounted, computed } from "vue";
import { Play, Share2, Clock, Eye } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import UserProfile from "@/components/dashboard/UserProfile.vue";
import DualChartDashboard from "@/components/dashboard/DualChartDashboard.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import StatCardSkeleton from "@/components/loading/StatCardSkeleton.vue";
import UserProfileSkeleton from "@/components/loading/UserProfileSkeleton.vue";
import ChartSkeleton from "@/components/loading/ChartSkeleton.vue";
import ContentTableSkeleton from "@/components/loading/ContentTableSkeleton.vue";
import { usePlatformAnalytics } from "@/composables/usePlatformAnalytics";
import { useRouter } from "vue-router";
import { formatNumber } from "@/utils/format";
import { useToast } from "@/composables/useToast";
import type { AxiosError } from "axios";
import type { Video } from "@/types/video";

const router = useRouter();
const toast = useToast();
const { loading, accountData, fetchAnalytics } = usePlatformAnalytics("tiktok");

const userData = computed(() => {
  const info = accountData.value?.data?.userInfo as any;
  if (!info) return null;
  return {
    id: info.open_id || "",
    name: info.display_name || "",
    avatar_url: info.avatar_url || "",
    followers_count: info.follower_count || 0,
    following_count: info.following_count || 0,
    likes_count: info.likes_count || 0,
    videos_count: info.video_count || 0,
    bio: info.bio_description || "",
    is_verified: info.is_verified || false,
  };
});
const videos = computed<Video[]>(() => (accountData.value?.data?.videos as Video[]) || []);

const tiktokStats = computed(() => {
  if (!userData.value) return [];
  const vids = videos.value;
  const totalViews = vids.reduce((sum, v) => sum + (v.view_count || 0), 0);
  const totalLikes =
    vids.reduce((sum, v) => sum + (v.like_count || 0), 0) + (userData.value?.likes_count || 0);
  const totalShares = vids.reduce((sum, v) => sum + (v.share_count || 0), 0);
  const totalComments = vids.reduce((sum, v) => sum + (v.comment_count || 0), 0);
  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

  return [
    {
      title: "Video Views",
      value: formatNumber(totalViews),
      change: "",
      changeType: "up" as const,
      icon: Play,
      subtitle: "",
    },
    {
      title: "Shares",
      value: formatNumber(totalShares),
      change: "",
      changeType: "up" as const,
      icon: Share2,
      subtitle: "",
    },
    {
      title: "Total Likes",
      value: formatNumber(totalLikes),
      change: "",
      changeType: "up" as const,
      icon: Eye,
      subtitle: "",
    },
    {
      title: "Engagement Rate",
      value: engagementRate.toFixed(2) + "%",
      change: "",
      changeType: "up" as const,
      icon: Clock,
      subtitle: "",
    },
  ];
});

onMounted(() => {
  // Check for connection success message from OAuth callback
  const connectionSuccess = sessionStorage.getItem("connection-success");
  if (connectionSuccess === "tiktok") {
    sessionStorage.removeItem("connection-success");
    toast.success("TikTok account connected successfully! You can now view your analytics.");
  }

  fetchAnalytics().catch((err: unknown) => {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 404) {
      toast.error("TikTok account not connected. Please connect your account first.");
      router.push("/connections");
    }
  });
});
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Theme Toggle -->
    <PageHeader
      title="TikTok Analytics"
      subtitle="Analyze your TikTok trends and reach."
      :show-theme-toggle="true"
    />

    <!-- User Profile -->
    <UserProfile v-if="!loading && userData" :user-info="userData" />
    <UserProfileSkeleton v-else-if="loading" />

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
      <template v-if="loading">
        <StatCardSkeleton :count="4" />
      </template>
      <template v-else>
        <StatCard
          v-for="stat in tiktokStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :change="stat.change"
          :change-type="stat.changeType"
          :icon="stat.icon"
          :subtitle="stat.subtitle"
          platform="tiktok"
        />
      </template>
    </div>

    <!-- Top Performing Content -->
    <div class="mb-8">
      <ChartSkeleton v-if="loading" />
      <DualChartDashboard v-else :videos="videos" />
    </div>

    <!-- Follower Growth Chart -->
    <div class="mb-8">
      <div class="brutal-card p-6 brutal-hover-lift">
        <h2 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">
          Follower Growth
        </h2>
        <p class="text-sm font-bold opacity-60 uppercase text-slate-900 dark:text-slate-400 mb-4">
          TikTok follower trend
        </p>
        <div class="flex items-center justify-center py-12 text-center">
          <div>
            <div
              class="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center"
            >
              <svg
                class="w-8 h-8 text-slate-300 dark:text-slate-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <p class="text-sm font-bold text-slate-500 dark:text-slate-400">
              Follower growth tracking will begin after 7 days of data collection.
            </p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Daily snapshots are required to chart historical growth trends.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else platform="tiktok" :videos="videos" />
  </DashboardLayout>
</template>
