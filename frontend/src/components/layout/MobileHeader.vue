<script setup lang="ts">
import { Search, Bell, Zap, Sun, Moon } from "lucide-vue-next";
import { useTheme } from "@/composables/useTheme";
import { useNotifications } from "@/composables/useNotifications";
import NotificationDropdown from "./NotificationDropdown.vue";

const { isDark, toggleTheme } = useTheme();
const { store: notificationsStore } = useNotifications();

const userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik";
</script>

<template>
  <header
    class="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-navy border-b-4 border-black dark:border-electric sticky top-0 z-40">
    <div class="flex items-center gap-3">
      <div
        class="size-9 bg-neo-accent dark:bg-hotpink border-3 border-black dark:border-electric flex items-center justify-center shadow-brutal-sm dark:shadow-brutal-cyber-sm">
        <Zap :size="20" class="text-black" :stroke-width="2.5" />
      </div>
      <span
        class="font-black text-lg text-slate-900 dark:text-cyber tracking-tight">
        Gelitik
      </span>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search Bar -->
      <div class="relative group">
        <input
          type="text"
          placeholder="Search..."
          class="w-32 md:w-48 h-10 pl-4 pr-10 font-mono text-sm border-3 border-black dark:border-electric/50 shadow-brutal-sm dark:shadow-brutal-cyber-sm focus:outline-none focus:w-40 md:focus:w-56 focus:shadow-brutal dark:focus:shadow-brutal-cyber transition-all bg-white dark:bg-navy/50 dark:text-offwhite placeholder:text-black/40 dark:placeholder:text-electric/40" />
        <Search
          :size="16"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-electric/60" />
      </div>

      <!-- Notification Button -->
      <button
        @click="notificationsStore.toggleDropdown"
        class="relative size-10 bg-neo-accent dark:bg-hotpink border-3 border-black dark:border-electric rounded-xl shadow-brutal-sm dark:shadow-brutal-cyber-sm flex items-center justify-center hover:-translate-y-0.5 hover:shadow-brutal dark:hover:shadow-brutal-cyber hover:bg-cyber dark:hover:bg-cyber dark:hover:text-black transition-all active:shadow-brutal-active dark:active:shadow-brutal-cyber-active active:translate-y-0">
        <Bell
          :size="20"
          class="text-black dark:text-offwhite"
          :stroke-width="2" />
        <span
          v-if="notificationsStore.unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-navy">
          {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
        </span>
      </button>

      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="size-10 bg-white dark:bg-navy border-3 border-black dark:border-electric rounded-xl shadow-brutal-sm dark:shadow-brutal-cyber-sm flex items-center justify-center hover:-translate-y-0.5 hover:shadow-brutal dark:hover:shadow-brutal-cyber transition-all active:shadow-brutal-active dark:active:shadow-brutal-cyber-active active:translate-y-0">
        <component
          :is="isDark ? Moon : Sun"
          :size="20"
          class="text-black dark:text-offwhite"
          :stroke-width="2" />
      </button>

      <!-- Avatar -->
      <div
        class="size-10 rounded-full bg-cover bg-center border-3 border-black dark:border-electric shadow-brutal-sm dark:shadow-brutal-cyber-sm"
        :style="{ backgroundImage: `url('${userAvatar}')` }" />
    </div>

    <!-- Notification Dropdown -->
    <NotificationDropdown
      :is-open="notificationsStore.isDropdownOpen"
      @close="notificationsStore.closeDropdown" />
  </header>
</template>
