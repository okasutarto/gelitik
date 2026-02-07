<script setup lang="ts">
import { onMounted, computed } from "vue";
import { Play, Share2, Clock, Eye } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import UserProfile from "@/components/dashboard/UserProfile.vue";
import DualChartDashboard from "@/components/dashboard/DualChartDashboard.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
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
    <!-- Page Header with Platform Color -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <div class="size-2 rounded-full bg-slate-900 dark:bg-white" />
        <h2
          class="text-4xl font-black uppercase text-slate-900 dark:text-white">
          TikTok Analytics
        </h2>
      </div>
      <p class="text-sm uppercase font-bold text-slate-500 dark:text-slate-400">
        Analyze your TikTok trends and reach.
      </p>
    </div>

    <!-- User Profile -->
    <UserProfile v-if="userData" :user-info="userData" />

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-8">
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
    </div>

     <!-- Top Performing Content -->
    <div class="mb-8">
      <DualChartDashboard :videos="videos" />
    </div>
    <ContentTable platform="tiktok" :videos="videos" />
  </DashboardLayout>
</template>
