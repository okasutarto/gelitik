<script setup lang="ts">
import { computed, type Component } from "vue";
import { TrendingUp, TrendingDown } from "lucide-vue-next";
import type { Platform } from "@/composables/usePlatform";

interface Props {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: Component;
  platform?: Platform;
  subtitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  platform: "all",
  subtitle: "",
});

const iconBgColor = computed(() => {
  const colors: Record<Platform, string> = {
    all: "text-primary-600",
    instagram: "text-pink-500",
    tiktok: "text-slate-800 dark:text-slate-200",
    linkedin: "text-blue-600",
  };
  return colors[props.platform] || colors.all;
});

const changeBadgeClass = computed(() =>
  props.changeType === "up"
    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
);
</script>

<template>
  <div
    class="neo-card border-neo-3 border-black flex flex-col justify-between h-36 relative overflow-hidden group neo-hover-lift">
    <!-- Header -->
    <div class="flex items-center justify-between relative z-10">
      <p
        class="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-wide">
        {{ title }}
      </p>
      <span
        :class="[
          'text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
          changeBadgeClass,
        ]">
        <TrendingUp v-if="changeType === 'up'" :size="14" />
        <TrendingDown v-else :size="14" />
        {{ change }}
      </span>
    </div>

    <!-- Value -->
    <div class="relative z-10">
      <h3
        class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
        {{ value }}
      </h3>
      <p
        v-if="subtitle"
        class="text-xs text-slate-400 dark:text-slate-500 mt-1">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
