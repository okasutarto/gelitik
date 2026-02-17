<script setup lang="ts">
import { computed } from "vue";
import PostItem from "./PostItem.vue";
import { useSchedule } from "@/composables/useSchedule";

const { selectedDate, currentMonthPosts } = useSchedule();

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Generate calendar grid days
const calendarDays = computed(() => {
  const year = selectedDate.value.getFullYear();
  const month = selectedDate.value.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)

  const days = [];

  // Previous month padding
  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month, 0 - (startDay - 1) + i);
    days.push({ date: d, isCurrentMonth: false });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true });
  }

  // Next month padding to fill 6 rows (42 days total)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ date: d, isCurrentMonth: false });
  }

  return days;
});

const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const getPostsForDay = (date: Date) => {
  return currentMonthPosts.value.filter(
    (post) => post.date.toDateString() === date.toDateString(),
  );
};

// Drag and drop handlers
const onDragOver = (e: DragEvent) => {
  e.preventDefault();
};

const onDrop = (e: DragEvent, date: Date) => {
  e.preventDefault();
  // In a real app, we'd transfer the post ID via dataTransfer
  // For strict types, we mock it here assuming the last dragged item is moved
  if (import.meta.env.DEV) {
    console.log("Dropped on", date);
  }
  // Logic to update post date would go here
};
</script>

<template>
  <div class="neo-card border-neo-3 border-black overflow-hidden">
    <!-- Weekday Headers -->
    <div
      class="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b-4 border-black">
      <div
        v-for="day in weekDays"
        :key="day"
        class="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {{ day }}
      </div>
    </div>

    <!-- Calendar Grid -->
    <div
      class="grid grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-700 gap-1">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="[
          'min-h-[120px] p-2 bg-white dark:bg-slate-800 transition-colors',
          !day.isCurrentMonth &&
            'bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600',
          isToday(day.date) &&
            'ring-1 ring-inset ring-primary-500 bg-primary-50/10',
        ]"
        @dragover="onDragOver"
        @drop="onDrop($event, day.date)">
        <!-- Date Number -->
        <div class="flex justify-between items-start mb-2">
          <span
            :class="[
              'text-sm font-medium size-7 flex items-center justify-center rounded-full',
              isToday(day.date)
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300',
            ]">
            {{ day.date.getDate() }}
          </span>

          <button
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary-600 transition-opacity"
            aria-label="Add post">
            <!-- Add icon placeholder -->
          </button>
        </div>

        <!-- Posts List -->
        <div class="space-y-1">
          <PostItem
            v-for="post in getPostsForDay(day.date)"
            :key="post.id"
            :post="post" />
        </div>
      </div>
    </div>
  </div>
</template>
