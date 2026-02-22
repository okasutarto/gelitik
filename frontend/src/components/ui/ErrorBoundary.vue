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
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4"
  >
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
      <div class="text-red-500 text-5xl mb-4">⚠️</div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <div
        v-if="error"
        class="text-sm text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-auto max-h-32"
      >
        {{ error.message }}
      </div>
      <button
        @click="resetError"
        class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
  <slot v-else />
</template>
