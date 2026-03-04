<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import RefreshControl from '@/components/layout/RefreshControl.vue'

interface Props {
  title: string
  subtitle?: string
  infoTooltip?: string
  lastUpdated?: Date | null
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
  lastUpdated: null
})

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div
    class="bg-neo-accent dark:bg-hotpink border-b-4 border-black dark:border-electric p-6 md:p-8 mb-8 -mx-4 md:-mx-8 relative"
  >
    <div class="flex items-center justify-between">
      <!-- Title Section -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start gap-3">
          <h2 class="text-4xl lg:text-5xl font-black uppercase text-slate-900 leading-tight">
            {{ title }}
          </h2>
          <div v-if="infoTooltip" class="relative group">
            <Info
              :size="18"
              class="text-slate-900 opacity-50 hover:opacity-100 cursor-help transition-opacity mt-1"
            />
            <div
              class="absolute left-0 top-full mt-2 w-72 p-3 rounded border-2 border-black dark:border-electric bg-white dark:bg-navy text-xs text-slate-700 dark:text-slate-300 leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg"
              v-html="infoTooltip"
            />
          </div>
        </div>
        <p v-if="subtitle" class="text-sm font-bold opacity-60 uppercase text-slate-900 mt-2">
          {{ subtitle }}
        </p>
      </div>

      <!-- Right side: refresh control -->
      <RefreshControl
        v-if="lastUpdated !== null || loading"
        :last-updated="lastUpdated"
        :loading="loading"
        @refresh="$emit('refresh')"
      />
    </div>
  </div>
</template>
