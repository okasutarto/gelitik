import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Notification {
  id: string;
  type:
    | "account_connected"
    | "token_expiring"
    | "post_scheduled"
    | "post_published"
    | "post_failed"
    | "comment"
    | "mention"
    | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  platform?: "tiktok" | "instagram" | "instagram-graph";
  metadata?: Record<string, unknown>;
}

export const useNotificationsStore = defineStore("notifications", () => {
  const notifications = ref<Notification[]>([]);
  const isLoading = ref(false);
  const isDropdownOpen = ref(false);

  // Computed
  const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length);

  const unreadNotifications = computed(() => notifications.value.filter((n) => !n.read));

  const sortedNotifications = computed(() =>
    [...notifications.value].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );

  // Actions
  const setNotifications = (newNotifications: Notification[]) => {
    notifications.value = newNotifications;
  };

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    notifications.value.unshift(newNotification);
  };

  const markAsRead = (id: string) => {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach((n) => {
      n.read = true;
    });
  };

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const clearAll = () => {
    notifications.value = [];
  };

  const toggleDropdown = () => {
    isDropdownOpen.value = !isDropdownOpen.value;
  };

  const closeDropdown = () => {
    isDropdownOpen.value = false;
  };

  return {
    notifications,
    isLoading,
    isDropdownOpen,
    unreadCount,
    unreadNotifications,
    sortedNotifications,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleDropdown,
    closeDropdown,
  };
});
