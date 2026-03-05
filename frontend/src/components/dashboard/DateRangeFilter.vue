<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Calendar, ChevronDown } from 'lucide-vue-next'

interface Timeframe {
  label: string
  value: string
}

const props = defineProps<{
  modelValue: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const timeframes: Timeframe[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 14 days', value: '14d' },
  { label: 'Last 30 days', value: '30d' }
]

const selectedTimeframeLabel = computed(() => {
  return timeframes.find((t) => t.value === props.modelValue)?.label || 'Last 7 days'
})

const selectTimeframe = (value: string) => {
  emit('update:modelValue', value)
  isDropdownOpen.value = false
}

const toggleDropdown = () => {
  if (!props.loading) {
    isDropdownOpen.value = !isDropdownOpen.value
  }
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

// Keyboard handler
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isDropdownOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      type="button"
      :disabled="loading"
      @click="toggleDropdown"
      class="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 border-3 border-black dark:border-electric font-bold brutal-hover-lift group shadow-brutal-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Calendar :size="18" class="text-neo-accent dark:text-electric" />
      {{ selectedTimeframeLabel }}
      <ChevronDown
        :size="18"
        class="transition-transform duration-200"
        :class="{ 'rotate-180': isDropdownOpen }"
      />
    </button>

    <div
      v-if="isDropdownOpen"
      class="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-electric shadow-brutal z-50 flex flex-col"
    >
      <button
        type="button"
        v-for="tf in timeframes"
        :key="tf.value"
        @click="selectTimeframe(tf.value)"
        class="flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-bold text-slate-900 dark:text-white"
      >
        {{ tf.label }}
        <svg
          v-if="modelValue === tf.value"
          class="w-4 h-4 text-neo-accent dark:text-electric"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
