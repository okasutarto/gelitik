<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  BarChart3,
  Plus,
  CalendarDays,
  Settings,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  isFab?: boolean;
}

const navItems: NavItem[] = [
  { name: "Home", path: "/dashboard", icon: LayoutDashboard },
  { name: "Stats", path: "/analytics", icon: BarChart3 },
  { name: "Create", path: "/create", icon: Plus, isFab: true },
  { name: "Plan", path: "/schedule", icon: CalendarDays },
  { name: "Settings", path: "/settings", icon: Settings },
];

const isActive = (path: string) => {
  if (path === "/dashboard") {
    return route.path === "/dashboard" || route.path.startsWith("/dashboard/");
  }
  return route.path.startsWith(path);
};

const navigateTo = (path: string) => {
  router.push(path);
};
</script>

<template>
  <nav
    class="md:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-navy border-t-3 border-black dark:border-electric z-50 pb-safe">
    <div class="grid grid-cols-5 h-16">
      <template v-for="item in navItems" :key="item.path">
        <!-- FAB Button (Create) -->
        <button
          v-if="item.isFab"
          @click="navigateTo(item.path)"
          class="flex flex-col items-center justify-center -mt-8">
          <div
            class="size-16 bg-neo-accent dark:bg-hotpink border-3 border-black dark:border-electric flex items-center justify-center shadow-brutal-sm dark:shadow-brutal-cyber-sm active:shadow-brutal-active dark:active:shadow-brutal-cyber-active active:translate-y-0.5 transition-all">
            <component
              :is="item.icon"
              :size="32"
              class="text-black dark:text-offwhite"
              :stroke-width="2.5" />
          </div>
        </button>

        <!-- Regular Nav Item -->
        <button
          v-else
          @click="navigateTo(item.path)"
          :class="[
            'flex flex-col items-center justify-center gap-1 transition-all relative',
            isActive(item.path)
              ? 'text-black dark:text-electric font-bold'
              : 'text-black/60 dark:text-offwhite/60 hover:text-black dark:hover:text-electric font-medium',
          ]">
          <!-- Active state top border -->
          <div
            v-if="isActive(item.path)"
            class="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-neo-accent dark:bg-hotpink border-b-2 border-black dark:border-electric" />

          <component
            :is="item.icon"
            :size="24"
            :stroke-width="isActive(item.path) ? 2.5 : 2" />
          <span
            :class="[
              'text-[11px]',
              isActive(item.path) ? 'font-bold' : 'font-medium',
            ]">
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
