<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { formatNumber } from "@/utils/format";
import type { Component } from "vue";

interface Props {
  title: string;
  value: string | number;
  trend?: number;
  icon?: Component;
  trendText?: string;
  subtitle?: string;
  // Delta support
  delta?: number;
  deltaPercent?: number;
  deltaLabel?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  trend: 0,
  loading: false,
});

// Count-up animation
const displayValue = ref<string | number>(props.value);
const hasAnimated = ref(false);

function animateValue(target: number, duration = 800) {
  const start = 0;
  const startTime = performance.now();

  function step(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    displayValue.value = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      displayValue.value = formatNumber(target);
    }
  }

  requestAnimationFrame(step);
}

onMounted(() => {
  if (typeof props.value === "number" && !props.loading) {
    animateValue(props.value);
    hasAnimated.value = true;
  }
});

watch(
  () => props.value,
  (newVal) => {
    if (typeof newVal === "number" && hasAnimated.value) {
      displayValue.value = formatNumber(newVal);
    } else if (typeof newVal === "number" && !hasAnimated.value && !props.loading) {
      animateValue(newVal);
      hasAnimated.value = true;
    } else {
      displayValue.value = newVal;
    }
  }
);

const formattedDelta = (val: number) => {
  const abs = Math.abs(val);
  const sign = val >= 0 ? "+" : "-";
  return `${sign}${formatNumber(abs)}`;
};
</script>

<template>
  <div class="brutal-card brutal-hover-lift p-6 flex flex-col justify-between">
    <!-- Skeleton loader -->
    <template v-if="loading">
      <div class="animate-pulse">
        <div class="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
        <div class="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
        <div class="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
      </div>
    </template>

    <!-- Card content -->
    <template v-else>
      <div class="flex items-start justify-between mb-4">
        <div>
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
            {{ title }}
          </p>
          <h3 class="text-3xl font-black text-slate-900 dark:text-white">
            {{ typeof value === "number" ? displayValue : value }}
          </h3>
        </div>
        <div
          class="size-11 rounded-full border-3 border-black dark:border-electric flex items-center justify-center bg-neo-accent dark:bg-hotpink"
        >
          <component :is="icon" :size="22" class="text-black dark:text-navy" :stroke-width="2" />
        </div>
      </div>

      <!-- Delta indicator -->
      <div
        v-if="delta !== undefined || deltaPercent !== undefined"
        class="flex items-center gap-2 mb-1"
      >
        <span
          v-if="delta !== undefined"
          class="text-sm font-bold"
          :class="
            delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          "
        >
          {{ delta >= 0 ? "▲" : "▼" }} {{ formattedDelta(delta) }}
        </span>
        <span
          v-if="deltaPercent !== undefined"
          class="text-xs font-semibold px-1.5 py-0.5 rounded"
          :class="
            deltaPercent >= 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          "
        >
          {{ deltaPercent >= 0 ? "+" : "" }}{{ deltaPercent.toFixed(1) }}%
        </span>
        <span v-if="deltaLabel" class="text-xs text-slate-400 dark:text-slate-500">
          {{ deltaLabel }}
        </span>
      </div>

      <!-- Subtitle -->
      <div class="flex items-center gap-2 mt-auto" v-if="subtitle">
        <span class="text-sm font-bold text-slate-500 dark:text-slate-400">{{ subtitle }}</span>
      </div>
    </template>
  </div>
</template>
