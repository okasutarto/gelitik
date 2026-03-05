<script setup lang="ts">
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import UserProfile from '@/components/dashboard/profile/UserProfile.vue'
import UserProfileSkeleton from '@/components/loading/UserProfileSkeleton.vue'

interface Props {
  title: string
  subtitle: string
  loading?: boolean
  lastUpdated?: Date | null
  userInfo?: any
}

withDefaults(defineProps<Props>(), {
  loading: false
})

defineEmits<{
  refresh: []
}>()
</script>

<template>
  <DashboardLayout>
    <!-- Page Header -->
    <PageHeader
      :title="title"
      :subtitle="subtitle"
      :last-updated="lastUpdated"
      :loading="loading"
      @refresh="$emit('refresh')"
    />

    <!-- User Profile -->
    <UserProfile v-if="!loading && userInfo" :user-info="userInfo" />
    <UserProfileSkeleton v-else-if="loading" />

    <!-- Action Row Slot (Export + DateRangeFilter go here) -->
    <div v-if="!loading" class="flex justify-end mt-6 mb-2 relative gap-3">
      <slot name="actions" />
    </div>

    <!-- Loading placeholder when loading -->
    <div v-else-if="loading" class="h-12 mb-2"></div>

    <!-- Main Content Slot -->
    <slot />
  </DashboardLayout>
</template>
