<script setup lang="ts">
/**
 * AuthLayout - Split-screen layout for authentication pages
 * Left: Testimonial/branding (hidden on mobile)
 * Right: Form content
 */
</script>

<template>
  <div class="flex min-h-screen w-full flex-row overflow-hidden">
    <!-- Left Side Slot (Testimonial/Branding) -->
    <div class="hidden md:flex flex-1 bg-neo-accent border-r-4 border-black shadow-neo-hard">
      <slot name="left" />
    </div>
    
    <!-- Right Side Slot (Form Content) -->
    <div class="flex-1 bg-white dark:bg-slate-900 relative">
      <slot name="right" />
    </div>
  </div>
</template>
