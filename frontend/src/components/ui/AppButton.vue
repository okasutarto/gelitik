<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

interface Props {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  loading: false,
  disabled: false,
  fullWidth: false,
  type: "button",
});

const baseClasses =
  "inline-flex items-center justify-center font-bold rounded-2xl cursor-pointer focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variantClasses = {
  primary:
    "bg-neo-accent text-black border-neo-3 border-black shadow-neo-hard hover:shadow-neo-hard-lg hover:-translate-y-1",
  secondary:
    "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-neo-3 border-black shadow-neo-hard hover:bg-slate-50 dark:hover:bg-slate-700",
  outline:
    "bg-white dark:bg-slate-800 border-neo-3 border-black text-slate-900 dark:text-slate-200 shadow-neo-hard hover:bg-neo-accent hover:-translate-y-1",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-neo-3 border-transparent",
};

const sizeClasses = {
  sm: "h-10 px-4 text-sm gap-2",
  md: "h-12 px-5 text-sm gap-3",
  lg: "h-14 px-6 text-base gap-3",
};

const buttonClasses = computed(() => [
  baseClasses,
  variantClasses[props.variant],
  sizeClasses[props.size],
  props.fullWidth && "w-full",
]);
</script>

<template>
  <button :type="type" :class="buttonClasses" :disabled="disabled || loading">
    <Loader2 v-if="loading" :size="16" class="animate-spin" />
    <slot />
  </button>
</template>
