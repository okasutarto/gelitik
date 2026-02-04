<script setup lang="ts">
import { Search, Bell, Zap } from "lucide-vue-next";

const userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik";
</script>

<template>
  <header
    class="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b-4 border-black sticky top-0 z-40">
    <div class="flex items-center gap-2">
      <div
        class="size-9 rounded-2xl bg-neo-accent border-neo-3 border-black flex items-center justify-center shadow-neo-hard">
        <Zap :size="20" class="text-black" />
      </div>
      <span
        class="font-black text-lg text-slate-900 dark:text-white tracking-tight"
        >Gelitik</span
      >
    </div>

    <div class="flex items-center gap-4">
      <button
        class="text-slate-600 dark:text-slate-400 p-2 rounded-xl border-neo-3 border-transparent hover:border-black">
        <Search :size="24" :stroke-width="2" />
      </button>
      <button
        class="relative text-slate-600 dark:text-slate-400 p-2 rounded-xl border-neo-3 border-transparent hover:border-black">
        <Bell :size="24" :stroke-width="2" />
        <span
          class="absolute top-1 right-1 size-2.5 bg-neo-accent rounded-full border-neo-3 border-black" />
      </button>
      <div
        class="size-10 rounded-full bg-cover bg-center border-neo-3 border-black shadow-neo-hard-sm"
        :style="{ backgroundImage: `url('${userAvatar}')` }" />
    </div>
  </header>
</template>
