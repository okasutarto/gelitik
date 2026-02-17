<script setup lang="ts">
import { ref } from "vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import CalendarHeader from "@/components/schedule/CalendarHeader.vue";
import CalendarView from "@/components/schedule/CalendarView.vue";
import CreatePostModal from "@/components/schedule/CreatePostModal.vue";
import { useSchedule } from "@/composables/useSchedule";

const { selectedDate } = useSchedule();
const isCreateModalOpen = ref(false);

const handlePrevMonth = () => {
  const d = new Date(selectedDate.value);
  d.setMonth(d.getMonth() - 1);
  selectedDate.value = d;
};

const handleNextMonth = () => {
  const d = new Date(selectedDate.value);
  d.setMonth(d.getMonth() + 1);
  selectedDate.value = d;
};

const handleCreatePost = () => {
  isCreateModalOpen.value = true;
};
</script>

<template>
  <DashboardLayout>
    <div class="h-full flex flex-col">
      <!-- Page Header with Theme Toggle -->
      <PageHeader
        title="Content Planner"
        subtitle="Schedule and manage your posts across all platforms."
        :show-theme-toggle="true"
      />

      <!-- Calendar Controls -->
      <CalendarHeader
        :current-date="selectedDate"
        @prev-month="handlePrevMonth"
        @next-month="handleNextMonth"
        @create-post="handleCreatePost" />

      <!-- Calendar Grid -->
      <CalendarView />

      <!-- Create Post Modal -->
      <CreatePostModal
        :is-open="isCreateModalOpen"
        @close="isCreateModalOpen = false" />
    </div>
  </DashboardLayout>
</template>
