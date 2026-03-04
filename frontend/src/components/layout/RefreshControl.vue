<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'

interface Props {
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
  <div class="flex items-center gap-3">
    <span
      v-if="lastUpdated"
      class="text-xs text-slate-500 dark:text-slate-400 font-bold hidden sm:inline-block"
    >
      Updated {{ lastUpdated.toLocaleTimeString() }}
    </span>
    <button
      @click="$emit('refresh')"
      class="brutal-card bg-white dark:bg-navy p-2 brutal-hover-lift"
      :class="{ 'animate-spin': loading }"
      title="Refresh data"
    >
      <RefreshCw :size="16" class="text-slate-900 dark:text-white" />
    </button>
  </div>
</template>
