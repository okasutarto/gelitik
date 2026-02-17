<script setup lang="ts">
interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: 'or'
})
</script>

<template>
  <div class="relative flex py-3 items-center">
    <div class="flex-grow border-t-4 border-black"></div>
    <span class="flex-shrink-0 mx-6 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
      {{ text }}
    </span>
    <div class="flex-grow border-t-4 border-black"></div>
  </div>
</template>
