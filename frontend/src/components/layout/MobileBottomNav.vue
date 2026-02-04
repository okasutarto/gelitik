<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, BarChart3, Plus, CalendarDays, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

interface NavItem {
  name: string
  path: string
  icon: typeof LayoutDashboard
  isFab?: boolean
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Stats', path: '/analytics', icon: BarChart3 },
  { name: 'Create', path: '/create', icon: Plus, isFab: true },
  { name: 'Plan', path: '/schedule', icon: CalendarDays },
  { name: 'Settings', path: '/settings', icon: Settings }
]

const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path.startsWith('/dashboard/')
  }
  return route.path.startsWith(path)
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 w-full 
           bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 
           z-50 pb-safe"
  >
    <div class="grid grid-cols-5 h-16">
      <template v-for="item in navItems" :key="item.path">
        <!-- FAB Button (Create) -->
        <button
          v-if="item.isFab"
          @click="navigateTo(item.path)"
          class="flex flex-col items-center justify-center text-primary-600 -mt-6"
        >
          <div
            class="size-12 bg-primary-600 rounded-full flex items-center justify-center 
                   shadow-lg shadow-primary-600/30 text-white active:scale-95 transition-transform"
          >
            <component :is="item.icon" :size="28" />
          </div>
        </button>
        
        <!-- Regular Nav Item -->
        <button
          v-else
          @click="navigateTo(item.path)"
          :class="[
            'flex flex-col items-center justify-center gap-1 transition-colors',
            isActive(item.path)
              ? 'text-primary-600'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          ]"
        >
          <component :is="item.icon" :size="22" :stroke-width="isActive(item.path) ? 2.5 : 2" />
          <span :class="['text-[10px]', isActive(item.path) ? 'font-bold' : 'font-medium']">
            {{ item.name }}
          </span>
        </button>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
