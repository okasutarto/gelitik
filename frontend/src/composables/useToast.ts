import { ref, type ComponentPublicInstance } from 'vue'

// Global toast state
const toastContainerRef = ref<ComponentPublicInstance | null>(null)

export function useToast() {
  const setToastContainer = (ref: ComponentPublicInstance) => {
    toastContainerRef.value = ref
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    if (toastContainerRef.value) {
      toastContainerRef.value.showToast(message, type)
    } else {
      console.warn('Toast container not initialized')
    }
  }

  const success = (message: string) => showToast(message, 'success')
  const error = (message: string) => showToast(message, 'error')
  const info = (message: string) => showToast(message, 'info')
  const warning = (message: string) => showToast(message, 'warning')

  return {
    setToastContainer,
    showToast,
    success,
    error,
    info,
    warning
  }
}
