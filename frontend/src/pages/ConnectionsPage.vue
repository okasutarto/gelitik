<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import { Instagram, Music2, Plus, Trash2, CheckCircle } from "lucide-vue-next";

const router = useRouter();

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

const platformColors = {
  instagram: "pink",
  tiktok: "slate",
};

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
    const { data } = await api.get(`/auth/${platform}/connect`);
    if (data.success && data.data.authUrl) {
      window.location.href = data.data.authUrl;
    } else {
      alert("Failed to initiate connection");
    }
  } catch (error) {
    console.error("Connection error:", error);
    alert("Failed to connect account");
  }
};

const disconnectAccount = async (accountId: string) => {
  if (!confirm("Are you sure you want to disconnect this account?")) return;

  try {
    await api.delete(`/api/accounts/${accountId}`);
    await fetchAccounts();
  } catch (error) {
    console.error("Disconnect error:", error);
    alert("Failed to disconnect account");
  }
};

onMounted(() => {
  fetchAccounts();
});
</script>

<template>
  <DashboardLayout>
    <div class="mb-6">
      <h2 class="text-4xl font-black uppercase text-slate-900 dark:text-white">
        Connected Accounts
      </h2>
      <p class="text-sm uppercase font-bold text-slate-500 dark:text-slate-400">
        Manage your connected social media accounts
      </p>
    </div>

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
            :class="`w-12 h-12 rounded-full flex items-center justify-center bg-${platformColors[account.platform as keyof typeof platformColors]}-100`">
            <component
              :is="
                platformIcons[account.platform as keyof typeof platformIcons]
              "
              :class="`w-6 h-6 text-${platformColors[account.platform as keyof typeof platformColors]}-600`" />
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
            class="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle :size="12" />
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
          @click="connectPlatform('instagram')"
          class="flex items-center justify-center gap-3 rounded-xl h-14 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800">
          <Instagram :size="24" class="text-pink-600" />
          <span class="font-medium text-slate-700 dark:text-slate-300"
            >Connect Instagram</span
          >
        </button>

        <button
          @click="connectPlatform('tiktok')"
          class="flex items-center justify-center gap-3 rounded-xl h-14 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors bg-white dark:bg-slate-800">
          <Music2 :size="24" class="text-slate-900 dark:text-white" />
          <span class="font-medium text-slate-700 dark:text-slate-300"
            >Connect TikTok</span
          >
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>
