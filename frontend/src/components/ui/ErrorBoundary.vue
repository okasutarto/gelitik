<script setup lang="ts">
import { onErrorCaptured, ref } from "vue";

const error = ref<Error | null>(null);
const hasError = ref(false);

const resetError = () => {
  error.value = null;
  hasError.value = false;
};

onErrorCaptured((err) => {
  error.value = err;
  hasError.value = true;
  console.error("Global error captured:", err);
  return false; // Prevent error from propagating
});
</script>

<template>
  <div
    v-if="hasError"
    class="min-h-screen flex items-center justify-center bg-white dark:bg-navy p-4"
  >
    <div class="max-w-md w-full bg-white dark:bg-slate border-neo-3 border-black dark:border-electric shadow-neo-hard p-6 text-center">
      <div class="text-red-500 text-5xl mb-4">⚠️</div>
      <h1 class="text-2xl font-bold text-black dark:text-white mb-2">Something went wrong</h1>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <div
        v-if="error"
        class="text-sm text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-100 dark:bg-slate border-2 border-black dark:border-electric overflow-auto max-h-32"
      >
        {{ error.message }}
      </div>
      <button
        @click="resetError"
        class="px-6 py-3 bg-electric hover:bg-cyan-400 text-black dark:text-white font-bold border-neo-3 border-black dark:border-electric shadow-neo-hard transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
  <slot v-else />
</template>
