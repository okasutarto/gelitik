<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useRoute } from "vue-router";
import { Eye, Heart, UserCheck, Activity, Calendar, ChevronDown } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import InsightCard from "@/components/dashboard/InsightCard.vue";
import UserProfile from "@/components/dashboard/UserProfile.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";
import GenderSplitPanel from "@/components/dashboard/GenderSplitPanel.vue";
import TopCitiesPanel from "@/components/dashboard/TopCitiesPanel.vue";
import AgeRangePanel from "@/components/dashboard/AgeRangePanel.vue";

import UserProfileSkeleton from "@/components/loading/UserProfileSkeleton.vue";
import ChartSkeleton from "@/components/loading/ChartSkeleton.vue";
import ContentTableSkeleton from "@/components/loading/ContentTableSkeleton.vue";
import { usePlatformAnalytics } from "@/composables/usePlatformAnalytics";
import { useRouter } from "vue-router";

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

// Timeframe Filter State
const isDropdownOpen = ref(false);
const selectedTimeframe = ref("this_week");
const timeframes = [
  { label: "Last 7 days", value: "this_week" },
  { label: "Last 14 days", value: "last_14_days" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "Last 90 days", value: "last_90_days" },
];

const selectedTimeframeLabel = computed(() => {
  return timeframes.find((t) => t.value === selectedTimeframe.value)?.label || "Last 7 days";
});

const fetchData = () => {
  fetchAnalytics(selectedTimeframe.value).catch((err: unknown) => {
    const axiosErr = err as AxiosError;
    if (axiosErr.response?.status === 404) {
      toast.error("Instagram account not connected. Please connect your account first.");
      router.push("/connections");
    }
  });
};

const selectTimeframe = (value: string) => {
  selectedTimeframe.value = value;
  isDropdownOpen.value = false;
  fetchData();
};

// Get user profile data - map to UserProfile expected format

const userInfo = computed(() => {
  const data = accountData.value?.data as any; // Assert as any to bypass static type issues for now
  if (!data) return null;

  if (isGraphApi.value && data.profile) {
    return {
      id: data.profile.id || "",
      name: data.profile.name || data.profile.username,
      avatar_url: data.profile.profile_picture_url,
      bio: data.profile.biography || "",
      is_verified: false,
      followers_count: data.insights?.followers || 0,
      following_count: data.profile.follows_count || data.insights?.following || 0,
      likes_count: data.insights?.totalInteractions || 0,
      videos_count: data.insights?.mediaCount || data.profile?.media_count || 0,
    };
  }

  return null;
});

// Get media/videos for content table
const media = computed(() => {
  const data = accountData.value?.data as any;
  if (!data) return [];

  if (isGraphApi.value && data.media) {
    return Array.isArray(data.media) ? data.media : [];
  }

  // Handle standard internal format if needed
  return Array.isArray(data.videos)
    ? data.videos.map((m: any) => ({
        id: m.id,
        title: m.caption || "Untitled",
        cover_image_url: m.thumbnail_url || m.media_url,
        create_time: m.timestamp ? new Date(m.timestamp).getTime() / 1000 : 0,
        // The frontend ContentTable expects view_count, likes, comments, shares, saves
        view_count:
          m.media_type === "VIDEO" || m.media_product_type === "REELS"
            ? m.video_views || m.views || m.reach || 0
            : m.views || m.reach || 0,
        like_count: m.like_count || 0,
        comment_count: m.comment_count || 0,
        share_count: m.share_count || 0,
        saves: m.save_count || 0,
        media_type: m.media_type || "IMAGE",
        media_product_type: m.media_product_type || null,
        duration: m.media_type === "VIDEO" ? 0 : undefined, // Duration only for videos
      }))
    : [];
});

// Combined insight cards matching official Instagram dashboard
const insightCards = computed(() => {
  const data = accountData.value?.data as any;
  if (!data) return [];

  if (isGraphApi.value && data.insights) {
    const insights = data.insights;

    return [
      {
        title: "Views",
        value: insights.views || 0,
        subtitle: "Content plays & displays",
        description:
          "The number of times your content was played or displayed. Content includes reels, posts, stories, videos, live videos and ads.",
        icon: Eye,
        subMetrics: [{ label: "Accounts reached", value: insights.reach || 0 }],
      },
      {
        title: "Interactions",
        value: insights.totalInteractions || 0,
        subtitle: "Likes, comments, shares & saves",
        description:
          "The total number of interactions on your content, including likes, saves, comments, shares and replies. Includes interactions on boosted content.",
        icon: Heart,
        subMetrics: [{ label: "Accounts engaged", value: insights.accountsEngaged || 0 }],
      },
      {
        title: "Profile",
        value: insights.profileViews || 0,
        subtitle: "Profile activity",
        description:
          "These insights measure the number of actions people take when they engage with your profile, including profile visits and external link taps.",
        icon: UserCheck,
        subMetrics: [
          { label: "Profile visits", value: insights.profileViews || 0 },
          { label: "External link taps", value: insights.profileLinkTaps || 0 },
        ],
      },
      {
        title: "Engagement",
        value: insights.saves || 0,
        subtitle: "Content saves",
        description:
          "A breakdown of engagement actions on your content: likes, comments, shares and saves. These metrics help you understand how your audience interacts with your posts.",
        icon: Activity,
        subMetrics: [
          { label: "Likes", value: insights.likes || 0 },
          { label: "Comments", value: insights.comments || 0 },
          { label: "Shares", value: insights.shares || 0 },
          { label: "Saves", value: insights.saves || 0 },
        ],
      },
    ];
  }

  return [];
});

onMounted(() => {
  fetchData();
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

    <!-- Filter Actions Row -->
    <div class="flex justify-end mt-6 relative">
      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 border-2 border-black dark:border-white font-bold brutal-hover-lift group"
        >
          <Calendar :size="18" class="text-neo-accent dark:text-electric" />
          {{ selectedTimeframeLabel }}
          <ChevronDown
            :size="18"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': isDropdownOpen }"
          />
        </button>

        <div
          v-if="isDropdownOpen"
          class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] z-50 flex flex-col"
        >
          <button
            v-for="tf in timeframes"
            :key="tf.value"
            @click="selectTimeframe(tf.value)"
            class="flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-slate-900 dark:text-white"
          >
            {{ tf.label }}
            <svg
              v-if="selectedTimeframe === tf.value"
              class="w-4 h-4 text-neo-accent dark:text-electric"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Insight Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-6">
      <template v-if="loading">
        <InsightCard v-for="i in 4" :key="i" :title="''" :value="0" :loading="true" />
      </template>
      <template v-else>
        <InsightCard
          v-for="card in insightCards"
          :key="card.title"
          :title="card.title"
          :value="card.value"
          :subtitle="card.subtitle"
          :description="card.description"
          :icon="card.icon"
          :sub-metrics="card.subMetrics"
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
    <!-- Demographics row -->
    <div
      class="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 border border-slate-200 dark:border-slate-800"
    >
      <GenderSplitPanel
        :data="(accountData?.data as any)?.insights?.demographics?.gender || []"
        :loading="loading"
      />
      <TopCitiesPanel
        :data="(accountData?.data as any)?.insights?.demographics?.cities || []"
        :loading="loading"
      />
      <AgeRangePanel
        :data="(accountData?.data as any)?.insights?.demographics?.age || []"
        :loading="loading"
      />
    </div>

    <!-- Top Performing Content -->
    <ContentTableSkeleton v-if="loading" />
    <ContentTable v-else-if="accountData?.data" :platform="'instagram' as any" :videos="media" />
  </DashboardLayout>
</template>
