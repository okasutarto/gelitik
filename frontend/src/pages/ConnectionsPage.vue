<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";
import { Instagram, Music2, Plus, Trash2, CheckCircle, AlertTriangle, X } from "lucide-vue-next";
import { useToast } from "@/composables/useToast";

const router = useRouter();
const toast = useToast();

const showDisconnectModal = ref(false);
const accountToDisconnect = ref<ConnectedAccount | null>(null);

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
  "instagram-graph": Instagram,
  tiktok: Music2,
};

// Static color mappings for Tailwind (avoid dynamic classes)
const platformBgColors: Record<string, string> = {
  instagram: "bg-pink-100 dark:bg-pink-900/30",
  "instagram-graph": "bg-pink-100 dark:bg-pink-900/30",
  tiktok: "bg-slate-100 dark:bg-slate-800",
};

const platformIconColors: Record<string, string> = {
  instagram: "text-pink-600 dark:text-pink-400",
  "instagram-graph": "text-pink-600 dark:text-pink-400",
  tiktok: "text-slate-600 dark:text-slate-300",
};

const getPlatformBgColor = (platform: string) => platformBgColors[platform] || "bg-gray-100";
const getPlatformIconColor = (platform: string) => platformIconColors[platform] || "text-gray-600";

const isConnected = (platformId: string) => {
  return accounts.value.some(
    (acc) =>
      acc.platform === platformId ||
      (platformId === "instagram-graph" && acc.platform === "instagram-graph")
  );
};

const availablePlatforms = [
  {
    id: "instagram-graph",
    name: "Instagram Business",
    description: "Advanced insights, analytics & publishing (requires Facebook page)",
    icon: Instagram,
    iconColor: "text-pink-600",
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    disabled: false,
  },
  // {
  //   id: "instagram",
  //   name: "Instagram",
  //   description: "Basic profile & media access",
  //   icon: Instagram,
  //   iconColor: "text-pink-400",
  //   badgeColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  //   disabled: false,
  // },
  {
    id: "tiktok",
    name: "TikTok",
    description: "Connect your TikTok account",
    icon: Music2,
    iconColor: "text-slate-900 dark:text-white",
    disabled: false,
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
    }

    // instagram-graph has its own dedicated route; others use generic /auth/:platform/connect
    const connectUrl =
      platform === "instagram-graph"
        ? "/auth/instagram-graph/connect"
        : `/auth/${platform}/connect`;

    const { data } = await api.get(connectUrl);
    if (import.meta.env.DEV) {
    }

    if (data.success && data.data.authUrl) {
      if (import.meta.env.DEV) {
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

const confirmDisconnect = (account: ConnectedAccount) => {
  accountToDisconnect.value = account;
  showDisconnectModal.value = true;
};

const disconnectAccount = async () => {
  if (!accountToDisconnect.value) return;

  const accountId = accountToDisconnect.value.id;
  showDisconnectModal.value = false;

  try {
    await api.delete(`/api/accounts/${accountId}`);
    await fetchAccounts();
    toast.success("Account disconnected successfully");
  } catch (error) {
    console.error("Disconnect error:", error);
    toast.error("Failed to disconnect account");
  } finally {
    accountToDisconnect.value = null;
  }
};

onMounted(() => {
  // Handle OAuth errors from URL query params
  const error = router.currentRoute.value.query.error as string;
  if (error) {
    toast.error(`Connection failed: ${error}`);
    // Clear the error from URL
    router.replace({ query: {} });
  }

  // Handle successful connection
  const connected = router.currentRoute.value.query.connected as string;
  if (connected) {
    toast.success(`${connected} connected successfully!`);
    sessionStorage.setItem("connection-success", connected);
    router.replace({ query: {} });
  }

  fetchAccounts();
});
</script>

<template>
  <DashboardLayout>
    <!-- Page Header with Theme Toggle -->
    <PageHeader
      title="Connected Accounts"
      subtitle="Manage your connected social media accounts"
      :show-theme-toggle="true"
    />

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="accounts.length > 0" class="space-y-4">
      <div
        v-for="account in accounts"
        :key="account.id"
        class="flex items-center justify-between neo-card border-neo-3 border-black"
      >
        <div class="flex items-center gap-4">
          <div
            :class="[
              'w-12 h-12 rounded-full flex items-center justify-center',
              getPlatformBgColor(account.platform),
            ]"
          >
            <component
              :is="platformIcons[account.platform as keyof typeof platformIcons]"
              :class="['w-6 h-6', getPlatformIconColor(account.platform)]"
            />
          </div>
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">
              {{ account.displayName }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">@{{ account.username }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-if="account.isActive"
            class="flex items-center gap-1 px-3 py-1 bg-green-400 dark:bg-green-500 text-black font-bold border-2 border-black dark:border-electric shadow-brutal-sm text-sm"
          >
            <CheckCircle :size="14" :stroke-width="2.5" />
            Connected
          </div>

          <div v-if="account._count?.content" class="text-sm text-slate-500 dark:text-slate-400">
            {{ account._count.content }} posts
          </div>

          <button
            @click="confirmDisconnect(account)"
            class="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Disconnect account"
          >
            <Trash2 :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4"
      >
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
      <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Account</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="platform in availablePlatforms"
          :key="platform.id"
          @click="!platform.disabled && connectPlatform(platform.id)"
          :disabled="isConnected(platform.id) || platform.disabled"
          class="relative flex flex-col items-start justify-center p-4 h-auto min-h-[80px] bg-white dark:bg-navy shadow-brutal-sm dark:shadow-brutal-cyber border-3 border-black dark:border-electric brutal-hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-center gap-3 w-full">
            <component :is="platform.icon" :size="24" :class="platform.iconColor" />
            <span class="font-bold text-lg">Connect {{ platform.name }}</span>
          </div>
          <p
            v-if="platform.description"
            class="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-9"
          >
            {{ platform.description }}
          </p>
        </button>
      </div>
    </div>

    <!-- Disconnect Confirmation Modal -->
    <div
      v-if="showDisconnectModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        class="bg-white dark:bg-navy w-full max-w-xl border-4 border-black dark:border-electric shadow-brutal-lg dark:shadow-brutal-cyber-lg p-6 relative"
      >
        <!-- Close Button -->
        <button
          @click="showDisconnectModal = false"
          class="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X :size="20" class="text-slate-500" />
        </button>

        <div class="flex items-center gap-4 mb-6">
          <div
            class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 border-2 border-red-500 flex items-center justify-center shrink-0"
          >
            <AlertTriangle :size="20" class="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Disconnect Account
            </h3>
          </div>
        </div>

        <div class="text-center mb-4">
          <p class="text-lg text-slate-600 dark:text-slate-400 mt-2">
            Are you sure you want to disconnect
            <span class="font-bold text-slate-900 dark:text-white">
              @{{ accountToDisconnect?.username }} </span
            >?
          </p>
        </div>

        <div
          class="flex items-center gap-3 justify-end pt-4 border-t-2 border-slate-100 dark:border-slate-800"
        >
          <button
            @click="showDisconnectModal = false"
            class="px-5 py-2.5 text-sm font-bold uppercase tracking-wide border-3 border-black dark:border-electric text-slate-600 dark:text-slate-400 transition-all brutal-hover-lift"
          >
            Cancel
          </button>
          <button
            @click="disconnectAccount"
            class="px-5 py-2.5 text-sm font-black uppercase tracking-wide bg-red-500 hover:bg-red-600 text-white border-4 border-black shadow-brutal-sm brutal-hover-lift transition-all"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
