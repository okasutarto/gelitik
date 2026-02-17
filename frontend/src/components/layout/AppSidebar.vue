<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  BarChart3,
  CalendarDays,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Music2,
  Zap,
  Plus,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";
import { useSidebar } from "@/composables/useSidebar";

const route = useRoute();
const router = useRouter();
const { isCollapsed, toggleSidebar, initSidebar } = useSidebar();
const { isDark, toggleTheme } = useTheme();

const isPlatformsOpen = ref(true);
const isToolsOpen = ref(true);

const togglePlatforms = () => {
  if (!isCollapsed.value) {
    isPlatformsOpen.value = !isPlatformsOpen.value;
  }
};

const toggleTools = () => {
  if (!isCollapsed.value) {
    isToolsOpen.value = !isToolsOpen.value;
  }
};

onMounted(() => {
  initSidebar();
});

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface SubNavItem {
  name: string;
  path: string;
  icon: typeof Instagram;
  color: string;
  connected: boolean;
}

// Main dashboard item (top level)
const mainDashboardItem: NavItem = {
  name: "Dashboard",
  path: "/dashboard",
  icon: LayoutDashboard,
};

// Platform items (sub-nav under Platforms section)
const platformItems: SubNavItem[] = [
  {
    name: "Instagram",
    path: "/dashboard/instagram",
    icon: Instagram,
    color: "pink",
    connected: false, // Will be fetched from API
  },
  {
    name: "TikTok",
    path: "/dashboard/tiktok",
    icon: Music2,
    color: "slate",
    connected: true, // TikTok is connected
  },
];

// Tools section items
const toolsItems: NavItem[] = [
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Schedule", path: "/schedule", icon: CalendarDays },
  { name: "Audience", path: "/audience", icon: Users },
];

// Settings (bottom)
const settingsItem: NavItem = {
  name: "Settings",
  path: "/settings",
  icon: Settings,
};

const isActive = (path: string) => {
  if (path === "/dashboard") {
    return route.path === "/dashboard";
  }
  return route.path.startsWith(path);
};

const isPlatformActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + "/");
};

const navigateTo = (path: string) => {
  router.push(path);
};

const userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik";
</script>

