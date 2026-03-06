<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 2 }
)
</script>

<template>
  <div
    v-for="i in count"
    :key="i"
    class="brutal-card flex flex-col justify-between h-42 relative overflow-hidden rounded-none p-6"
  >
    <div class="flex justify-start items-center gap-2">
      <div class="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
      <div>
        <div class="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse mb-2" />
        <div class="w-28 h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
      </div>
    </div>
    <div class="space-y-8 mt-8">
      <!-- Row 1: Primary Metrics -->
      <div class="grid grid-cols-4 gap-4">
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        <div class="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
      </div>
    </div>
  </div>
</template>
