<script setup lang="ts">
import { ref } from "vue";
import { X, Calendar, Clock, Upload, Smile } from "lucide-vue-next";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import { useSchedule } from "@/composables/useSchedule";
import type { Platform } from "@/composables/usePlatform";

interface Props {
  isOpen: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", data: any): void;
}>();

const { addPost } = useSchedule();

const title = ref("");
const selectedPlatform = ref<Platform>("instagram");
const date = ref(new Date().toISOString().split("T")[0]);
const time = ref("12:00");
const content = ref("");

const platforms: { id: Platform; name: string }[] = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "linkedin", name: "LinkedIn" },
];

const handleSubmit = () => {
  addPost({
    title: title.value,
    date: new Date(`${date.value}T${time.value}`),
    platform: selectedPlatform.value,
    type: "image", // Default for now
    status: "scheduled",
  });

  emit("submit", true);
  emit("close");

  // Reset form
  title.value = "";
  content.value = "";
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      @click="$emit('close')" />

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border-neo-3 border-black shadow-neo-hard-lg scale-100 opacity-100 transition-all">
      <!-- Header -->
      <div
        class="flex items-center justify-between p-5 border-b-4 border-black">
        <h3 class="text-xl font-black text-slate-900 dark:text-white">
          Create New Post
        </h3>
        <button
          @click="$emit('close')"
          class="p-2 rounded-2xl border-neo-3 border-black hover:bg-neo-accent hover:-translate-y-1 transition-transform">
          <X :size="22" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5">
        <!-- Platform Selection -->
        <div class="flex gap-3">
          <button
            v-for="platform in platforms"
            :key="platform.id"
            @click="selectedPlatform = platform.id"
            :class="[
              'flex-1 py-2.5 px-4 rounded-2xl text-sm font-bold transition-transform border-neo-3',
              selectedPlatform === platform.id
                ? 'bg-neo-accent border-black text-black shadow-neo-hard-sm'
                : 'bg-white dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-600 dark:text-slate-300 hover:border-black',
            ]">
            {{ platform.name }}
          </button>
        </div>

        <!-- Title -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300"
            >Title</label
          >
          <AppInput v-model="title" placeholder="Enter post title" />
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white"
              >Date</label
            >
            <div class="relative">
              <input
                v-model="date"
                type="date"
                class="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-700 border-neo-3 border-black text-slate-900 dark:text-white font-semibold focus:border-neo-accent outline-none text-sm" />
              <Calendar
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                :size="20" />
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-bold text-slate-900 dark:text-white"
              >Time</label
            >
            <div class="relative">
              <input
                v-model="time"
                type="time"
                class="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-700 border-neo-3 border-black text-slate-900 dark:text-white font-semibold focus:border-neo-accent outline-none text-sm" />
              <Clock
                class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                :size="20" />
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="space-y-2">
          <label class="text-sm font-bold text-slate-900 dark:text-white"
            >Caption</label
          >
          <div class="relative">
            <textarea
              v-model="content"
              rows="4"
              class="w-full p-4 rounded-2xl bg-white dark:bg-slate-700 border-neo-3 border-black text-slate-900 dark:text-white font-semibold focus:border-neo-accent outline-none text-sm resize-none"
              placeholder="What's on your mind?"></textarea>
            <button
              class="absolute right-4 bottom-4 text-slate-400 hover:text-neo-accent transition-colors p-2 rounded-xl">
              <Smile :size="20" />
            </button>
          </div>
        </div>

        <!-- Media Upload Placeholder -->
        <div
          class="border-neo-3 border-dashed border-slate-300 dark:border-slate-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <div
            class="size-12 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center mb-3">
            <Upload :size="24" class="text-slate-500 dark:text-slate-400" />
          </div>
          <p class="text-sm font-bold text-slate-900 dark:text-white">
            Upload Media
          </p>
          <p class="text-xs font-medium text-slate-500 mt-2">
            Drag and drop or click to browse
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="p-5 border-t-4 border-black flex justify-end gap-4 bg-slate-50 dark:bg-slate-700">
        <AppButton variant="secondary" @click="$emit('close')"
          >Cancel</AppButton
        >
        <AppButton @click="handleSubmit">Schedule Post</AppButton>
      </div>
    </div>
  </div>
</template>
