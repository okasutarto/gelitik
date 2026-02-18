<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number;
  }>(),
  { count: 4 },
);
</script>

<template>
  <div
    v-for="i in count"
    :key="i"
    class="brutal-card flex flex-col justify-between h-36 relative overflow-hidden rounded-none p-6">
    <div class="flex items-center justify-between">
      <div
        class="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
    </div>

    <div class="space-y-2">
      <div
        class="w-32 h-7 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
    </div>
  </div>
</template>
