<script setup lang="ts">
withDefaults(
    defineProps<{
        count?: number
    }>(),
    { count: 4 }
)
</script>

<template>
    <div
        v-for="i in count"
        :key="i"
        class="brutal-card flex flex-col justify-between h-42 relative overflow-hidden rounded-none p-6"
    >
        <div class="space-y-3">
            <div class="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
            <div class="w-28 h-10 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
            <div class="w-44 h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
            <div class="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded-md skeleton-pulse" />
        </div>
    </div>
</template>
