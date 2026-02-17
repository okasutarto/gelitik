<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus, Filter } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";

interface Props {
  currentDate: Date;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "prev-month"): void;
  (e: "next-month"): void;
  (e: "create-post"): void;
}>();

const monthYear = computed(() => {
  return props.currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
});
</script>

<template>
  <div
    class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
    <!-- Month Navigation -->
    <div
      class="flex items-center gap-4 neo-card border-neo-3 border-black shadow-neo-hard">
      <button
        @click="$emit('prev-month')"
        class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
        <ChevronLeft :size="20" />
      </button>

      <span
        class="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center select-none">
        {{ monthYear }}
      </span>

      <button
        @click="$emit('next-month')"
        class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
        <ChevronRight :size="20" />
      </button>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 w-full sm:w-auto">
      <button
        class="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy border-neo-3 border-black dark:border-electric text-slate-600 dark:text-slate-300 text-sm font-bold brutal-hover-lift">
        <Filter :size="16" />
        Filter
      </button>

      <AppButton @click="$emit('create-post')" class="w-full sm:w-auto">
        <Plus :size="18" />
        Create Post
      </AppButton>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from "vue";
</script>
