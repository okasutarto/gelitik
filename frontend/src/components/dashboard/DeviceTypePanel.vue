<script setup lang="ts">
import { Smartphone } from 'lucide-vue-next'

interface DeviceData {
  name: string
  percentage: number
  color: string
}

interface Props {
  devices?: DeviceData[]
}

const props = withDefaults(defineProps<Props>(), {
  devices: () => [
    { name: 'Android', percentage: 70, color: '#0f172a' },
    { name: 'iOS', percentage: 30, color: '#14b8a6' }
  ]
})

// Generate conic gradient from device data
const conicGradient = (() => {
  let gradient = 'conic-gradient('
  let currentDeg = 0
  
  props.devices.forEach((device, index) => {
    const endDeg = currentDeg + (device.percentage / 100) * 360
    gradient += `${device.color} ${currentDeg}deg ${endDeg}deg`
    if (index < props.devices.length - 1) gradient += ', '
    currentDeg = endDeg
  })
  
  return gradient + ')'
})()

const primaryDevice = props.devices[0]
</script>

<template>
  <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
    <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
      <Smartphone :size="18" class="text-slate-800 dark:text-white" />
      Device Type
    </h4>
    <div class="flex items-center justify-center h-full pb-4 gap-8">
      <!-- Donut Chart -->
      <div class="relative size-32">
        <div
          class="size-full rounded-full"
          :style="{ background: conicGradient }"
        />
        <div
          class="absolute inset-4 bg-white dark:bg-slate-800 rounded-full 
                 flex flex-col items-center justify-center"
        >
          <span class="text-2xl font-bold text-slate-900 dark:text-white">
            {{ primaryDevice.percentage }}%
          </span>
          <span class="text-[10px] text-slate-400 uppercase tracking-wider">
            {{ primaryDevice.name }}
          </span>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="space-y-2">
        <div
          v-for="device in devices"
          :key="device.name"
          class="flex items-center gap-2"
        >
          <span
            class="size-3 rounded-full"
            :style="{ backgroundColor: device.color }"
          />
          <span class="text-sm text-slate-600 dark:text-slate-300">
            {{ device.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
