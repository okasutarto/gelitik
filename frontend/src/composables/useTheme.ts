import { ref, watch, onMounted, onScopeDispose } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('system')
const isDark = ref(false)
let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null
let listenerInitialized = false

const STORAGE_KEY = 'gelitik-theme'

/**
 * Initialize theme synchronously - call this BEFORE app mount to prevent FOUC
 * This is the key fix for the flash of unstyled content issue
 */
export function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
        theme.value = stored
    }

    // Apply theme immediately (synchronous)
    if (theme.value === 'system') {
        isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    } else {
        isDark.value = theme.value === 'dark'
    }

    // Update HTML class
    if (isDark.value) {
        document.documentElement.classList.add('dark')
    } else {
        document.documentElement.classList.add('light')
    }
}

/**
 * Composable for managing dark/light theme
 * Persists user preference to localStorage
 * Supports system preference detection
 */
export function useTheme() {
    const updateDarkMode = () => {
        if (theme.value === 'system') {
            isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
        } else {
            isDark.value = theme.value === 'dark'
        }

        // Update HTML class
        if (isDark.value) {
            document.documentElement.classList.add('dark')
            document.documentElement.classList.remove('light')
        } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.classList.add('light')
        }
    }

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
        localStorage.setItem(STORAGE_KEY, newTheme)
        updateDarkMode()
    }

    const toggleTheme = () => {
        const nextTheme = isDark.value ? 'light' : 'dark'
        setTheme(nextTheme)
    }

    // Set up system preference listener (only needed once, with cleanup)
    if (typeof window !== 'undefined' && !listenerInitialized) {
        mediaQueryListener = () => {
            if (theme.value === 'system') {
                updateDarkMode()
            }
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', mediaQueryListener)
        listenerInitialized = true
    }

    // Provide cleanup function for Vue's lifecycle
    const cleanup = () => {
        if (typeof window !== 'undefined' && mediaQueryListener) {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', mediaQueryListener)
            mediaQueryListener = null
            listenerInitialized = false
        }
    }

    return {
        theme,
        isDark,
        setTheme,
        toggleTheme,
        cleanup
    }
}