<template>
  <aside
    :class="[
      'hidden md:flex flex-col fixed h-full z-30 transition-all duration-300',
      'bg-white dark:bg-navy text-black dark:text-offwhite',
      'border-r-4 border-black dark:border-electric',
      isCollapsed ? 'w-20' : 'w-64',
    ]">
    <!-- Logo -->
    <div
      :class="[
        'h-20 flex items-center border-b-4 border-black dark:border-electric',
        isCollapsed ? 'justify-center' : 'justify-between px-6',
      ]">
      <div class="flex items-center gap-4">
        <div
          :class="[
            'size-10 border-3 flex items-center justify-center shadow-brutal-sm shrink-0',
            'bg-neo-accent border-black',
            'dark:bg-hotpink dark:border-electric dark:shadow-brutal-cyber',
          ]">
          <Zap :size="22" class="text-black" />
        </div>
        <h1
          v-if="!isCollapsed"
          class="text-2xl font-black tracking-tight dark:text-electric">
          Gelitik
        </h1>
      </div>

      <!-- Collapse Toggle -->
      <button
        v-if="!isCollapsed"
        @click="toggleSidebar"
        class="p-2 border-3 border-black dark:border-electric hover:bg-neo-accent dark:hover:bg-hotpink hover:-translate-y-1 transition-transform shadow-brutal-sm dark:shadow-brutal-cyber">
        <ChevronLeft :size="20" class="dark:text-electric" />
      </button>
    </div>

    <!-- Main Navigation -->
    <nav
      :class="[
        'flex-1 py-6 overflow-y-auto no-scrollbar',
        isCollapsed ? 'px-2' : 'px-4',
      ]">
      <!-- Dashboard (Top Level) -->
      <button
        @click="navigateTo(mainDashboardItem.path)"
        :class="[
          'group nav-item w-full',
          isActive(mainDashboardItem.path) ? 'active' : '',
          isCollapsed ? 'justify-center px-0' : '',
        ]">
        <component
          :is="mainDashboardItem.icon"
          :size="24"
          class="shrink-0"
          :stroke-width="isActive(mainDashboardItem.path) ? 2.5 : 2" />
        <span
          v-if="!isCollapsed"
          :class="[
            'font-black uppercase text-sm',
            isActive(mainDashboardItem.path) ? 'text-black' : '',
          ]">
          {{ mainDashboardItem.name }}
        </span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-brutal-sm">
          {{ mainDashboardItem.name }}
        </div>
      </button>

      <!-- Platforms Section -->
      <div class="pt-2">
        <button
          v-if="!isCollapsed"
          @click="togglePlatforms"
          class="flex items-center justify-between w-full text-sm font-black text-black/40 dark:text-electric/60 uppercase tracking-widest mb-3 px-3 hover:text-black dark:hover:text-white transition-colors">
          <span>Platforms</span>
          <ChevronDown
            :size="16"
            class="transition-transform duration-200"
            :class="{ '-rotate-90': !isPlatformsOpen }" />
        </button>
        <p
          v-else
          class="text-center text-[10px] font-black text-black/40 dark:text-electric/60 uppercase mb-2">
          Apps
        </p>

        <div
          v-show="isPlatformsOpen || isCollapsed"
          class="transition-all duration-300 overflow-hidden"
          :class="{
            'opacity-100 max-h-[500px]': isPlatformsOpen || isCollapsed,
            'opacity-0 max-h-0': !isPlatformsOpen && !isCollapsed,
          }">
          <template v-for="platform in platformItems" :key="platform.path">
            <button
              @click="navigateTo(platform.path)"
              :class="[
                'group sub-nav-item w-full transition-all relative',
                isPlatformActive(platform.path) ? 'active' : '',
                isCollapsed ? 'justify-center px-0 ml-0' : '',
                isCollapsed && !isPlatformActive(platform.path)
                  ? 'hover:bg-black/5'
                  : '',
              ]">
              <!-- Connection status dot (positioned absolutely) -->
              <div
                v-if="platform.connected"
                :class="[
                  'absolute rounded-full bg-green-500 border border-green-600 shadow-sm',
                  isCollapsed
                    ? 'top-1 right-1 size-2'
                    : 'top-2 right-2 size-2.5',
                ]"
                :title="`${platform.name} is connected`" />

              <component
                :is="platform.icon"
                :size="22"
                class="shrink-0"
                :stroke-width="isPlatformActive(platform.path) ? 2.5 : 2" />
              <span
                v-if="!isCollapsed"
                :class="[
                  'font-black uppercase text-sm',
                  isPlatformActive(platform.path) ? 'text-black' : '',
                ]">
                {{ platform.name }}
              </span>

              <!-- Tooltip for collapsed state -->
              <div
                v-if="isCollapsed"
                class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-brutal-sm">
                {{ platform.name }}
              </div>
            </button>
          </template>

          <button
            @click="navigateTo('/connections')"
            :class="[
              'group sub-nav-item w-full transition-all relative border-dashed border-black/30',
              isActive('/connections') ? 'active' : '',
              isCollapsed ? 'justify-center px-0 ml-0' : '',
            ]">
            <Plus
              :size="22"
              class="shrink-0"
              :stroke-width="isActive('/connections') ? 2.5 : 2" />
            <span
              v-if="!isCollapsed"
              :class="[
                'font-black uppercase text-sm',
                isActive('/connections') ? 'text-black' : '',
              ]">
              Add Platform
            </span>

            <!-- Tooltip for collapsed state -->
            <div
              v-if="isCollapsed"
              class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-brutal-sm">
              Add Platform
            </div>
          </button>
        </div>
      </div>

      <!-- Tools Section -->
      <div class="pt-2">
        <button
          v-if="!isCollapsed"
          @click="toggleTools"
          class="flex items-center justify-between w-full text-sm font-black text-black/40 dark:text-electric/60 uppercase tracking-widest mb-3 px-3 hover:text-black dark:hover:text-white transition-colors">
          <span>Tools</span>
          <ChevronDown
            :size="16"
            class="transition-transform duration-200"
            :class="{ '-rotate-90': !isToolsOpen }" />
        </button>
        <p
          v-else
          class="text-center text-[10px] font-black text-black/40 dark:text-electric/60 uppercase mb-2">
          Tools
        </p>

        <div
          v-show="isToolsOpen || isCollapsed"
          class="transition-all duration-300 overflow-hidden"
          :class="{
            'opacity-100 max-h-[500px]': isToolsOpen || isCollapsed,
            'opacity-0 max-h-0': !isToolsOpen && !isCollapsed,
          }">
          <template v-for="item in toolsItems" :key="item.path">
            <button
              @click="navigateTo(item.path)"
              :class="[
                'group nav-item w-full',
                isActive(item.path) ? 'active' : '',
                isCollapsed ? 'justify-center px-0' : '',
              ]">
              <component
                :is="item.icon"
                :size="24"
                class="shrink-0"
                :stroke-width="isActive(item.path) ? 2.5 : 2" />
              <span
                v-if="!isCollapsed"
                :class="[
                  'font-black uppercase text-sm',
                  isActive(item.path) ? 'text-black' : '',
                ]">
                {{ item.name }}
              </span>

              <!-- Badge -->
              <span
                v-if="item.badge && !isCollapsed"
                class="ml-auto bg-black text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-black">
                {{ item.badge }}
              </span>

              <!-- Tooltip for collapsed state -->
              <div
                v-if="isCollapsed"
                class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-brutal-sm">
                {{ item.name }}
              </div>
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- Bottom Section -->
    <div
      :class="[
        'p-4 space-y-4 border-t-4 border-black dark:border-electric',
        isCollapsed ? 'px-2' : 'px-4',
      ]">
      <!-- Settings -->
      <button
        @click="navigateTo(settingsItem.path)"
        :class="[
          'group nav-item w-full',
          isActive(settingsItem.path) ? 'active' : '',
          isCollapsed ? 'justify-center px-0' : '',
        ]">
        <component
          :is="settingsItem.icon"
          :size="22"
          class="shrink-0"
          :stroke-width="isActive(settingsItem.path) ? 2.5 : 2" />
        <span
          v-if="!isCollapsed"
          :class="[
            'font-black uppercase text-sm',
            isActive(settingsItem.path) ? 'text-black' : '',
          ]">
          {{ settingsItem.name }}
        </span>

        <!-- Tooltip for collapsed state -->
        <div
          v-if="isCollapsed"
          class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-brutal-sm">
          {{ settingsItem.name }}
        </div>
      </button>

      <!-- User Profile -->
      <div
        :class="[
          'flex items-center gap-4 transition-all cursor-pointer group',
          isCollapsed
            ? 'flex-col justify-center p-2'
            : 'p-3 hover:border-3 hover:border-black dark:hover:border-electric',
        ]">
        <div
          :class="[
            'size-10 rounded-full bg-cover bg-center border-3 shrink-0 shadow-brutal-sm',
            'border-black',
            'dark:border-electric dark:shadow-brutal-cyber-sm',
          ]"
          :style="{ backgroundImage: `url('${userAvatar}')` }" />
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p
            class="text-sm font-black uppercase text-black dark:text-cyber truncate">
            Gelitik Team
          </p>
          <p
            class="text-xs font-mono text-black/60 dark:text-offwhite/60 truncate">
            ADMIN_01
          </p>
        </div>
      </div>
    </div>

    <!-- Expand button (only when collapsed) -->
    <button
      v-if="isCollapsed"
      @click="toggleSidebar"
      class="absolute -right-4 top-20 size-7 border-3 flex items-center justify-center shadow-brutal-sm hover:-translate-y-1 transition-transform bg-neo-accent border-black dark:bg-hotpink dark:border-electric dark:shadow-brutal-cyber">
      <ChevronRight :size="16" />
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
