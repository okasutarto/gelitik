<script setup lang="ts">
import { ref } from "vue";
import { Info } from "lucide-vue-next";
import { formatNumber } from "@/utils/format";
import type { Component } from "vue";

interface SubMetric {
  label: string;
  value: string | number;
}

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: Component;
  subMetrics?: SubMetric[];
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const showTooltip = ref(false);
</script>

<template>
  <div class="brutal-card brutal-hover-lift p-6 flex flex-col">
    <!-- Skeleton loader -->
    <template v-if="loading">
      <div class="space-y-3">
        <div class="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded mb-3 skeleton-pulse"></div>
        <div class="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded mb-2 skeleton-pulse"></div>
        <div class="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-4 skeleton-pulse"></div>
        <div class="h-px w-full bg-slate-100 dark:bg-slate-800 mb-4 skeleton-pulse"></div>
        <div class="flex items-center justify-between">
          <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded skeleton-pulse"></div>
          <div class="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded skeleton-pulse"></div>
        </div>
        <div class="flex items-center justify-between">
          <div class="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded skeleton-pulse"></div>
          <div class="h-3 w-10 bg-slate-100 dark:bg-slate-800 rounded skeleton-pulse"></div>
        </div>
      </div>
    </template>

    <!-- Card content -->
    <template v-else>
      <!-- Header with icon and info -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {{ title }}
          </p>
          <!-- Info icon with tooltip -->
          <div v-if="description" class="relative">
            <button
              @mouseenter="showTooltip = true"
              @mouseleave="showTooltip = false"
              @click.stop="showTooltip = !showTooltip"
              class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <Info :size="14" />
            </button>
            <!-- Tooltip popup -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="showTooltip"
                class="absolute left-0 top-full mt-2 w-72 p-4 bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-600 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.1)] z-50 text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed"
              >
                {{ description }}
              </div>
            </Transition>
          </div>
        </div>
        <div
          v-if="icon"
          class="size-11 rounded-full border-3 border-black dark:border-electric flex items-center justify-center bg-neo-accent dark:bg-hotpink"
        >
          <component :is="icon" :size="22" class="text-black dark:text-navy" :stroke-width="2" />
        </div>
      </div>

      <!-- Primary value -->
      <h3 class="text-4xl font-black text-slate-900 dark:text-white mb-1">
        {{ typeof value === "number" ? formatNumber(value) : value }}
      </h3>

      <!-- Subtitle -->
      <p v-if="subtitle" class="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-4">
        {{ subtitle }}
      </p>

      <!-- Divider -->
      <div
        v-if="subMetrics && subMetrics.length"
        class="border-t border-slate-200 dark:border-slate-700 my-3"
      ></div>

      <!-- Sub-metrics -->
      <div v-if="subMetrics && subMetrics.length" class="space-y-2 mt-auto">
        <div v-for="sub in subMetrics" :key="sub.label" class="flex items-center justify-between">
          <span class="text-sm font-bold text-slate-500 dark:text-slate-400">
            {{ sub.label }}
          </span>
          <span class="text-sm font-black text-slate-900 dark:text-white">
            {{ typeof sub.value === "number" ? formatNumber(sub.value) : sub.value }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
