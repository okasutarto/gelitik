<script setup lang="ts">
import { computed } from "vue";
import { MapPin } from "lucide-vue-next";

interface CityData {
  name: string;
  percentage: number;
}

interface Props {
  data?: CityData[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
});

const defaultCities = [
  { name: "Jakarta", percentage: 78 },
  { name: "Surabaya", percentage: 45 },
  { name: "Bandung", percentage: 32 },
];

const displayCities = computed(() => {
  if (props.data && props.data.length > 0) return props.data;
  return defaultCities;
});

const getBarColor = (index: number) => {
  const colors = ["bg-pink-500", "bg-pink-400", "bg-pink-300"];
  return colors[index] || "bg-pink-200";
};
</script>

<template>
  <div class="brutal-card brutal-hover-lift rounded-none p-6">
    <!-- Skeleton -->
    <template v-if="loading">
      <div class="space-y-6">
        <div class="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded skeleton-pulse"></div>
        <div v-for="i in 5" :key="i" class="space-y-1">
          <div class="h-6 bg-slate-200 dark:bg-slate-800 rounded skeleton-pulse"></div>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else>
      <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <MapPin :size="18" class="text-pink-500" />
        Top Cities
      </h4>

      <div class="space-y-6">
        <div
          v-for="(city, index) in displayCities"
          :key="city.name"
          class="flex items-center justify-between"
        >
          <span class="text-sm text-slate-600 dark:text-slate-300 min-w-[80px]">
            {{ city.name }}
          </span>
          <div class="flex-1 mx-4 h-2 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              :class="['h-full rounded-full transition-all', getBarColor(index)]"
              :style="{ width: `${city.percentage}%` }"
            />
          </div>
          <span
            class="text-sm font-mono font-bold text-slate-900 dark:text-white min-w-[40px] text-right"
          >
            {{ city.percentage }}%
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
