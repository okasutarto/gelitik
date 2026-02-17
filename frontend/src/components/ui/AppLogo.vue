<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next'

interface Props {
  variant?: 'light' | 'dark' | 'auto'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'auto',
  size: 'md'
})

const sizeClasses = {
  sm: 'w-8 h-8 text-base',
  md: 'w-10 h-10 text-lg',
  lg: 'w-12 h-12 text-xl'
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24
}

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl'
}
</script>

<template>
  <div class="flex items-center gap-2">
    <div
      :class="[
        'flex items-center justify-center rounded-lg',
        sizeClasses[props.size],
        props.variant === 'light'
          ? 'bg-white/20 backdrop-blur-sm'
          : props.variant === 'dark'
          ? 'bg-primary text-white'
          : 'bg-primary text-white dark:bg-white/20 dark:backdrop-blur-sm'
      ]"
    >
      <Sparkles
        :size="iconSizes[props.size]"
        class="text-white"
      />
    </div>
    <span
      :class="[
        'font-bold tracking-tight',
        textSizes[props.size],
        props.variant === 'light'
          ? 'text-white'
          : props.variant === 'dark'
          ? 'text-slate-900 dark:text-white'
          : 'text-slate-900 dark:text-white'
      ]"
    >
      Gelitik
    </span>
  </div>
</template>
