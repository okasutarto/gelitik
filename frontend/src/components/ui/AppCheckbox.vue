<script setup lang="ts">
interface Props {
  id: string;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
};
</script>

<template>
  <div class="flex items-center gap-3">
    <input
      :id="id"
      type="checkbox"
      :checked="modelValue"
      @change="handleChange"
      class="w-6 h-6 border-neo-3 border-black text-neo-accent bg-white dark:bg-slate-800 cursor-pointer shadow-neo-hard focus:outline-none" />
    <label
      :for="id"
      class="text-sm text-slate-900 dark:text-white font-bold cursor-pointer select-none">
      <slot />
    </label>
  </div>
</template>
