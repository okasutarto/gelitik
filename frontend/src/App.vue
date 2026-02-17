<script setup lang="ts">
import { RouterView } from 'vue-router'
import ErrorBoundary from './components/ui/ErrorBoundary.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
</script>

<template>
  <ErrorBoundary>
    <ToastContainer />
    <RouterView />
  </ErrorBoundary>
</template>
