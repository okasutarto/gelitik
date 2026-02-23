<script setup lang="ts">
import { useRouter } from "vue-router";
import { useNotificationsStore } from "@/stores/notifications";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Instagram,
  Music2,
  AlertCircle,
  CheckCircle,
  Calendar,
  Send,
  XCircle,
  MessageSquare,
  AtSign,
  Info,
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const store = useNotificationsStore();
const toast = useToast();

defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const iconMap: Record<string, typeof Bell> = {
  account_connected: CheckCircle,
  token_expiring: AlertCircle,
  post_scheduled: Calendar,
  post_published: Send,
  post_failed: XCircle,
  comment: MessageSquare,
  mention: AtSign,
  system: Info,
};

const platformIconMap: Record<string, typeof Instagram> = {
  instagram: Instagram,
  "instagram-graph": Instagram,
  tiktok: Music2,
};

const getIcon = (type: string) => iconMap[type] || Info;

const formatTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const handleNotificationClick = (notification: { id: string; actionUrl?: string }) => {
  store.markAsRead(notification.id);
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
    emit("close");
  }
};

const handleMarkAllRead = () => {
  store.markAllAsRead();
  toast.success("All notifications marked as read");
};

const handleClearAll = () => {
  store.clearAll();
  toast.success("All notifications cleared");
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest(".notification-dropdown")) {
    emit("close");
  }
};
</script>

<template>
  <div v-if="isOpen" class="notification-dropdown fixed inset-0 z-50" @click="handleClickOutside">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/20 dark:bg-black/40" />

    <!-- Dropdown Panel -->
    <div
      class="absolute top-16 right-4 md:right-8 w-[380px] max-h-[500px] bg-white dark:bg-navy border-4 border-black dark:border-electric shadow-brutal-lg dark:shadow-brutal-cyber overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-4 py-3 bg-neo-accent dark:bg-hotpink border-b-4 border-black dark:border-electric"
      >
        <div class="flex items-center gap-2">
          <Bell :size="20" class="text-black dark:text-navy" />
          <h3 class="font-black text-lg text-black dark:text-navy tracking-tight">NOTIFICATIONS</h3>
          <span
            v-if="store.unreadCount > 0"
            class="px-2 py-0.5 text-xs font-bold bg-black dark:bg-electric text-white dark:text-navy rounded"
          >
            {{ store.unreadCount }}
          </span>
        </div>
        <button
          @click="$emit('close')"
          class="p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X :size="18" class="text-black dark:text-navy" />
        </button>
      </div>

      <!-- Actions Bar -->
      <div
        v-if="store.notifications.length > 0"
        class="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b-2 border-black dark:border-electric/30"
      >
        <button
          @click="handleMarkAllRead"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white dark:bg-navy border-2 border-black dark:border-electric hover:bg-black hover:text-white dark:hover:bg-electric dark:hover:text-navy transition-colors"
        >
          <CheckCheck :size="14" />
          Mark all read
        </button>
        <button
          @click="handleClearAll"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white dark:bg-navy border-2 border-black dark:border-electric hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
        >
          <Trash2 :size="14" />
          Clear
        </button>
      </div>

      <!-- Notifications List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Empty State -->
        <div
          v-if="store.sortedNotifications.length === 0"
          class="flex flex-col items-center justify-center py-12 px-4 text-center"
        >
          <div
            class="w-16 h-16 mb-4 bg-slate-100 dark:bg-slate-800 border-2 border-black dark:border-electric flex items-center justify-center"
          >
            <Bell :size="32" class="text-slate-400 dark:text-slate-500" />
          </div>
          <p class="font-bold text-slate-600 dark:text-slate-400">No notifications yet</p>
          <p class="text-sm text-slate-500 dark:text-slate-500 mt-1">
            We'll notify you when something happens
          </p>
        </div>

        <!-- Notification Items -->
        <div v-else>
          <button
            v-for="notification in store.sortedNotifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            :class="[
              'w-full flex items-start gap-3 p-4 text-left border-b-2 border-black/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
              !notification.read && 'bg-cyan-50/50 dark:bg-cyan-900/10',
            ]"
          >
            <!-- Icon -->
            <div
              :class="[
                'shrink-0 w-10 h-10 flex items-center justify-center border-2 border-black dark:border-electric',
                notification.type === 'post_failed'
                  ? 'bg-red-100 dark:bg-red-900/30'
                  : notification.type === 'account_connected'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : notification.type === 'post_published'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-slate-100 dark:bg-slate-800',
              ]"
            >
              <component
                :is="getIcon(notification.type)"
                :size="18"
                :class="[
                  notification.type === 'post_failed'
                    ? 'text-red-600 dark:text-red-400'
                    : notification.type === 'account_connected'
                      ? 'text-green-600 dark:text-green-400'
                      : notification.type === 'post_published'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400',
                ]"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p
                  :class="[
                    'font-bold text-sm truncate',
                    notification.read
                      ? 'text-slate-600 dark:text-slate-400'
                      : 'text-black dark:text-white',
                  ]"
                >
                  {{ notification.title }}
                </p>
                <span class="text-xs text-slate-500 dark:text-slate-500 shrink-0">
                  {{ formatTime(notification.timestamp) }}
                </span>
              </div>
              <p class="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                {{ notification.message }}
              </p>

              <!-- Platform Badge -->
              <div v-if="notification.platform" class="flex items-center gap-1 mt-2">
                <component
                  :is="platformIconMap[notification.platform]"
                  :size="12"
                  class="text-slate-500"
                />
                <span class="text-xs text-slate-500 capitalize">
                  {{
                    notification.platform === "instagram-graph"
                      ? "Instagram Business"
                      : notification.platform
                  }}
                </span>
              </div>
            </div>

            <!-- Unread Indicator -->
            <div
              v-if="!notification.read"
              class="shrink-0 w-2 h-2 bg-cyan-500 dark:bg-electric rounded-full mt-2"
            />
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div
        v-if="store.notifications.length > 0"
        class="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-t-2 border-black dark:border-electric/30"
      >
        <button
          @click="
            router.push('/notifications');
            $emit('close');
          "
          class="w-full py-2 text-center text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors"
        >
          View all notifications
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
