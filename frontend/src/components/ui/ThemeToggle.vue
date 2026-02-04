<script setup lang="ts">
import { Sun, Moon } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    @click="toggleTheme"
    :class="[
      'p-3 rounded-2xl border-neo-3 border-black cursor-pointer transition-transform shadow-neo-hard-sm',
      isDark ? 'bg-slate-800 text-slate-200' : 'bg-neo-accent text-black',
    ]"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
    <Sun v-if="isDark" :size="24" :stroke-width="2" />
    <Moon v-else :size="24" :stroke-width="2" />
  </button>
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
