<script setup lang="ts">
import { MapPin } from 'lucide-vue-next'

interface CityData {
  name: string
  percentage: number
}

interface Props {
  cities?: CityData[]
}

const props = withDefaults(defineProps<Props>(), {
  cities: () => [
    { name: 'Jakarta', percentage: 78 },
    { name: 'Surabaya', percentage: 45 },
    { name: 'Bandung', percentage: 32 }
  ]
})

const getBarColor = (index: number) => {
  const colors = ['bg-pink-500', 'bg-pink-400', 'bg-pink-300']
  return colors[index] || 'bg-pink-200'
}
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
    <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
      <MapPin :size="18" class="text-pink-500" />
      Top Cities
    </h4>
    <div class="space-y-4">
      <div
        v-for="(city, index) in cities"
        :key="city.name"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-slate-600 dark:text-slate-300 min-w-[80px]">
          {{ city.name }}
        </span>
        <div class="flex-1 mx-4 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all', getBarColor(index)]"
            :style="{ width: `${city.percentage}%` }"
          />
        </div>
        <span class="text-sm font-bold text-slate-900 dark:text-white min-w-[40px] text-right">
          {{ city.percentage }}%
        </span>
      </div>
    </div>
  </div>
</template>
