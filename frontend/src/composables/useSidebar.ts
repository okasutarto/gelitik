import { ref } from "vue";
import api from "@/services/api";

const isCollapsed = ref(false);
const connectedPlatforms = ref<string[]>([]);

/**
 * Composable for managing sidebar collapse state
 * Persists preference to localStorage
 */
export function useSidebar() {
  const STORAGE_KEY = "gelitik-sidebar-collapsed";

  const initSidebar = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      isCollapsed.value = stored === "true";
    }
  };

  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
    localStorage.setItem(STORAGE_KEY, String(isCollapsed.value));
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    isCollapsed.value = collapsed;
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  };

  const fetchConnectedPlatforms = async () => {
    try {
      const { data } = await api.get('/api/accounts/status');
      if (data.success && data.data.connected) {
        connectedPlatforms.value = data.data.connected;
      }
    } catch {
      // Silently fail - will show disconnected status
    }
  };

  return {
    isCollapsed,
    connectedPlatforms,
    fetchConnectedPlatforms,
    toggleSidebar,
    setSidebarCollapsed,
    initSidebar,
  };
}

