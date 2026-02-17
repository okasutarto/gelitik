<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import { Instagram, Music2, Plus, Trash2, CheckCircle } from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const toast = useToast();

interface ConnectedAccount {
  id: string;
  platform: string;
  displayName: string;
  username: string;
  avatar?: string;
  isActive: boolean;
  _count?: {
    content: number;
  };
}

const accounts = ref<ConnectedAccount[]>([]);
const loading = ref(true);

const platformIcons = {
  instagram: Instagram,
  tiktok: Music2,
};

// Static color mappings for Tailwind (avoid dynamic classes)
const platformBgColors: Record<string, string> = {
  instagram: 'bg-pink-100 dark:bg-pink-900/30',
  tiktok: 'bg-slate-100 dark:bg-slate-800',
};

const platformIconColors: Record<string, string> = {
  instagram: 'text-pink-600 dark:text-pink-400',
  tiktok: 'text-slate-600 dark:text-slate-300',
};

const getPlatformBgColor = (platform: string) => platformBgColors[platform] || 'bg-gray-100';
const getPlatformIconColor = (platform: string) => platformIconColors[platform] || 'text-gray-600';

const availablePlatforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    iconColor: "text-pink-600",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music2,
    iconColor: "text-slate-900 dark:text-white",
  },
];

const fetchAccounts = async () => {
  try {
    const { data } = await api.get("/api/accounts");
    accounts.value = data.data || [];
  } catch (error) {
    console.error("Failed to fetch accounts:", error);
  } finally {
    loading.value = false;
  }
};

const connectPlatform = async (platform: string) => {
  try {
    if (import.meta.env.DEV) {
      console.log(`[Connections] Connecting to ${platform}...`);
    }
    const { data } = await api.get(`/auth/${platform}/connect`);
    if (import.meta.env.DEV) {
      console.log(`[Connections] Response:`, data);
    }

    if (data.success && data.data.authUrl) {
      if (import.meta.env.DEV) {
        console.log(`[Connections] Redirecting to TikTok...`);
      }
      window.location.href = data.data.authUrl;
    } else {
      console.error(`[Connections] Failed - No authUrl in response`, data);
      toast.error("Failed to initiate connection");
    }
  } catch (error) {
    console.error("[Connections] Connection error:", error);
    toast.error("Failed to connect account");
  }
};

const disconnectAccount = async (accountId: string) => {
  if (!confirm("Are you sure you want to disconnect this account?")) return;

  try {
    await api.delete(`/api/accounts/${accountId}`);
    await fetchAccounts();
  } catch (error) {
    console.error("Disconnect error:", error);
    toast.error("Failed to disconnect account");
  }
};

onMounted(() => {
  fetchAccounts();
});
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Theme Toggle -->
    <PageHeader
      title="Connected Accounts"
      subtitle="Manage your connected social media accounts"
      :show-theme-toggle="true" />

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="accounts.length > 0" class="space-y-4">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="flex items-center justify-between neo-card border-neo-3 border-black">
        <div class="flex items-center gap-4">
          <div
            :class="['w-12 h-12 rounded-full flex items-center justify-center', getPlatformBgColor(account.platform)]">
            <component
              :is="
                platformIcons[account.platform as keyof typeof platformIcons]
              "
              :class="['w-6 h-6', getPlatformIconColor(account.platform)]" />
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">
              {{ account.displayName }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              @{{ account.username }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="account.isActive"
            class="flex items-center gap-1 px-3 py-1 bg-green-400 dark:bg-green-500 text-black font-bold border-2 border-black dark:border-electric shadow-brutal-sm text-sm">
            <CheckCircle :size="14" :stroke-width="2.5" />
            Connected
          </div>

          <div
            v-if="account._count?.content"
            class="text-sm text-slate-500 dark:text-slate-400">
            {{ account._count.content }} posts
          </div>

          <button
            @click="disconnectAccount(account.id)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Disconnect account">
            <Trash2 :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
        <Plus :size="32" class="text-slate-400 dark:text-slate-600" />
      </div>
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        No accounts connected
      </h3>
      <p class="text-slate-500 dark:text-slate-400 mb-6">
        Connect your social media accounts to get started
      </p>
    </div>

    <div class="mt-8">
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Add Account
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="platform in availablePlatforms"
          :key="platform.id"
          @click="connectPlatform(platform.id)"
          class="flex items-center justify-center gap-3 h-14 bg-white dark:bg-navy shadow-brutal-sm dark:shadow-brutal-cyber border-3 border-black dark:border-electric brutal-hover-lift">
          <component
            :is="platform.icon"
            :size="24"
            :class="platform.iconColor" />
          <span class="font-bold">Connect {{ platform.name }}</span>
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
