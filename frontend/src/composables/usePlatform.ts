import { computed } from 'vue'
import { useRoute } from 'vue-router'

export type Platform = 'all' | 'instagram' | 'tiktok' | 'linkedin'

export interface PlatformConfig {
    id: Platform
    name: string
    color: string
    bgColor: string
    textColor: string
    borderColor: string
    icon: string
}

const platformConfigs: Record<Platform, PlatformConfig> = {
    all: {
        id: 'all',
        name: 'Overview',
        color: 'indigo',
        bgColor: 'bg-primary-600',
        textColor: 'text-primary-600',
        borderColor: 'border-primary-600',
        icon: 'LayoutDashboard'
    },
    instagram: {
        id: 'instagram',
        name: 'Instagram',
        color: 'pink',
        bgColor: 'bg-pink-600',
        textColor: 'text-pink-600',
        borderColor: 'border-pink-600',
        icon: 'Instagram'
    },
    tiktok: {
        id: 'tiktok',
        name: 'TikTok',
        color: 'slate',
        bgColor: 'bg-slate-900',
        textColor: 'text-slate-900',
        borderColor: 'border-slate-900',
        icon: 'Music2'
    },
    linkedin: {
        id: 'linkedin',
        name: 'LinkedIn',
        color: 'blue',
        bgColor: 'bg-blue-600',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-600',
        icon: 'Linkedin'
    }
}

/**
 * Composable for managing platform-aware styling (Chameleon UI)
 */
export function usePlatform() {
    const route = useRoute()

    const currentPlatform = computed<Platform>(() => {
        const path = route.path
        if (path.includes('/instagram')) return 'instagram'
        if (path.includes('/tiktok')) return 'tiktok'
        if (path.includes('/linkedin')) return 'linkedin'
        return 'all'
    })

    const currentConfig = computed(() => platformConfigs[currentPlatform.value])

    const getPlatformConfig = (platform: Platform) => platformConfigs[platform]

    const allPlatforms = Object.values(platformConfigs).filter(p => p.id !== 'all')

    return {
        currentPlatform,
        currentConfig,
        getPlatformConfig,
        allPlatforms,
        platformConfigs
    }
}
