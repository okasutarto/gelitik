import { ref, watch, onMounted } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('system')
const isDark = ref(false)

/**
 * Composable for managing dark/light theme
 * Persists user preference to localStorage
 * Supports system preference detection
 */
export function useTheme() {
    const STORAGE_KEY = 'gelitik-theme'

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

    const initTheme = () => {
        const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            theme.value = stored
        }
        updateDarkMode()

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (theme.value === 'system') {
                updateDarkMode()
            }
        })
    }

    onMounted(() => {
        initTheme()
    })

    return {
        theme,
        isDark,
        setTheme,
        toggleTheme
    }
}
