import { ref } from "vue";

const isCollapsed = ref(false);

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

  return {
    isCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
    initSidebar,
  };
}
