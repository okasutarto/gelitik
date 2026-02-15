<script setup lang="ts">
import { Search, Bell, Zap } from "lucide-vue-next";

const userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik";
</script>

<template>
  <header
    class="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b-4 border-black sticky top-0 z-40">
    <div class="flex items-center gap-3">
      <div
        class="size-9 rounded-2xl bg-neo-accent border-3 border-black flex items-center justify-center shadow-brutal-sm">
        <Zap :size="20" class="text-black" :stroke-width="2.5" />
      </div>
      <span
        class="font-black text-lg text-slate-900 dark:text-white tracking-tight">
        Gelitik
      </span>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search Bar -->
      <div class="relative group">
        <input
          type="text"
          placeholder="Search..."
          class="w-32 md:w-48 h-10 pl-4 pr-10 font-mono text-sm border-3 border-black rounded-2xl shadow-brutal-sm focus:outline-none focus:w-40 md:focus:w-56 transition-all bg-white dark:bg-slate-800 dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40" />
        <Search :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-black/40" />
      </div>

      <!-- Notification Button -->
      <button
        class="relative size-10 bg-neo-accent border-3 border-black rounded-xl shadow-brutal-sm flex items-center justify-center hover:-translate-y-0.5 hover:shadow-brutal transition-all active:shadow-brutal-active active:translate-y-0">
        <Bell :size="20" class="text-black" :stroke-width="2" />
        <span
          class="absolute top-0 right-0 size-3 bg-black rounded-full border-2 border-white" />
      </button>

      <!-- Avatar -->
      <div
        class="size-10 rounded-full bg-cover bg-center border-3 border-black shadow-brutal-sm"
        :style="{ backgroundImage: `url('${userAvatar}')` }" />
    </div>
  </header>
</template>
