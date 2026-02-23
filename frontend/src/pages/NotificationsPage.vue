<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useNotificationsStore } from "@/stores/notifications";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import {
  Bell,
  Trash2,
  CheckCheck,
  Filter,
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
  ExternalLink,
} from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const store = useNotificationsStore();
const toast = useToast();

const filterType = ref("all");

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
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

const handleNotificationClick = (notification: { id: string; actionUrl?: string }) => {
  store.markAsRead(notification.id);
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
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

const getTypeColor = (type: string) => {
  switch (type) {
    case "post_failed":
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700";
    case "account_connected":
      return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700";
    case "post_published":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700";
    case "post_scheduled":
      return "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700";
    case "comment":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700";
    case "mention":
      return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-700";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "account_connected":
      return "Connected";
    case "token_expiring":
      return "Warning";
    case "post_scheduled":
      return "Scheduled";
    case "post_published":
      return "Published";
    case "post_failed":
      return "Failed";
    case "comment":
      return "Comment";
    case "mention":
      return "Mention";
    default:
      return "System";
  }
};
</script>

<template>
  <DashboardLayout>
    <div class="h-full flex flex-col">
      <!-- Page Header -->
      <PageHeader
        title="Notifications"
        subtitle="Stay updated with your account activity."
        :show-theme-toggle="true"
      />

      <!-- Actions Bar -->
      <div class="flex items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2">
          <Filter :size="18" class="text-slate-500" />
          <select
            v-model="filterType"
            class="h-10 px-4 font-mono text-sm bg-white dark:bg-navy border-3 border-black dark:border-electric shadow-brutal-sm focus:outline-none focus:shadow-brutal dark:focus:shadow-brutal-cyber"
          >
            <option value="all">All Notifications</option>
            <option value="account_connected">Account Connected</option>
            <option value="post_scheduled">Scheduled Posts</option>
            <option value="post_published">Published</option>
            <option value="post_failed">Failed</option>
            <option value="comment">Comments</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="handleMarkAllRead"
            :disabled="store.unreadCount === 0"
            class="flex items-center gap-2 px-4 py-2 font-bold text-sm uppercase tracking-wide bg-white dark:bg-navy border-3 border-black dark:border-electric shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brutal-sm"
          >
            <CheckCheck :size="16" />
            Mark all read
          </button>
          <button
            @click="handleClearAll"
            :disabled="store.notifications.length === 0"
            class="flex items-center gap-2 px-4 py-2 font-bold text-sm uppercase tracking-wide bg-white dark:bg-navy border-3 border-black dark:border-electric shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 hover:border-red-500 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-brutal-sm"
          >
            <Trash2 :size="16" />
            Clear all
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Empty State -->
        <div
          v-if="store.sortedNotifications.length === 0"
          class="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-navy border-4 border-black dark:border-electric shadow-brutal"
        >
          <div
            class="w-24 h-24 mb-6 bg-slate-100 dark:bg-slate-800 border-4 border-black dark:border-electric flex items-center justify-center shadow-brutal-sm"
          >
            <Bell :size="48" class="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 class="font-black text-2xl text-black dark:text-white tracking-tight mb-2">
            ALL CLEAR
          </h3>
          <p class="text-slate-600 dark:text-slate-400 max-w-md">
            You're all caught up! Check back later for notifications about your connected accounts
            and scheduled posts.
          </p>
        </div>

        <!-- Notification Items -->
        <div v-else class="space-y-3">
          <div
            v-for="notification in store.sortedNotifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            :class="[
              'flex items-start gap-4 p-5 bg-white dark:bg-navy border-4 border-black dark:border-electric shadow-brutal-sm cursor-pointer hover:shadow-brutal hover:-translate-y-1 transition-all',
              !notification.read && 'bg-cyan-50/50 dark:bg-cyan-900/10',
            ]"
          >
            <!-- Icon -->
            <div
              :class="[
                'shrink-0 w-14 h-14 flex items-center justify-center border-3 border-black dark:border-electric shadow-brutal-sm',
                getTypeColor(notification.type),
              ]"
            >
              <component :is="getIcon(notification.type)" :size="24" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-black text-lg text-black dark:text-white tracking-tight">
                      {{ notification.title }}
                    </p>
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-bold uppercase tracking-wider border',
                        getTypeColor(notification.type),
                      ]"
                    >
                      {{ getTypeLabel(notification.type) }}
                    </span>
                  </div>
                  <p class="text-slate-600 dark:text-slate-400">
                    {{ notification.message }}
                  </p>
                </div>

                <ExternalLink
                  v-if="notification.actionUrl"
                  :size="18"
                  class="shrink-0 text-slate-400 dark:text-slate-500"
                />
              </div>

              <!-- Footer -->
              <div class="flex items-center gap-4 mt-3">
                <span class="text-sm text-slate-500 dark:text-slate-500">
                  {{ formatTime(notification.timestamp) }}
                </span>

                <div v-if="notification.platform" class="flex items-center gap-1.5">
                  <component
                    :is="platformIconMap[notification.platform]"
                    :size="14"
                    class="text-slate-500"
                  />
                  <span class="text-sm text-slate-500 capitalize">
                    {{
                      notification.platform === "instagram-graph"
                        ? "Instagram Business"
                        : notification.platform
                    }}
                  </span>
                </div>

                <div v-if="!notification.read" class="ml-auto">
                  <span
                    class="px-2 py-1 text-xs font-bold uppercase tracking-wide bg-cyan-500 text-white rounded"
                  >
                    New
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
