<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "default" | "live" | "new" | "viral" | "trending" | "top-performer";
  text?: string;
  rotated?: boolean;
  pulse?: boolean;
  size?: "sm" | "md" | "lg";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
  text: "",
  rotated: false,
  pulse: false,
  size: "md",
});

const badgeClasses = computed(() => {
  const classes = ["brutal-badge", "inline-flex", "items-center", "gap-1", "font-black"];

  // Variant styling
  if (props.variant !== "default") {
    classes.push(props.variant);
  }

  // Rotation
  if (props.rotated) {
    classes.push("rotated");
  }

  // Pulse animation
  if (props.pulse) {
    classes.push("pulse");
  }

  // Size
  const sizeClasses = {
    sm: "text-[8px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-1",
    lg: "text-xs px-3 py-1.5",
  };
  classes.push(sizeClasses[props.size]);

  return classes.join(" ");
});

const defaultText = computed(() => {
  if (props.text) return props.text;

  const texts: Record<typeof props.variant, string> = {
    default: "BADGE",
    live: "LIVE",
    new: "NEW",
    viral: "VIRAL",
    trending: "TRENDING",
    "top-performer": "TOP PERFORMER",
  };
  return texts[props.variant];
});
</script>

<template>
  <span :class="badgeClasses">
    <slot>{{ defaultText }}</slot>
  </span>
</template>
