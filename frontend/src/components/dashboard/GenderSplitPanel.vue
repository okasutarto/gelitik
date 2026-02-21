<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "@/composables/useTheme";

interface GenderData {
  gender: string;
  percentage: number;
}

interface Props {
  data: GenderData[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const { isDark } = useTheme();

const genderColors: Record<string, string> = {
  Male: "#1A1A2E",
  Female: "#FF4B8B",
  Other: "#FFD000",
};

const genderColorsDark: Record<string, string> = {
  Male: "#00F0FF",
  Female: "#FF4B8B",
  Other: "#FFD000",
};

const sortedData = computed(() => [...props.data].sort((a, b) => b.percentage - a.percentage));

const getColor = (gender: string) =>
  isDark.value ? genderColorsDark[gender] || "#94a3b8" : genderColors[gender] || "#94a3b8";
</script>

<template>
  <div class="brutal-card p-6 brutal-hover-lift">
    <h2 class="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white mb-1">
      Gender Split
    </h2>
    <p class="text-sm font-bold opacity-60 uppercase text-slate-900 dark:text-slate-400 mb-4">
      Audience Demographics
    </p>

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-1">
          <div class="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div class="h-6 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else-if="sortedData.length > 0">
      <div class="space-y-4">
        <div v-for="item in sortedData" :key="item.gender">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-bold text-slate-700 dark:text-slate-300">
              {{ item.gender }}
            </span>
            <span class="text-sm font-black text-slate-900 dark:text-white">
              {{ item.percentage.toFixed(1) }}%
            </span>
          </div>
          <div
            class="w-full h-5 bg-slate-100 dark:bg-slate-800 rounded border-2 border-black dark:border-slate-600 overflow-hidden"
          >
            <div
              class="h-full rounded-sm transition-all duration-500"
              :style="{
                width: item.percentage + '%',
                backgroundColor: getColor(item.gender),
              }"
            ></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Placeholder -->
    <template v-else>
      <div class="text-center py-8">
        <p class="text-sm text-slate-400 dark:text-slate-500 italic">
          Requires 100+ followers to display
        </p>
      </div>
    </template>
  </div>
</template>
