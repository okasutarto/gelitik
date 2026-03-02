<script setup lang="ts">
interface Props {
  modelValue: string;
  options?: { label: string; value: string }[];
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "90D", value: "90d" },
  ],
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="inline-flex border-2 border-black dark:border-electric overflow-hidden">
    <button
      v-for="option in props.options"
      :key="option.value"
      class="px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors duration-150"
      :class="
        modelValue === option.value
          ? 'bg-neo-accent text-black dark:bg-electric dark:text-navy'
          : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-navy dark:text-slate-400 dark:hover:bg-slate-800'
      "
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
