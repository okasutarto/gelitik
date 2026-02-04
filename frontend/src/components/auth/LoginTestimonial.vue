<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import AppLogo from '@/components/ui/AppLogo.vue'

interface Testimonial {
  quote: string
  authorName: string
  authorRole: string
  authorImage?: string
  rating: number
}

withDefaults(defineProps<{
  testimonial: Testimonial
}>(), {})
</script>

<template>
  <div
    class="hidden md:flex w-1/2 bg-gradient-to-br from-primary to-purple-600 
           relative flex-col justify-between p-12 text-white"
  >
    <!-- Decorative Pattern Overlay -->
    <div
      class="absolute inset-0 opacity-10"
      style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"
    />

    <!-- Logo (Light Version for Dark Background) -->
    <div class="relative z-10">
      <AppLogo variant="light" size="md" />
    </div>

    <!-- Testimonial -->
    <div class="relative z-10 max-w-lg mb-8">
      <!-- Star Rating -->
      <div class="flex gap-1 mb-4">
        <Star
          v-for="i in testimonial.rating"
          :key="i"
          :size="24"
          class="text-yellow-300 fill-yellow-300"
        />
      </div>

      <!-- Quote -->
      <blockquote class="text-3xl font-semibold leading-tight mb-6">
        "{{ testimonial.quote }}"
      </blockquote>

      <!-- Author -->
      <div class="flex items-center gap-4">
        <div
          v-if="testimonial.authorImage"
          class="w-12 h-12 rounded-full bg-cover bg-center ring-2 ring-white/30"
          :style="{ backgroundImage: `url('${testimonial.authorImage}')` }"
        />
        <div
          v-else
          class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ring-2 ring-white/30"
        >
          <span class="text-xl font-bold">
            {{ testimonial.authorName.charAt(0) }}
          </span>
        </div>
        <div>
          <p class="font-bold text-lg">{{ testimonial.authorName }}</p>
          <p class="text-white/70 text-sm">{{ testimonial.authorRole }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
