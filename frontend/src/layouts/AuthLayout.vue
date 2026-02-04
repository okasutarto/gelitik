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
    <slot name="left" />
    
    <!-- Right Side Slot (Form Content) -->
    <slot name="right" />
  </div>
</template>
