<script setup lang="ts">
import { computed } from "vue";
import { Loader2 } from "lucide-vue-next";

// AppButton - Neo-brutalist styled button component
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
  "inline-flex items-center justify-center font-bold cursor-pointer focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const variantClasses = {
  primary:
    "bg-neo-accent text-black border-neo-3 border-black shadow-neo-hard hover:shadow-neo-hard-lg hover:-translate-y-1 dark:bg-hotpink dark:border-electric dark:text-offwhite dark:shadow-brutal-cyber dark:hover:shadow-brutal-cyber-md",
  secondary:
    "bg-white dark:bg-navy text-slate-900 dark:text-offwhite border-neo-3 border-black dark:border-electric shadow-neo-hard dark:shadow-brutal-cyber hover:bg-slate-50 dark:hover:bg-purple/30",
  outline:
    "bg-white dark:bg-navy border-neo-3 border-black dark:border-electric text-slate-900 dark:text-electric shadow-neo-hard dark:shadow-brutal-cyber hover:bg-neo-accent dark:hover:bg-cyber dark:hover:text-black hover:-translate-y-1",
  ghost:
    "bg-transparent hover:bg-slate-100 dark:hover:bg-purple/20 text-slate-700 dark:text-electric border-neo-3 border-transparent hover:border-black dark:hover:border-electric",
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
