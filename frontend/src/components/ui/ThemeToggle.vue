<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    @click="toggleTheme"
    class="relative flex items-center justify-center w-10 h-10 rounded-xl 
           bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
           hover:bg-slate-50 dark:hover:bg-slate-700 
           transition-all duration-200 cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-primary/20"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <Transition name="theme-icon" mode="out-in">
      <Sun
        v-if="isDark"
        class="w-5 h-5 text-amber-500"
      />
      <Moon
        v-else
        class="w-5 h-5 text-slate-600"
      />
    </Transition>
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
