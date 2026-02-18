<template>
  <div class="brutal-card rounded-none overflow-hidden">
    <div class="hidden md:block">
      <div class="divide-y divide-y-2 divide-black">
        <div v-for="i in 4" :key="i" class="px-4 py-4 flex items-center gap-3">
          <div
            class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg skeleton-pulse shrink-0" />
          <div
            class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
          <div
            class="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
          <div class="flex-1 flex justify-end gap-10">
            <div
              class="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
            <div
              class="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
            <div
              class="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
            <div
              class="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
            <div
              class="w-16 h-4 bg-slate-100 dark:bg-slate-800 rounded-md skeleton-pulse" />
          </div>
        </div>
      </div>
    </div>

    <div
      class="md:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
      <div v-for="i in 4" :key="i" class="p-4 flex gap-4">
        <div
          class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg skeleton-pulse shrink-0" />
        <div class="flex-1 space-y-2">
          <div
            class="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded-sm skeleton-pulse" />
          <div class="w-24 h-3 bg-slate-100 dark:bg-slate-800 rounded-sm" />
        </div>
        <div
          class="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-sm skeleton-pulse" />
      </div>
    </div>
  </div>
</template>
