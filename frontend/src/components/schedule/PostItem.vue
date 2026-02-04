<script setup lang="ts">
import { computed } from 'vue'
import { Image, Video, FileText, Layers } from 'lucide-vue-next'
import type { Post } from '@/composables/useSchedule'

interface Props {
  post: Post
}

const props = defineProps<Props>()

const platformColors = computed(() => {
  const colors: Record<string, string> = {
    instagram: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
    tiktok: 'bg-black dark:bg-slate-700',
    linkedin: 'bg-blue-600'
  }
  return colors[props.post.platform] || 'bg-slate-500'
})

const statusColor = computed(() => {
  const colors = {
    draft: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    scheduled: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    published: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  }
  return colors[props.post.status]
})

const typeIcon = computed(() => {
  const icons = {
    image: Image,
    video: Video,
    reel: Video,
    carousel: Layers,
    text: FileText
  }
  return icons[props.post.type]
})

const timeFormatted = computed(() => {
  return props.post.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div
    class="relative group bg-white dark:bg-slate-800 p-2 rounded-lg
           shadow-sm hover:shadow-md transition-all cursor-move mb-1.5"
    draggable="true"
  >
    <!-- Platform Indicator Strip -->
    <div
      :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-lg', platformColors]"
    />

    <div class="pl-2 flex gap-2">
      <!-- Thumbnail (if exists) -->
      <div
        v-if="post.thumbnail"
        class="size-10 rounded-md bg-cover bg-center shrink-0"
        :style="{ backgroundImage: `url('${post.thumbnail}')` }"
      />
      <!-- Placeholder Icon (if no thumbnail) -->
      <div
        v-else
        class="size-10 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0"
      >
        <component :is="typeIcon" :size="16" class="text-slate-400" />
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-semibold text-slate-900 dark:text-white truncate">
          {{ post.title }}
        </h4>
        <div class="flex items-center gap-2 mt-1">
          <span :class="['text-[10px] px-1.5 py-0.5 rounded font-medium', statusColor]">
            {{ timeFormatted }}
          </span>
          <span class="text-[10px] text-slate-400 capitalize">{{ post.platform }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
