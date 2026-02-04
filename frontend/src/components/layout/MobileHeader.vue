<script setup lang="ts">
  import { Search, Bell, Zap } from 'lucide-vue-next'
  
  const userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik'
</script>

<template>
  <header
    class="md:hidden flex items-center justify-between px-4 py-3 
           bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 
           sticky top-0 z-40"
  >
    <div class="flex items-center gap-2">
      <div
        class="size-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 
               flex items-center justify-center shadow-sm"
      >
        <Zap :size="18" class="text-white" />
      </div>
      <span class="font-bold text-lg text-slate-900 dark:text-white">Gelitik</span>
    </div>
    
    <div class="flex items-center gap-3">
      <button class="text-slate-500 dark:text-slate-400 p-1">
        <Search :size="22" />
      </button>
      <button class="relative text-slate-500 dark:text-slate-400 p-1">
        <Bell :size="22" />
        <span
          class="absolute top-0 right-0 size-2 bg-red-500 rounded-full border border-white dark:border-slate-900"
        />
      </button>
      <div
        class="size-8 rounded-full bg-cover bg-center ring-1 ring-slate-200 dark:ring-slate-700"
        :style="{ backgroundImage: `url('${userAvatar}')` }"
      />
    </div>
  </header>
</template>
