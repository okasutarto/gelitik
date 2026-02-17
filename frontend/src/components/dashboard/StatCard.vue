<script setup lang="ts">
import { computed, type Component } from "vue";
import type { Platform } from "@/types/platform";

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
</script>

<template>
  <div
    class="brutal-card flex flex-col justify-between h-36 relative overflow-hidden group brutal-hover-lift rounded-none p-6">
    <!-- Header -->
    <div class="flex items-center justify-between relative z-10">
      <p
        class="text-slate-500 dark:text-electric/70 text-xs font-black uppercase tracking-tighter">
        {{ title }}
      </p>
    </div>

    <!-- Value -->
    <div class="relative z-10">
      <h3
        class="text-3xl font-mono font-bold text-slate-900 dark:text-offwhite tracking-tight">
        {{ value }}
      </h3>
      <p v-if="subtitle" class="text-xs text-slate-400 dark:text-cyber/80 mt-1">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>
