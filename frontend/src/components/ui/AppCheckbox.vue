<script setup lang="ts">
interface Props {
  id: string
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <input
      :id="id"
      type="checkbox"
      :checked="modelValue"
      @change="handleChange"
      class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 
             text-primary bg-white dark:bg-slate-800
             focus:ring-primary focus:ring-2 focus:ring-offset-0
             cursor-pointer transition-colors"
    />
    <label
      :for="id"
      class="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
    >
      <slot />
    </label>
  </div>
</template>
