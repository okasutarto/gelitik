```vue
<script setup lang="ts">
import { computed } from "vue";
import { Cake } from "lucide-vue-next";

interface AgeGroup {
  label: string;
  percentage: number;
  highlight?: boolean;
}

interface Props {
  data?: AgeGroup[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
});

const defaultGroups: AgeGroup[] = [
  { label: "13-17", percentage: 30 },
  { label: "18-24", percentage: 60 },
  { label: "25-34", percentage: 100, highlight: true },
  { label: "35-44", percentage: 40 },
  { label: "45+", percentage: 20 },
];

const displayGroups = computed(() => {
  const groups = props.data && props.data.length > 0 ? props.data : defaultGroups;
  const max = Math.max(...groups.map((g) => g.percentage));
  return groups.map((g) => ({
    ...g,
    highlight: g.percentage === max && max > 0,
  }));
});

const maxPercentage = computed(() => {
  const max = Math.max(...displayGroups.value.map((g) => g.percentage));
  return max > 0 ? max : 1; // Prevent division by zero
});

const getBarHeight = (percentage: number) => {
  // Scale the height relative to the max percentage so the highest bar is always 100% of the container
  const relativeHeight = (percentage / maxPercentage.value) * 100;
  return `${relativeHeight}%`;
};

const getBarClass = (group: AgeGroup) => {
  if (group.highlight)
    return "bg-primary-500 border border-black dark:border-slate-600 shadow-brutal-sm";
  return "bg-slate-200 dark:bg-slate-700 border border-black/10 dark:border-slate-600";
};
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <!-- Skeleton -->
    <template v-if="loading">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded skeleton-pulse"></div>
        <div class="w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded skeleton-pulse"></div>
      </div>
      <div class="flex justify-between h-48 px-2">
        <div v-for="i in 5" :key="i" class="flex flex-col items-center justify-end gap-2 h-full">
          <div
            class="w-8 bg-slate-200 dark:bg-slate-800 rounded-t skeleton-pulse"
            :style="{ height: [40, 80, 100, 60, 30][i - 1] + '%' }"
          />
          <div class="w-6 h-3 bg-slate-200 dark:bg-slate-800 rounded skeleton-pulse"></div>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Cake :size="18" class="text-primary-500" />
        Age Range
      </h4>
      <div class="flex justify-between h-48 px-2">
        <div
          v-for="group in displayGroups"
          :key="group.label"
          class="flex flex-col items-center justify-end gap-2 group h-full"
        >
          <div
            :class="['w-8 rounded-t transition-colors group-hover:opacity-80', getBarClass(group)]"
            :style="{ height: getBarHeight(group.percentage) }"
          />
          <span
            :class="[
              'text-xs',
              group.highlight
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 dark:text-slate-400',
            ]"
          >
            {{ group.label }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
