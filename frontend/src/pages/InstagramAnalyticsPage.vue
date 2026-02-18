<script setup lang="ts">
import { onMounted, computed } from "vue";
import { Eye, Users, UserPlus, Layers } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import TopCitiesPanel from "@/components/dashboard/TopCitiesPanel.vue";
import AgeRangePanel from "@/components/dashboard/AgeRangePanel.vue";
import { usePlatformAnalytics } from "@/composables/usePlatformAnalytics";
import { useRouter } from "vue-router";
import { formatNumber } from "@/utils/format";
import { useToast } from "@/composables/useToast";
import type { AxiosError } from "axios";

const router = useRouter();
const toast = useToast();
const { loading, accountData, fetchAnalytics } =
  usePlatformAnalytics("instagram");

const instagramStats = computed(() => {
  if (!accountData.value?.data.analytics) return [];

  const analytics = accountData.value.data.analytics;
  return [
    {
      title: "Impressions",
      value: formatNumber(analytics.totalViews || 0),
      change: "12%",
      changeType: "up" as const,
      icon: Eye,
      subtitle: "+12% vs last week",
    },
    {
      title: "Accounts Reached",
      value: formatNumber(analytics.followers || 0),
      change: "5%",
      changeType: "up" as const,
      icon: Users,
      subtitle: "+5% new accounts",
    },
    {
      title: "Profile Visits",
      value: "12.5K",
      change: "8.4%",
      changeType: "up" as const,
      icon: UserPlus,
      subtitle: "From bio link",
    },
    {
      title: "Stories Reach",
      value: "45.2K",
      change: "18%",
      changeType: "up" as const,
      icon: Layers,
      subtitle: "Avg per story",
    },
  ];
});

onMounted(() => {
  fetchAnalytics().catch((err: unknown) => {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 404) {
      toast.error(
        "Instagram account not connected. Please connect your account first.",
      );
      router.push("/connections");
    }
  });
});
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Theme Toggle -->
    <PageHeader
      title="Instagram Insights"
      subtitle="Deep dive into your Instagram performance."
      :show-theme-toggle="true"
    />

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        v-for="stat in instagramStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :subtitle="stat.subtitle"
        platform="instagram" />
    </div>

    <!-- Audience Growth Chart -->
    <div class="mb-8">
      <AudienceChart
        platform="instagram"
        title="Follower Net Growth"
        subtitle="Instagram specific growth metrics" />
    </div>

    <!-- Instagram-Specific Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <TopCitiesPanel />
      <AgeRangePanel />
    </div>

    <!-- Top Performing Content -->
    <ContentTable platform="instagram" />
  </DashboardLayout>
</template>
