```vue
<script setup lang="ts">
import { formatNumber } from "@/utils/format";

import type { Component } from "vue";

interface Props {
  title: string;
  value: string | number;
  trend?: number;
  icon?: Component;
  trendText?: string;
  subtitle?: string;
}

withDefaults(defineProps<Props>(), {
  trend: 0,
});
</script>

<template>
  <div class="brutal-card brutal-hover-lift p-6 flex flex-col justify-between">
    <div class="flex items-start justify-between mb-4">
      <div>
        <p class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
          {{ title }}
        </p>
        <h3 class="text-3xl font-black text-slate-900 dark:text-white">
          {{ typeof value === "number" ? formatNumber(value) : value }}
        </h3>
      </div>
      <div
        class="w-12 h-12 rounded-full border-2 border-black flex items-center justify-center bg-white dark:bg-slate-800"
      >
        <component :is="icon" class="text-neo-accent dark:text-electric" />
      </div>
    </div>

    <!-- Trend Indicator -->
    <div class="flex items-center gap-2 mt-auto" v-if="subtitle">
      <span class="text-sm font-bold text-slate-500 dark:text-slate-400">{{ subtitle }}</span>
    </div>
  </div>
</template>
```
