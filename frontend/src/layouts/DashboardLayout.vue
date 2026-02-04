<script setup lang="ts">
import { computed } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileHeader from '@/components/layout/MobileHeader.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import { useSidebar } from '@/composables/useSidebar'

const { isCollapsed } = useSidebar()

const mainContentClass = computed(() => [
  'flex-1 flex flex-col h-full relative transition-all duration-300',
  isCollapsed.value ? 'md:ml-20' : 'md:ml-64'
])
</script>

<template>
  <div class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-display antialiased h-screen flex overflow-hidden">
    <!-- Desktop Sidebar -->
    <AppSidebar />
    
    <!-- Main Content Area -->
    <main :class="mainContentClass">
      <!-- Mobile Header -->
      <MobileHeader />
      
      <!-- Page Content -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
        <slot />
      </div>
    </main>
    
    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />
  </div>
</template>
