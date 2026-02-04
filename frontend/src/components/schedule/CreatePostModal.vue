<script setup lang="ts">
import { ref } from 'vue'
import { X, Calendar, Clock, Upload, Smile } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { useSchedule } from '@/composables/useSchedule'
import type { Platform } from '@/composables/usePlatform'

interface Props {
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', data: any): void
}>()

const { addPost } = useSchedule()

const title = ref('')
const selectedPlatform = ref<Platform>('instagram')
const date = ref(new Date().toISOString().split('T')[0])
const time = ref('12:00')
const content = ref('')

const platforms: { id: Platform; name: string }[] = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'linkedin', name: 'LinkedIn' }
]

const handleSubmit = () => {
  addPost({
    title: title.value,
    date: new Date(`${date.value}T${time.value}`),
    platform: selectedPlatform.value,
    type: 'image', // Default for now
    status: 'scheduled'
  })
  
  emit('submit', true)
  emit('close')
  
  // Reset form
  title.value = ''
  content.value = ''
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
      @click="$emit('close')"
    />

    <!-- Modal Content -->
    <div class="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden scale-100 opacity-100 transition-all">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white">Create New Post</h3>
        <button
          @click="$emit('close')"
          class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
        >
          <X :size="20" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Platform Selection -->
        <div class="flex gap-2">
          <button
            v-for="platform in platforms"
            :key="platform.id"
            @click="selectedPlatform = platform.id"
            :class="[
              'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all border',
              selectedPlatform === platform.id
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
            ]"
          >
            {{ platform.name }}
          </button>
        </div>

        <!-- Title -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
          <AppInput v-model="title" placeholder="Enter post title" />
        </div>

        <!-- Date & Time -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <div class="relative">
              <input
                v-model="date"
                type="date"
                class="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-700/50 
                       border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
              />
              <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Time</label>
            <div class="relative">
              <input
                v-model="time"
                type="time"
                class="w-full h-11 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-700/50 
                       border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white
                       focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm"
              />
              <Clock class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Caption</label>
          <div class="relative">
            <textarea
              v-model="content"
              rows="4"
              class="w-full p-3 rounded-xl bg-white dark:bg-slate-700/50 
                     border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-sm resize-none"
              placeholder="What's on your mind?"
            ></textarea>
            <button class="absolute right-3 bottom-3 text-slate-400 hover:text-primary-500 transition-colors">
              <Smile :size="20" />
            </button>
          </div>
        </div>

        <!-- Media Upload Placeholder -->
        <div class="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
          <div class="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
            <Upload :size="20" class="text-slate-500 dark:text-slate-400" />
          </div>
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Upload Media</p>
          <p class="text-xs text-slate-400 mt-1">Drag and drop or click to browse</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
        <AppButton variant="secondary" @click="$emit('close')">Cancel</AppButton>
        <AppButton @click="handleSubmit">Schedule Post</AppButton>
      </div>
    </div>
  </div>
</template>
