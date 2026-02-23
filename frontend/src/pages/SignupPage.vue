<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import SignupForm from "@/components/auth/SignupForm.vue";

const router = useRouter();
const authStore = useAuthStore();
const apiError = ref<string | null>(null);
const signupSuccess = ref(false);

// Event handlers
const handleSignup = async (data: { email: string; password: string; name: string }) => {
  try {
    apiError.value = null;
    const result = await authStore.register(data.email, data.password, data.name);
    if (result.success) {
      signupSuccess.value = true;
    } else {
      apiError.value = result.error || "Signup failed. Please try again.";
    }
  } catch (error: unknown) {
    console.error("Signup failed:", error);
    apiError.value = error instanceof Error ? error.message : "An unexpected error occurred.";
  }
};

const handleGoogleSignup = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/google`;
};

const handleLogin = () => {
  router.push("/login");
};
</script>

<template>
  <div class="flex min-h-screen w-full font-['Inter']">
    <!-- Left Side: Form Content -->
    <div
      class="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-white relative"
    >
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Logo -->
        <div class="md:hidden flex flex-col items-center mb-8">
          <div
            class="w-16 h-16 bg-[#FFCC00] border-[3px] border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4"
          >
            <span class="material-symbols-outlined text-4xl">bolt</span>
          </div>
          <h1 class="text-4xl font-[900] tracking-tighter uppercase text-slate-900">GELITIK</h1>
        </div>

        <div class="space-y-2">
          <h2 class="text-5xl font-[900] tracking-tighter uppercase text-slate-900">Get Started</h2>
          <p class="font-bold text-slate-600">
            Create your account to start managing your platforms.
          </p>
        </div>

        <div
          v-if="apiError"
          class="bg-red-100 border-[3px] border-red-500 p-4 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]"
        >
          <p class="font-bold text-red-900 text-sm italic">{{ apiError }}</p>
        </div>

        <div
          v-if="signupSuccess"
          class="bg-[#E5F522] border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center space-y-4"
        >
          <h3 class="text-2xl font-black uppercase text-slate-900">Check Your Email!</h3>
          <p class="font-bold text-slate-900">
            We've sent a verification link to your inbox. Please click it to activate your account.
          </p>
          <button
            @click="handleLogin"
            class="w-full bg-white border-[3px] border-black p-4 font-black uppercase text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Return to Login
          </button>
        </div>

        <SignupForm
          v-else
          @submit="handleSignup"
          @google-signup="handleGoogleSignup"
          @login="handleLogin"
        />

        <div class="md:hidden mt-12 w-full pt-8 border-t-[3px] border-black/10 text-center">
          <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">
            © {{ new Date().getFullYear() }} Gelitik Lab. All rights reserved.
          </p>
          <div class="mt-3 flex justify-center gap-4">
            <router-link
              to="/terms"
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Terms
            </router-link>
            <span class="text-gray-400">•</span>
            <router-link
              to="/privacy"
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              Privacy
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side: Branding & Decorative -->
    <div
      class="hidden md:flex w-1/2 bg-neo-accent border-l-[3px] border-black transform-gpu flex-col items-center justify-center p-12 relative overflow-hidden"
    >
      <!-- Logo Top Right -->
      <div class="absolute top-12 right-12 z-50">
        <div class="flex items-center gap-2">
          <div
            class="w-12 h-12 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <span class="material-symbols-outlined font-black text-3xl text-slate-900">bolt</span>
          </div>
        </div>
      </div>

      <div class="space-y-8 z-10 max-w-lg relative text-right">
        <!-- Main Title -->
        <h1
          class="text-9xl font-[900] tracking-tighter uppercase italic leading-none text-slate-900"
        >
          CONNECT
        </h1>
        <h1
          class="text-8xl font-[900] tracking-tighter uppercase leading-none text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
        >
          CREATE
        </h1>

        <!-- Call to Action Card -->
        <div
          class="bg-[#FFCC00] border-[3px] border-black p-6 shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm rotate-[2deg] ml-auto relative right-12 mt-12"
        >
          <p class="text-2xl font-black leading-tight text-slate-900 text-left">
            "We turned our follower growth on autopilot."
          </p>
          <div class="mt-4 flex items-center gap-3 justify-end">
            <div>
              <p class="font-black text-sm text-slate-700">@creative_agency</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative Shapes -->
      <div
        class="absolute -bottom-20 -left-20 w-64 h-64 border-[3px] border-black bg-white opacity-20 rotate-12"
      ></div>
      <div
        class="absolute top-40 left-10 w-32 h-32 border-[3px] border-black rounded-full bg-black opacity-10"
      ></div>
    </div>
  </div>
</template>
