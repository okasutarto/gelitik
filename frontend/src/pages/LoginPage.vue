<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import LoginForm from "@/components/auth/LoginForm.vue";

const router = useRouter();
const authStore = useAuthStore();

// Event handlers
const handleLogin = async (data: {
  email: string;
  password: string;
  rememberMe: boolean;
}) => {
  try {
    await authStore.login(data.email, data.password);
    router.push("/dashboard");
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/google`;
};

const handleForgotPassword = () => {
  // TODO: Implement forgot password flow - redirect to password reset page or open modal
  // For now, show a toast or redirect to signup page
  window.location.href = '/register';
};

const handleSignup = () => {
  // TODO: Implement signup flow - redirect to registration page
  window.location.href = '/register';
};
</script>

<template>
  <div class="flex min-h-screen w-full font-['Inter']">
    <!-- Left Side: Branding & Testimonial -->
    <div
      class="hidden md:flex w-1/2 bg-[#FFCC00] border-r-[3px] border-black flex-col items-center justify-center p-12 relative overflow-hidden">
      <!-- Logo Top Left -->
      <div class="absolute top-12 left-12">
        <div class="flex items-center gap-2">
          <div
            class="w-12 h-12 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <span class="material-symbols-outlined font-black text-3xl"
              >bolt</span
            >
          </div>
        </div>
      </div>

      <div class="space-y-8 z-10 max-w-lg">
        <!-- Main Title -->
        <h1
          class="text-9xl font-[900] tracking-tighter uppercase italic leading-none">
          GELITIK
        </h1>

        <!-- Testimonial Card -->
        <div
          class="bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm rotate-[-2deg]">
          <p class="text-2xl font-black leading-tight">
            "Social media management that actually hits."
          </p>
          <div class="mt-4 flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full border-[2px] border-black bg-gray-200 overflow-hidden">
              <img
                alt="avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY-DKnb1ETvEtUH0lqwKQh-BooCoDYuV77L4YhOMWHqA4HAfw1aX5HbEs2oE-QDOypgeTvSudFI25OHDUBsgLI51LZfwXTguAWGVxxIYbZ0Ox8tu5C73yQjD8IA3nc3CiOjBeOWT9gpheJadqWmq_7YOHe5Dmh-5msitLybLPkFVZDfVZr_WtFxpJgqZVol94QZHGtGJmLoVS39XDf1voFHw2pdo5TCJJmP1tWxCdPC1TFOYZeN8Yo5c1OW7K_BuWjkKq5n0f8b34c" />
            </div>
            <div>
              <p class="font-black text-sm">@marketing_guru</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative Shapes -->
      <div
        class="absolute -bottom-20 -right-20 w-64 h-64 border-[3px] border-black rounded-full bg-white opacity-20"></div>
      <div
        class="absolute top-20 right-10 w-32 h-32 border-[3px] border-black bg-black rotate-45 opacity-10"></div>
    </div>

    <!-- Right Side: Form Content -->
    <div
      class="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
      <div class="w-full max-w-md space-y-8">
        <!-- Mobile Logo -->
        <div class="md:hidden flex flex-col items-center mb-8">
          <div
            class="w-16 h-16 bg-[#FFCC00] border-[3px] border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-4">
            <span class="material-symbols-outlined font-black text-4xl"
              >bolt</span
            >
          </div>
          <h1 class="text-4xl font-[900] tracking-tighter uppercase">
            GELITIK
          </h1>
        </div>

        <div class="space-y-2">
          <h2 class="text-5xl font-[900] tracking-tighter uppercase">
            Welcome Back
          </h2>
          <p class="font-bold text-gray-600">
            Enter your details to access your dashboard.
          </p>
        </div>

        <LoginForm
          @submit="handleLogin"
          @google-login="handleGoogleLogin"
          @forgot-password="handleForgotPassword"
          @signup="handleSignup" />

        <div
          class="md:hidden mt-12 w-full pt-8 border-t-[3px] border-black/10 text-center">
          <p
            class="text-[10px] font-black uppercase tracking-widest text-gray-400">
            © {{ new Date().getFullYear() }} Gelitik Lab. All rights reserved.
          </p>
          <div class="mt-3 flex justify-center gap-4">
            <router-link
              to="/terms"
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              Terms
            </router-link>
            <span class="text-gray-400">•</span>
            <router-link
              to="/privacy"
              class="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
              Privacy
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
