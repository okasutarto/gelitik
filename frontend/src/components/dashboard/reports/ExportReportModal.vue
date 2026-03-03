<script setup lang="ts">
import { ref } from 'vue'
import { X, FileText, Download, CheckCircle2 } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'

interface Props {
    isOpen: boolean
    defaultPlatform?: 'instagram' | 'tiktok' | 'all'
    defaultRange?: string
}

const props = withDefaults(defineProps<Props>(), {
    defaultPlatform: 'all',
    defaultRange: '30'
})

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'export', config: { format: string; platform: string; range: string }): void
}>()

const format = ref<'pdf' | 'csv'>('pdf')
const platform = ref(props.defaultPlatform)
const dateRange = ref(props.defaultRange)
const isGenerating = ref(false)

const handleExport = () => {
    isGenerating.value = true
    // Simulate generation visually
    setTimeout(() => {
        isGenerating.value = false
        emit('export', {
            format: format.value,
            platform: platform.value,
            range: dateRange.value
        })
        emit('close')
    }, 1500)
}

const periods = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 14 Days', value: '14' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' }
]
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
            class="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
            @click="$emit('close')"
        ></div>

        <!-- Modal Content -->
        <div
            class="relative w-full max-w-lg bg-white dark:bg-slate-900 border-neo-4 border-black dark:border-electric shadow-neo-hard-xl scale-100 opacity-100 transition-all flex flex-col"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between p-5 border-b-4 border-black dark:border-electric bg-neo-accent dark:bg-hotpink"
            >
                <h3 class="text-2xl font-black text-black uppercase tracking-tight">
                    Export Report
                </h3>
                <button
                    @click="$emit('close')"
                    class="p-2 border-neo-3 border-black text-black bg-white hover:bg-slate-100 hover:-translate-y-1 transition-transform"
                >
                    <X :size="24" class="stroke-[3]" />
                </button>
            </div>

            <!-- Body -->
            <div class="p-6 md:p-8 space-y-6 flex-1">
                <!-- Format Selection -->
                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-4">
                        <button
                            @click="format = 'pdf'"
                            :class="[
                                'p-4 border-neo-3 transition-all flex flex-col items-center gap-2 group',
                                format === 'pdf'
                                    ? 'bg-electric text-black border-black shadow-neo-hard-sm -translate-y-1'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-black dark:hover:border-electric'
                            ]"
                        >
                            <FileText
                                :size="32"
                                :class="
                                    format === 'pdf'
                                        ? 'text-black'
                                        : 'text-slate-400 group-hover:text-black dark:group-hover:text-white'
                                "
                            />
                            <span class="font-black">PDF Document</span>
                        </button>
                        <button
                            @click="format = 'csv'"
                            :class="[
                                'p-4 border-neo-3 transition-all flex flex-col items-center gap-2 group',
                                format === 'csv'
                                    ? 'bg-electric dark:bg-hotpink text-black border-black shadow-neo-hard-sm -translate-y-1'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-black dark:hover:border-electric'
                            ]"
                        >
                            <FileText
                                :size="32"
                                :class="
                                    format === 'csv'
                                        ? 'text-black'
                                        : 'text-slate-400 group-hover:text-black dark:group-hover:text-white'
                                "
                            />
                            <span class="font-black">CSV Data Spread</span>
                        </button>
                    </div>
                </div>

                <!-- Filters Grid -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800 p-5 border-2 border-dashed border-slate-300 dark:border-slate-600"
                >
                    <!-- Platform -->
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider"
                        >
                            Platform
                        </label>
                        <select
                            v-model="platform"
                            :disabled="props.defaultPlatform !== 'all'"
                            class="w-full h-12 px-4 bg-white dark:bg-slate-900 border-neo-3 border-black dark:border-slate-500 text-slate-900 dark:text-white font-bold focus:border-neo-accent dark:focus:border-electric outline-none appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option v-if="props.defaultPlatform === 'all'" value="all">
                                All Platforms
                            </option>
                            <option
                                v-if="['all', 'instagram'].includes(props.defaultPlatform)"
                                value="instagram"
                            >
                                Instagram Only
                            </option>
                            <option
                                v-if="['all', 'tiktok'].includes(props.defaultPlatform)"
                                value="tiktok"
                            >
                                TikTok Only
                            </option>
                        </select>
                    </div>

                    <!-- Timeframe -->
                    <div class="space-y-2">
                        <label
                            class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider"
                        >
                            Date Range
                        </label>
                        <select
                            v-model="dateRange"
                            class="w-full h-12 px-4 bg-white dark:bg-slate-900 border-neo-3 border-black dark:border-slate-500 text-slate-900 dark:text-white font-bold focus:border-neo-accent dark:focus:border-electric outline-none appearance-none cursor-pointer"
                        >
                            <option v-for="p in periods" :key="p.value" :value="p.value">
                                {{ p.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Preview Checklist -->
                <div class="space-y-3">
                    <label
                        class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block tracking-wider"
                    >
                        Included in Report
                    </label>
                    <ul
                        class="text-sm font-bold text-slate-700 dark:text-slate-300 grid grid-cols-2 gap-2"
                    >
                        <li class="flex items-center gap-2">
                            <CheckCircle2 :size="16" class="text-green-500" /> KPI Summary
                        </li>
                        <li class="flex items-center gap-2">
                            <CheckCircle2 :size="16" class="text-green-500" /> Demographic Data
                        </li>
                        <li class="flex items-center gap-2">
                            <CheckCircle2 :size="16" class="text-green-500" /> Content Table
                        </li>
                        <li
                            class="flex items-center gap-2"
                            :class="{ 'opacity-50 text-slate-400 line-through': format === 'csv' }"
                        >
                            <CheckCircle2
                                :size="16"
                                :class="format === 'csv' ? 'text-slate-400' : 'text-green-500'"
                            />
                            Engagement Charts
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Footer CTA -->
            <div class="p-6 border-t-4 border-black dark:border-electric flex justify-end">
                <button
                    @click="handleExport"
                    :disabled="isGenerating"
                    class="w-full relative flex items-center justify-center gap-3 bg-hotpink text-black font-black uppercase tracking-widest py-4 px-6 border-neo-3 border-black shadow-neo-hard-md hover:-translate-y-1 hover:shadow-neo-hard-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-neo-hard-md"
                >
                    <template v-if="!isGenerating">
                        <Download :size="24" class="stroke-[3]" />
                        <span>Generate &amp; Download</span>
                    </template>
                    <template v-else>
                        <svg
                            class="animate-spin -ml-1 mr-3 h-6 w-6 text-black"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        <span>Processing...</span>
                    </template>
                </button>
            </div>
        </div>
    </div>
</template>
