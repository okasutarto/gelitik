<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";

const route = useRoute();
const router = useRouter();

const status = ref<"loading" | "success" | "error">("loading");
const errorMessage = ref("");

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    status.value = "error";
    errorMessage.value = "Missing verification token.";
    return;
  }

  try {
    await api.get(`/auth/verify-email?token=${token}`);
    status.value = "success";
  } catch (error: any) {
    status.value = "error";
    errorMessage.value =
      error.response?.data?.error || "Verification failed. Link is invalid or expired.";
  }
});

const goToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <div class="min-h-screen w-full font-['Inter'] bg-[#FFCC00] flex items-center justify-center p-6">
    <div
      class="w-full max-w-md bg-white border-[4px] border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center"
    >
      <!-- Loading State -->
      <div v-if="status === 'loading'" class="space-y-6">
        <div
          class="w-20 h-20 bg-neo-accent border-[3px] border-black rounded-full flex items-center justify-center mx-auto animate-pulse"
        >
          <span class="material-symbols-outlined text-4xl text-slate-900 animate-spin">sync</span>
        </div>
        <h2 class="text-3xl font-[900] tracking-tighter uppercase text-slate-900">Verifying...</h2>
        <p class="font-bold text-slate-600">Please wait while we confirm your email address.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="space-y-6">
        <div
          class="w-20 h-20 bg-[#E5F522] border-[3px] border-black flex items-center justify-center mx-auto rotate-[-5deg]"
        >
          <span class="material-symbols-outlined text-4xl text-slate-900 font-bold">check</span>
        </div>
        <h2 class="text-3xl font-[900] tracking-tighter uppercase text-slate-900">
          Email Verified!
        </h2>
        <p class="font-bold text-slate-600">
          Your account is now active. You can log in and start using Gelitik.
        </p>
        <button
          @click="goToLogin"
          class="w-full bg-neo-accent border-[4px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-[900] text-xl uppercase tracking-tighter transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[#E5F522] mt-6 text-slate-900"
        >
          Go To Login
        </button>
      </div>

      <!-- Error State -->
      <div v-else-if="status === 'error'" class="space-y-6">
        <div
          class="w-20 h-20 bg-red-400 border-[3px] border-black flex items-center justify-center mx-auto rotate-[5deg]"
        >
          <span class="material-symbols-outlined text-4xl text-black font-bold">close</span>
        </div>
        <h2 class="text-3xl font-[900] tracking-tighter uppercase text-slate-900">
          Verification Failed
        </h2>
        <p class="font-bold text-slate-600">{{ errorMessage }}</p>
        <button
          @click="goToLogin"
          class="w-full bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-[900] text-xl uppercase tracking-tighter transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-slate-100 mt-6 text-slate-900"
        >
          Return to Login
        </button>
      </div>
    </div>
  </div>
</template>
