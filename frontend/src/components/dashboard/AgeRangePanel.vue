<script setup lang="ts">
import { Cake } from "lucide-vue-next";

interface AgeGroup {
  label: string;
  percentage: number;
  highlight?: boolean;
}

interface Props {
  ageGroups?: AgeGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  ageGroups: () => [
    { label: "13-17", percentage: 30 },
    { label: "18-24", percentage: 60 },
    { label: "25-34", percentage: 100, highlight: true },
    { label: "35-44", percentage: 40 },
    { label: "45+", percentage: 20 },
  ],
});

const getBarHeight = (percentage: number) => `${percentage}%`;

const getBarClass = (group: AgeGroup) => {
  if (group.highlight)
    return "bg-purple-500 shadow-lg shadow-purple-200 dark:shadow-purple-900/30";
  if (group.percentage >= 60) return "bg-purple-400";
  if (group.percentage >= 40) return "bg-purple-300";
  return "bg-purple-200 dark:bg-purple-800";
};
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <h4
      class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
      <Cake :size="18" class="text-purple-500" />
      Age Range
    </h4>
    <div class="flex items-end justify-between h-32 px-2">
      <div
        v-for="group in ageGroups"
        :key="group.label"
        class="flex flex-col items-center gap-2 group">
        <div
          :class="[
            'w-8 rounded-t transition-colors group-hover:opacity-80',
            getBarClass(group),
          ]"
          :style="{ height: getBarHeight(group.percentage) }" />
        <span
          :class="[
            'text-xs',
            group.highlight
              ? 'text-slate-900 dark:text-white font-bold'
              : 'text-slate-500 dark:text-slate-400',
          ]">
          {{ group.label }}
        </span>
      </div>
    </div>
  </div>
</template>
