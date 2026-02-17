<script setup lang="ts">
import { Sun, Moon } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";

interface Props {
  title: string;
  subtitle?: string;
  showThemeToggle?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: "",
  showThemeToggle: true,
});

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <div
    class="bg-neo-accent dark:bg-hotpink border-b-4 border-black dark:border-electric p-6 md:p-8 mb-8 -mx-4 md:-mx-8 relative">
    <div class="flex items-center justify-between gap-4">
      <!-- Title Section -->
      <div class="flex-1 min-w-0">
        <h2
          class="text-4xl lg:text-5xl font-black uppercase text-slate-900 leading-tight">
          {{ title }}
        </h2>
        <p
          v-if="subtitle"
          class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-2">
          {{ subtitle }}
        </p>
      </div>

      <!-- Theme Toggle -->
      <button
        v-if="showThemeToggle"
        @click="toggleTheme"
        :class="[
          'flex-shrink-0 size-12 border-3 flex items-center justify-center transition-all',
          'bg-white dark:bg-navy border-black dark:border-electric',
          'shadow-brutal-sm dark:shadow-brutal-cyber-sm',
          'hover:-translate-y-1 hover:shadow-brutal dark:hover:shadow-brutal-cyber',
          'active:shadow-brutal-active dark:active:shadow-brutal-cyber-active active:translate-y-0',
        ]"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
        <Sun
          v-if="isDark"
          :size="24"
          class="text-black dark:text-offwhite"
          :stroke-width="2" />
        <Moon
          v-else
          :size="24"
          class="text-black dark:text-offwhite"
          :stroke-width="2" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}
</style>
