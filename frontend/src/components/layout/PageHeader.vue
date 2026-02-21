<script setup lang="ts">
interface Props {
  title: string;
  subtitle?: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="bg-neo-accent dark:bg-hotpink border-b-4 border-black dark:border-electric p-6 md:p-8 mb-8 -mx-4 md:-mx-8 relative"
  >
    <div class="flex items-center">
      <!-- Title Section -->
      <div class="flex-1 min-w-0">
        <h2 class="text-4xl lg:text-5xl font-black uppercase text-slate-900 leading-tight">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-2">
          {{ subtitle }}
        </p>
      </div>
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
