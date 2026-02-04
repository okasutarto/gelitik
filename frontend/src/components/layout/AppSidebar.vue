<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Inbox,
  Settings,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Music2,
  Linkedin,
  Plus,
  Zap
} from 'lucide-vue-next'
import { useSidebar } from '@/composables/useSidebar'

const route = useRoute()
const router = useRouter()
const { isCollapsed, toggleSidebar, initSidebar } = useSidebar()

onMounted(() => {
  initSidebar()
})

interface NavItem {
  name: string
  path: string
  icon: typeof LayoutDashboard
  badge?: number
}

interface PlatformItem {
  name: string
  path: string
  icon: typeof Instagram
  color: string
  connected: boolean
}

const mainNavItems: NavItem[] = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', path: '/schedule', icon: CalendarDays },
  { name: 'Inbox', path: '/inbox', icon: Inbox, badge: 3 },
  { name: 'Audience', path: '/audience', icon: Users }
]

const platformItems: PlatformItem[] = [
  { name: 'Instagram', path: '/dashboard/instagram', icon: Instagram, color: 'pink', connected: true },
  { name: 'TikTok', path: '/dashboard/tiktok', icon: Music2, color: 'slate', connected: true },
  { name: 'LinkedIn', path: '/dashboard/linkedin', icon: Linkedin, color: 'blue', connected: false }
]

const bottomNavItems: NavItem[] = [
  { name: 'Settings', path: '/settings', icon: Settings }
]

const isActive = (path: string) => {
  if (path === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(path)
}

const getPlatformColorClass = (color: string, isActive: boolean) => {
  if (!isActive) return 'text-slate-400 hover:text-white hover:bg-white/5'
  
  const colors: Record<string, string> = {
    pink: 'bg-pink-600 text-white',
    slate: 'bg-slate-700 text-white',
    blue: 'bg-blue-600 text-white'
  }
  return colors[color] || 'bg-primary-600 text-white'
}

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside
    :class="[
      'hidden md:flex flex-col fixed h-full z-30 transition-all duration-300 shadow-xl',
      'bg-sidebar text-white',
      isCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Logo -->
    <div
      :class="[
        'h-16 flex items-center border-b border-white/10',
        isCollapsed ? 'justify-center' : 'justify-between px-6'
      ]"
    >
      <div class="flex items-center gap-3">
        <div
          class="size-9 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-400 
                 flex items-center justify-center shadow-lg shrink-0"
        >
          <Zap :size="20" class="text-white" />
        </div>
        <h1
          v-if="!isCollapsed"
          class="text-xl font-bold tracking-tight"
        >
          Gelitik
        </h1>
      </div>
      
      <!-- Collapse Toggle -->
      <button
        v-if="!isCollapsed"
        @click="toggleSidebar"
        class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        <ChevronLeft :size="18" />
      </button>
    </div>

    <!-- Main Navigation -->
    <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
      <!-- Main Nav Items -->
      <template v-for="item in mainNavItems" :key="item.path">
        <button
          @click="navigateTo(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative',
            isActive(item.path)
              ? 'bg-primary-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          ]"
        >
          <component :is="item.icon" :size="22" />
          <span v-if="!isCollapsed" class="font-medium">{{ item.name }}</span>
          
          <!-- Badge -->
          <span
            v-if="item.badge && !isCollapsed"
            class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
          >
            {{ item.badge }}
          </span>
          
          <!-- Tooltip for collapsed state -->
          <div
            v-if="isCollapsed"
            class="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded 
                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap"
          >
            {{ item.name }}
          </div>
        </button>
      </template>

      <!-- Platforms Section -->
      <div class="pt-6 pb-2">
        <p
          v-if="!isCollapsed"
          class="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
        >
          Platforms
        </p>
        <div v-else class="w-full h-px bg-white/10 my-2" />
      </div>

      <template v-for="platform in platformItems" :key="platform.path">
        <button
          @click="navigateTo(platform.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative',
            getPlatformColorClass(platform.color, isActive(platform.path))
          ]"
        >
          <component :is="platform.icon" :size="22" />
          <span v-if="!isCollapsed" class="font-medium">{{ platform.name }}</span>
          
          <!-- Connection status -->
          <span
            v-if="!isCollapsed && platform.connected"
            class="ml-auto size-2 rounded-full bg-green-400"
          />
          <span
            v-if="!isCollapsed && !platform.connected"
            class="ml-auto text-xs text-slate-500"
          >
            Connect
          </span>
          
          <!-- Tooltip -->
          <div
            v-if="isCollapsed"
            class="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded 
                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap"
          >
            {{ platform.name }}
          </div>
        </button>
      </template>

      <!-- Add Platform -->
      <button
        @click="navigateTo('/connections')"
        :class="[
          'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative',
          'text-slate-400 hover:text-white hover:bg-white/5 border border-dashed border-slate-600 hover:border-slate-500'
        ]"
      >
        <Plus :size="22" />
        <span v-if="!isCollapsed" class="font-medium">Add Platform</span>
        
        <div
          v-if="isCollapsed"
          class="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded 
                 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap"
        >
          Add Platform
        </div>
      </button>
    </nav>

    <!-- Bottom Section -->
    <div class="p-3 space-y-2 border-t border-white/10">
      <!-- Settings -->
      <template v-for="item in bottomNavItems" :key="item.path">
        <button
          @click="navigateTo(item.path)"
          :class="[
            'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative',
            isActive(item.path)
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          ]"
        >
          <component :is="item.icon" :size="22" />
          <span v-if="!isCollapsed" class="font-medium">{{ item.name }}</span>
          
          <div
            v-if="isCollapsed"
            class="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded 
                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap"
          >
            {{ item.name }}
          </div>
        </button>
      </template>

      <!-- User Profile -->
      <div
        :class="[
          'flex items-center gap-3 rounded-xl',
          isCollapsed ? 'flex-col justify-center p-2' : 'bg-white/5 p-3 border border-white/10'
        ]"
      >
        <div
          class="size-9 rounded-full bg-cover bg-center shrink-0 ring-2 ring-white/20"
          style="background-image: url('https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik')"
        />
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-bold text-white truncate">Gelitik Team</p>
          <p class="text-xs text-slate-400 truncate">admin@gelitik.com</p>
        </div>
      </div>
    </div>

    <!-- Expand button (only when collapsed) -->
    <button
      v-if="isCollapsed"
      @click="toggleSidebar"
      class="absolute -right-3 top-20 size-6 bg-primary-600 rounded-full 
             flex items-center justify-center shadow-lg hover:bg-primary-500 transition-colors"
    >
      <ChevronRight :size="14" />
    </button>
  </aside>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
