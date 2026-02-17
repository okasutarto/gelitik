<script setup lang="ts">
import { ref, computed, type Component } from "vue";
import { Eye, EyeOff } from "lucide-vue-next";

interface Props {
  id?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  modelValue?: string;
  icon?: Component;
  disabled?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  placeholder: "",
  modelValue: "",
  disabled: false,
  required: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const showPassword = ref(false);
const isPasswordType = computed(() => props.type === "password");
const inputType = computed(() => {
  if (isPasswordType.value) {
    return showPassword.value ? "text" : "password";
  }
  return props.type;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="relative group">
    <input
      :id="id"
      :type="inputType"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      @input="handleInput"
      :class="[
        'w-full h-12 bg-white dark:bg-navy/50',
        'border-neo-3 border-black dark:border-electric/50',
        'text-slate-900 dark:text-offwhite placeholder:text-slate-400 dark:placeholder:text-electric/40 font-semibold',
        'focus:border-neo-accent dark:focus:border-electric focus:shadow-brutal-sm dark:focus:shadow-brutal-cyber-sm outline-none text-sm',
        icon ? 'pl-12' : 'pl-5',
        isPasswordType ? 'pr-12' : 'pr-5',
        disabled && 'opacity-50 cursor-not-allowed',
      ]" />

    <!-- Left Icon -->
    <div
      v-if="icon"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-electric/60 pointer-events-none">
      <component :is="icon" :size="20" />
    </div>

    <!-- Password Toggle -->
    <button
      v-if="isPasswordType"
      type="button"
      @click="togglePassword"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-electric/60 dark:hover:text-electric cursor-pointer transition-colors"
      :aria-label="showPassword ? 'Hide password' : 'Show password'">
      <Eye v-if="showPassword" :size="20" />
      <EyeOff v-else :size="20" />
    </button>
  </div>
</template>
