<script setup lang="ts">
import { onMounted, computed } from "vue";
import { Play, Share2, Clock, Eye } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
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

const router = useRouter();
const { loading, accountData, fetchAnalytics } = usePlatformAnalytics("tiktok");

const userData = computed(() => accountData.value?.data?.userInfo || null);
const videos = computed(() => accountData.value?.data?.videos || []);

const tiktokStats = computed(() => {
  if (!userData.value) return [];
  const vids = videos.value;
  const totalViews = vids.reduce((sum, v) => sum + (v.view_count || 0), 0);
  const totalLikes =
    vids.reduce((sum, v) => sum + (v.like_count || 0), 0) +
    (userData.value?.likes_count || 0);
  const totalShares = vids.reduce((sum, v) => sum + (v.share_count || 0), 0);
  const totalComments = vids.reduce(
    (sum, v) => sum + (v.comment_count || 0),
    0,
  );
  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate =
    totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

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

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

onMounted(() => {
  fetchAnalytics().catch((err) => {
    if ((err as any)?.response?.status === 404) {
      alert("TikTok account not connected. Please connect your account first.");
      router.push("/connections");
    }
  });
});
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <div
      class="bg-neo-accent dark:bg-slate-800 border-b-4 border-black dark:border-white p-6 md:p-8 mb-8 -mx-4 md:-mx-8">
      <h2
        class="text-4xl lg:text-5xl font-black uppercase text-slate-900 dark:text-white leading-tight">
        TikTok Analytics
      </h2>
      <p
        class="text-sm font-bold opacity-60 uppercase text-slate-600 dark:text-slate-400 mt-2">
        Analyze your TikTok trends and reach.
      </p>
    </div>

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
          platform="tiktok" />
      </template>
    </div>

    <!-- Top Performing Content -->
    <div class="mb-8">
      <ChartSkeleton v-if="loading" />
      <DualChartDashboard v-else :videos="videos" />
    </div>
    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else platform="tiktok" :videos="videos" />
  </DashboardLayout>
</template>
