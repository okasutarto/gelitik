<script setup lang="ts">
import { ref } from "vue";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

const showToast = (message: string, type: ToastType = "info", duration = 3000) => {
  const id = nextId++;
  toasts.value.push({ id, message, type });

  setTimeout(() => {
    removeToast(id);
  }, duration);
};

const removeToast = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

// Helper methods for different toast types
const success = (message: string) => showToast(message, "success");
const error = (message: string) => showToast(message, "error");
const info = (message: string) => showToast(message, "info");
const warning = (message: string) => showToast(message, "warning");

// Expose methods for global use
defineExpose({ showToast, success, error, info, warning });
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="[
          'px-4 py-3 rounded-none shadow-neo-hard border-neo-3 flex items-center gap-3 min-w-[280px] max-w-md animate-slide-in',
          toast.type === 'success'
            ? 'bg-green-100 border-black text-green-800 dark:bg-green-900/50 dark:border-electric dark:text-green-200'
            : '',
          toast.type === 'error'
            ? 'bg-red-100 border-black text-red-800 dark:bg-red-900/50 dark:border-electric dark:text-red-200'
            : '',
          toast.type === 'warning'
            ? 'bg-yellow-100 border-black text-yellow-800 dark:bg-yellow-900/50 dark:border-electric dark:text-yellow-200'
            : '',
          toast.type === 'info'
            ? 'bg-blue-100 border-black text-blue-800 dark:bg-blue-900/50 dark:border-electric dark:text-blue-200'
            : '',
        ]"
      >
        <span class="text-xl">
          {{
            toast.type === "success"
              ? "✓"
              : toast.type === "error"
                ? "✕"
                : toast.type === "warning"
                  ? "⚠"
                  : "ℹ"
          }}
        </span>
        <span class="flex-1 font-medium">{{ toast.message }}</span>
        <button @click="removeToast(toast.id)" class="text-current opacity-60 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
