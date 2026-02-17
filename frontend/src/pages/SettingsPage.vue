<script setup lang="ts">
import { ref } from "vue";
import { Settings, LogOut, User, Bell, Shield } from "lucide-vue-next";
import { useAuthStore } from "@/stores/auth";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import PageHeader from "@/components/layout/PageHeader.vue";

const authStore = useAuthStore();

const settings = ref([
  {
    category: "Account",
    icon: User,
    items: [
      {
        label: "Edit Profile",
        description: "Update your personal information",
      },
      { label: "Change Password", description: "Update your password" },
      {
        label: "Connected Accounts",
        description: "Manage your social connections",
      },
    ],
  },
  {
    category: "Preferences",
    icon: Settings,
    items: [
      {
        label: "Notifications",
        description: "Manage your notification preferences",
      },
      { label: "Privacy", description: "Control your data and privacy" },
    ],
  },
  {
    category: "Security",
    icon: Shield,
    items: [
      {
        label: "Two-Factor Authentication",
        description: "Add an extra layer of security",
      },
      {
        label: "Active Sessions",
        description: "View and manage active sessions",
      },
    ],
  },
]);
</script>

<template>
  <DashboardLayout>
    <div class="space-y-6">
      <!-- Page Header with Theme Toggle -->
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
        :show-theme-toggle="true" />

      <!-- Appearance Card -->

      <!-- Account & Preferences Settings -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <template v-for="setting in settings" :key="setting.category">
          <div class="neo-card border-neo-3 border-black">
            <div class="p-6 flex items-center gap-3 border-b-4 border-black">
              <div class="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <component
                  :is="setting.icon"
                  :size="20"
                  class="text-slate-600 dark:text-slate-300" />
              </div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                {{ setting.category }}
              </h3>
            </div>
            <div class="divide-y divide-slate-200 dark:divide-slate-700">
              <template v-for="item in setting.items" :key="item.label">
                <button
                  class="w-full px-6 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left">
                  <div class="flex-1">
                    <p class="font-medium text-slate-900 dark:text-white">
                      {{ item.label }}
                    </p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      {{ item.description }}
                    </p>
                  </div>
                  <Bell :size="18" class="text-slate-400 shrink-0" />
                </button>
              </template>
            </div>
          </div>
        </template>
      </div>

      <!-- Logout Card -->
      <div
        class="bg-white dark:bg-navy border-neo-3 border-black shadow-neo-hard">
        <div class="p-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <LogOut :size="20" class="text-red-600 dark:text-red-500" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-slate-900 dark:text-white">
                Sign Out
              </p>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                You will be logged out from your account
              </p>
            </div>
            <button
              @click="authStore.logout"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
