<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  Zap,
} from "lucide-vue-next";
import { useSidebar } from "@/composables/useSidebar";

const route = useRoute();
const router = useRouter();
const { isCollapsed, toggleSidebar, initSidebar } = useSidebar();

onMounted(() => {
  initSidebar();
});

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface PlatformItem {
  name: string;
  path: string;
  icon: typeof Instagram;
  color: string;
  connected: boolean;
}

const mainNavItems: NavItem[] = [
  { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { name: "Schedule", path: "/schedule", icon: CalendarDays },
  { name: "Inbox", path: "/inbox", icon: Inbox, badge: 3 },
  { name: "Audience", path: "/audience", icon: Users },
];

const platformItems: PlatformItem[] = [
  {
    name: "Instagram",
    path: "/dashboard/instagram",
    icon: Instagram,
    color: "pink",
    connected: true,
  },
  {
    name: "TikTok",
    path: "/dashboard/tiktok",
    icon: Music2,
    color: "slate",
    connected: true,
  },
];

const bottomNavItems: NavItem[] = [
  { name: "Settings", path: "/settings", icon: Settings },
];

const isActive = (path: string) => {
  if (path === "/dashboard") {
    return route.path === "/dashboard";
  }
  return route.path.startsWith(path);
};

const getPlatformColorClass = (color: string, isActive: boolean) => {
  if (isActive) {
    const activeColors: Record<string, string> = {
      pink: "bg-pink-600 text-white border-black shadow-neo-hard-sm",
      slate: "bg-slate-700 text-white border-black shadow-neo-hard-sm",
      blue: "bg-blue-600 text-white border-black shadow-neo-hard-sm",
    };
    return (
      activeColors[color] ||
      "bg-neo-accent text-black border-black shadow-neo-hard-sm"
    );
  }

  const colors: Record<string, string> = {
    pink: "text-pink-600 hover:text-black hover:border-neo-3 hover:border-black bg-white hover:shadow-neo-hard-sm transition-all hover:-translate-y-1 hover:-translate-x-0.5",
    slate:
      "text-slate-600 hover:text-black hover:border-neo-3 hover:border-black bg-white hover:shadow-neo-hard-sm transition-all hover:-translate-y-1 hover:-translate-x-0.5",
    blue: "text-blue-600 hover:text-black hover:border-neo-3 hover:border-black bg-white hover:shadow-neo-hard-sm transition-all hover:-translate-y-1 hover:-translate-x-0.5",
  };
  return (
    colors[color] ||
    "text-slate-600 hover:text-black hover:border-neo-3 hover:border-black bg-white hover:shadow-neo-hard-sm transition-all hover:-translate-y-1 hover:-translate-x-0.5"
  );
};

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <aside
    :class="[
      'hidden md:flex flex-col fixed h-full z-30 transition-all duration-300',
      'bg-white dark:bg-slate-900 text-black dark:text-white',
      'border-r-4 border-black',
      isCollapsed ? 'w-20' : 'w-64',
    ]">
    <!-- Logo -->
    <div
      :class="[
        'h-20 flex items-center border-b-4 border-black',
        isCollapsed ? 'justify-center' : 'justify-between px-6',
      ]">
      <div class="flex items-center gap-4">
        <div
          class="size-10 rounded-2xl bg-neo-accent border-neo-3 border-black flex items-center justify-center shadow-neo-hard shrink-0">
          <Zap :size="22" class="text-black" />
        </div>
        <h1 v-if="!isCollapsed" class="text-2xl font-black tracking-tight">
          Gelitik
        </h1>
      </div>

      <!-- Collapse Toggle -->
      <button
        v-if="!isCollapsed"
        @click="toggleSidebar"
        class="p-2 rounded-2xl border-neo-3 border-black hover:bg-neo-accent hover:-translate-y-1 transition-transform">
        <ChevronLeft :size="20" />
      </button>
    </div>

    <!-- Main Navigation -->
    <nav
      :class="[
        'flex-1 py-6 space-y-4 overflow-y-auto no-scrollbar',
        isCollapsed ? 'px-2' : 'px-4',
      ]">
      <!-- Main Nav Items -->
      <template v-for="item in mainNavItems" :key="item.path">
        <button
          @click="navigateTo(item.path)"
          :class="[
            'w-full flex items-center gap-4 py-3 rounded-2xl transition-all relative',
            isCollapsed ? 'justify-center px-0' : 'px-4',
            isActive(item.path)
              ? 'border-neo-3 border-black bg-neo-accent text-black shadow-neo-hard-sm'
              : 'bg-white hover:border-neo-3 hover:border-black hover:text-black hover:shadow-neo-hard-sm hover:-translate-y-1 hover:-translate-x-0.5 transition-all',
          ]">
          <component
            :is="item.icon"
            :size="24"
            class="shrink-0"
            :stroke-width="isActive(item.path) ? 2.5 : 2" />
          <span
            v-if="!isCollapsed"
            class="font-black uppercase text-sm hidden lg:block"
            >{{ item.name }}</span
          >

          <!-- Badge -->
          <span
            v-if="item.badge && !isCollapsed"
            class="ml-auto bg-black text-neo-accent text-xs font-black px-2.5 py-1 rounded-full border-2 border-black">
            {{ item.badge }}
          </span>

          <!-- Tooltip for collapsed state -->
          <div
            v-if="isCollapsed"
            class="absolute left-16 bg-black text-neo-accent text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-neo-accent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-neo-hard-sm">
            {{ item.name }}
          </div>
        </button>
      </template>

      <!-- Platforms Section -->
      <div class="pt-6">
        <p
          v-if="!isCollapsed"
          class="text-sm font-black text-neo-accent uppercase tracking-wider mb-3 px-4">
          Platforms
        </p>
      </div>

      <template v-for="platform in platformItems" :key="platform.path">
        <button
          @click="navigateTo(platform.path)"
          :class="[
            'w-full flex items-center gap-4 py-3 rounded-2xl transition-all relative',
            isCollapsed ? 'justify-center px-0' : 'px-4',
            getPlatformColorClass(platform.color, isActive(platform.path)) +
              (isActive(platform.path)
                ? ''
                : 'border-neo-3 border-black hover:shadow-neo-hard-sm hover:-translate-y-1 hover:-translate-x-0.5'),
          ]">
          <component :is="platform.icon" :size="22" class="shrink-0" />
          <span
            v-if="!isCollapsed"
            class="font-black uppercase text-sm hidden lg:block"
            >{{ platform.name }}</span
          >

          <!-- Connection status -->
          <div
            v-if="!isCollapsed && platform.connected"
            class="ml-auto size-2.5 rounded-full bg-black border-2 border-neo-accent" />
          <div
            v-if="!isCollapsed && !platform.connected"
            class="ml-auto text-xs font-bold">
            Connect
          </div>

          <!-- Tooltip -->
          <div
            v-if="isCollapsed"
            class="absolute left-16 bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-neo-hard-sm">
            {{ platform.name }}
          </div>
        </button>
      </template>

      <!-- Add Platform -->
      <button
        @click="navigateTo('/connections')"
        :class="[
          'w-full flex items-center gap-4 py-3 rounded-2xl border-neo-3 border-dashed border-black bg-white hover:border-black hover:text-black hover:shadow-neo-hard-sm hover:-translate-y-1 hover:-translate-x-0.5 transition-all relative',
          isCollapsed ? 'justify-center px-0' : 'px-4',
        ]">
        <Plus :size="24" class="shrink-0" />
        <span v-if="!isCollapsed" class="font-bold">Add Platform</span>

        <div
          v-if="isCollapsed"
          class="absolute left-16 bg-black text-neo-accent text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-neo-accent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-neo-hard-sm">
          Add Platform
        </div>
      </button>

      <!-- Settings -->
      <template
        v-for="item in bottomNavItems"
        :key="item.path"
        class="absolute bottom-0 left-0 w-full bg-indigo-600 p-4 text-white">
        <button
          @click="navigateTo(item.path)"
          :class="[
            'w-full flex items-center gap-4 py-3 rounded-2xl transition-all border-neo-3 border-black relative ',
            isCollapsed ? 'justify-center px-0' : 'px-4',
            isActive(item.path)
              ? 'bg-neo-accent text-black shadow-neo-hard-sm'
              : 'bg-white border-neo-3 border-black hover:text-black hover:border-neo-3 hover:border-black hover:shadow-neo-hard-sm hover:-translate-y-1 hover:-translate-x-0.5 transition-all',
          ]">
          <component :is="item.icon" :size="22" class="shrink-0" />
          <span v-if="!isCollapsed" class="font-bold">{{ item.name }}</span>

          <div
            v-if="isCollapsed"
            class="absolute left-16 bg-black text-neo-accent text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-neo-accent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-neo-hard-sm">
            {{ item.name }}
          </div>
        </button>
      </template>
    </nav>

    <!-- Bottom Section -->
    <div
      :class="[
        'p-4 space-y-4 border-t-4 border-black',
        isCollapsed ? 'px-2' : 'px-4',
      ]">
      <!-- User Profile -->
      <div
        :class="[
          'flex items-center gap-4 rounded-2xl',
          isCollapsed
            ? 'flex-col justify-center p-2'
            : 'bg-white dark:bg-slate-800 p-3 border-neo-3 border-black',
        ]">
        <div
          class="size-10 rounded-full bg-cover bg-center border-neo-3 border-black shrink-0 shadow-neo-hard-sm"
          style="
            background-image: url(&quot;https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik&quot;);
          " />
        <div v-if="!isCollapsed" class="flex-1 min-w-0">
          <p class="text-sm font-black dark:text-white font-bold truncate">
            Gelitik Team
          </p>
          <p
            class="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
            admin@gelitik.com
          </p>
        </div>
      </div>
    </div>

    <!-- Expand button (only when collapsed) -->
    <button
      v-if="isCollapsed"
      @click="toggleSidebar"
      class="absolute -right-4 top-20 size-7 bg-neo-accent rounded-2xl border-neo-3 border-black flex items-center justify-center shadow-neo-hard hover:-translate-y-1 transition-transform">
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
