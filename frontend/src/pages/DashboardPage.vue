<script setup lang="ts">
import { Users, Heart, FileText, MousePointerClick } from "lucide-vue-next";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import AudienceChart from "@/components/dashboard/AudienceChart.vue";
import ContentTable from "@/components/dashboard/ContentTable.vue";

// Overview stats combining all platforms
const overviewStats = [
  {
    title: "Total Audience",
    value: "1.8M",
    change: "12%",
    changeType: "up" as const,
    icon: Users,
    subtitle: "+24k this week",
  },
  {
    title: "Total Engagement",
    value: "8.2%",
    change: "5.4%",
    changeType: "up" as const,
    icon: Heart,
    subtitle: "Avg. across platforms",
  },
  {
    title: "Total Posts",
    value: "1,240",
    change: "2.1%",
    changeType: "down" as const,
    icon: FileText,
    subtitle: "Published YTD",
  },
  {
    title: "Link Clicks",
    value: "8,902",
    change: "18%",
    changeType: "up" as const,
    icon: MousePointerClick,
    subtitle: "Across all bios",
  },
];
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <div class="bg-white dark:bg-slate-800 border-b-4 border-black dark:border-white p-6 md:p-8 mb-8 -mx-4 md:-mx-8">
      <h2 class="text-4xl lg:text-5xl font-black uppercase text-slate-900 dark:text-white leading-tight">
        Overview
      </h2>
      <p class="text-sm font-bold opacity-60 uppercase text-slate-600 dark:text-slate-400 mt-2">
        Welcome back to your master dashboard.
      </p>
    </div>

    <!-- Bento Grid Layout -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <!-- Stat Cards Row -->
      <StatCard
        v-for="stat in overviewStats"
        :key="stat.title"
        :title="stat.title"
        :value="stat.value"
        :change="stat.change"
        :change-type="stat.changeType"
        :icon="stat.icon"
        :subtitle="stat.subtitle"
        platform="all" />

      <!-- Audience Chart - Full Width Below -->
      <div class="col-span-1 md:col-span-2 lg:col-span-4 mt-6">
        <AudienceChart
          platform="all"
          title="Audience Growth"
          subtitle="Combined performance over last 7 days" />
      </div>
    </div>

    <!-- Top Performing Content -->
    <ContentTable platform="all" />
  </DashboardLayout>
</template>
