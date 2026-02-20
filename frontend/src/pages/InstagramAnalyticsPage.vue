<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { Eye, Users, UserPlus, Layers, Heart, Share2, UserCheck, Activity } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import UserProfile from "@/components/dashboard/UserProfile.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import TopCitiesPanel from "@/components/dashboard/TopCitiesPanel.vue";
import AgeRangePanel from "@/components/dashboard/AgeRangePanel.vue";
import StatCardSkeleton from "@/components/loading/StatCardSkeleton.vue";
import UserProfileSkeleton from "@/components/loading/UserProfileSkeleton.vue";
import ChartSkeleton from "@/components/loading/ChartSkeleton.vue";
import ContentTableSkeleton from "@/components/loading/ContentTableSkeleton.vue";
import { usePlatformAnalytics } from "@/composables/usePlatformAnalytics";
import { useRouter } from "vue-router";
import { formatNumber } from "@/utils/format";
import { useToast } from "@/composables/useToast";
import type { AxiosError } from "axios";

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Determine platform from route path - supports both instagram and instagram-graph
const platform = computed(() => {
  const path = route.path;
  if (path.includes("instagram-graph")) return "instagram-graph";
  return "instagram";
});

const { loading, accountData, fetchAnalytics } = usePlatformAnalytics(platform.value);

// Determine if we're using Instagram Graph API
const isGraphApi = computed(() => platform.value === "instagram-graph");

// Get user profile data - map to UserProfile expected format
const userInfo = computed(() => {
  const data = accountData.value?.data;
  if (!data) return null;

  if (isGraphApi.value && data.profile) {
    return {
      avatar_url: data.profile.profile_picture_url,
      display_name: data.profile.name || data.profile.username,
      bio_description: "",
      is_verified: false,
      follower_count: data.insights?.followers || 0,
      following_count: data.insights?.following || 0,
      likes_count: data.insights?.totalInteractions || 0,
      video_count: data.insights?.mediaCount || 0,
    };
  }

  return null;
});

// Get media/videos for content table
const media = computed(() => {
  const data = accountData.value?.data;
  if (!data) return [];

  if (isGraphApi.value && data.media) {
    return data.media.map((m: any) => ({
      id: m.id,
      title: m.caption || "Untitled",
      cover_image_url: m.thumbnail_url || m.media_url,
      create_time: m.timestamp ? new Date(m.timestamp).getTime() / 1000 : 0,
      // Use video_views for videos/reels, otherwise use reach/impressions
      view_count: (m.media_type === 'VIDEO' || m.media_product_type === 'REELS')
        ? (m.video_views || m.impressions || m.reach || 0)
        : (m.impressions || m.reach || 0),
      like_count: m.like_count || 0,
      comment_count: m.comment_count || 0,
      share_count: m.share_count || 0,
      saves: m.save_count || 0,
      media_type: m.media_type || "IMAGE",
      media_product_type: m.media_product_type || null,
      duration: m.media_type === "VIDEO" ? 0 : undefined, // Duration only for videos
    }));
  }

  return [];
});

const instagramStats = computed(() => {
  const data = accountData.value?.data;

  // Handle Instagram Graph API format
  if (isGraphApi.value && data?.insights) {
    const insights = data.insights;
    const reach = insights.reach || 0;
    const totalInteractions = insights.totalInteractions || 0;
    const engagementRate = reach > 0 ? (totalInteractions / reach) * 100 : 0;

    return [
      {
        title: "Impressions",
        value: formatNumber(insights.impressions || 0),
        change: "12%",
        changeType: "up" as const,
        icon: Eye,
        subtitle: "+12% vs last week",
      },
      {
        title: "Followers",
        value: formatNumber(insights.followers || 0),
        change: "5%",
        changeType: "up" as const,
        icon: Users,
        subtitle: "Total followers",
      },
      {
        title: "Accounts Reached",
        value: formatNumber(reach),
        change: "8.4%",
        changeType: "up" as const,
        icon: UserPlus,
        subtitle: "Unique accounts",
      },
      {
        title: "Profile Views",
        value: formatNumber(insights.profileViews || 0),
        change: "10%",
        changeType: "up" as const,
        icon: UserCheck,
        subtitle: "Profile visits",
      },
      {
        title: "Accounts Engaged",
        value: formatNumber(insights.accountsEngaged || 0),
        change: "15%",
        changeType: "up" as const,
        icon: Activity,
        subtitle: "Active accounts",
      },
      {
        title: "Total Likes",
        value: formatNumber(insights.likes || 0),
        change: "18%",
        changeType: "up" as const,
        icon: Heart,
        subtitle: "Total likes",
      },
      {
        title: "Shares",
        value: formatNumber(insights.shares || 0),
        change: "15%",
        changeType: "up" as const,
        icon: Share2,
        subtitle: "Total shares",
      },
      {
        title: "Engagement",
        value: `${engagementRate.toFixed(1)}%`,
        change: "18%",
        changeType: "up" as const,
        icon: Layers,
        subtitle: `${formatNumber(totalInteractions)} total interactions`,
      },
    ];
  }

  // Handle Instagram Basic API format
  if (!data?.analytics) return [];

  const analytics = data.analytics;
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
      toast.error("Instagram account not connected. Please connect your account first.");
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

    <!-- User Profile -->
    <UserProfile v-if="!loading && userInfo" :user-info="userInfo" />
    <UserProfileSkeleton v-else-if="loading" />

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 my-8">
      <template v-if="loading">
        <StatCardSkeleton :count="4" />
      </template>
      <template v-else>
        <StatCard
          v-for="stat in instagramStats"
          :key="stat.title"
          :title="stat.title"
          :value="stat.value"
          :change="stat.change"
          :change-type="stat.changeType"
          :icon="stat.icon"
          :subtitle="stat.subtitle"
          platform="instagram"
        />
      </template>
    </div>

    <!-- Audience Growth Chart -->
    <div class="mb-8">
      <ChartSkeleton v-if="loading" />
      <template v-else>
        <AudienceChart
          platform="instagram"
          title="Follower Net Growth"
          subtitle="Instagram specific growth metrics"
        />
      </template>
    </div>

    <!-- Instagram-Specific Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <TopCitiesPanel />
      <AgeRangePanel />
    </div>

    <!-- Top Performing Content -->
    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else platform="instagram" :videos="media" />
  </DashboardLayout>
</template>
