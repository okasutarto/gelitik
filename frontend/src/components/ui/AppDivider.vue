<script setup lang="ts">
interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: 'or'
})
</script>

<template>
  <div class="relative flex py-2 items-center">
    <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
    <span class="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-sm">
      {{ text }}
    </span>
    <div class="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
  </div>
</template>
