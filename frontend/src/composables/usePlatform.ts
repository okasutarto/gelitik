import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { platformConfigs, type Platform } from '@/types/platform'

export type { Platform } from '@/types/platform'
export { platformConfigs } from '@/types/platform'

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
