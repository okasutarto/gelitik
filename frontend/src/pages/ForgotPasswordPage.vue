<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const isSubmitted = ref(false);

const handleSubmit = () => {
  // Mock submission for MVP
  // In the future this would call an API like: await api.post('/auth/forgot-password', { email: email.value })
  console.log("Password reset requested for:", email.value);
  isSubmitted.value = true;
};

const handleBackToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <div class="flex min-h-screen w-full font-['Inter']">
    <!-- Left Side: Branding & Testimonial -->
    <div
      class="hidden md:flex w-1/2 bg-[#FFCC00] border-r-[3px] border-black flex-col items-center justify-center p-12 relative overflow-hidden"
    >
      <!-- Logo Top Left -->
      <div class="absolute top-12 left-12">
        <div class="flex items-center gap-2">
          <div
            class="w-12 h-12 bg-white border-[3px] border-black rounded-xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <span class="material-symbols-outlined font-black text-3xl text-slate-900">bolt</span>
          </div>
        </div>
      </div>

      <div class="space-y-8 z-10 max-w-lg">
        <!-- Main Title -->
        <h1
          class="text-9xl font-[900] tracking-tighter uppercase italic leading-none text-slate-900"
        >
          GELITIK
        </h1>

        <!-- Testimonial Card -->
        <div
          class="bg-white border-[3px] border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm rotate-[-2deg]"
        >
          <p class="text-2xl font-black leading-tight text-slate-900">
            "Forgot your password? We've got your back."
          </p>
        </div>
      </div>

      <!-- Decorative Shapes -->
      <div
        class="absolute -bottom-20 -right-20 w-64 h-64 border-[3px] border-black rounded-full bg-white opacity-20"
      ></div>
      <div
        class="absolute top-20 right-10 w-32 h-32 border-[3px] border-black bg-black rotate-45 opacity-10"
      ></div>
    </div>

    <!-- Right Side: Form Content -->
    <div class="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 bg-white">
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
          <h2 class="text-5xl font-[900] tracking-tighter uppercase text-slate-900">
            Reset Password
          </h2>
          <p class="font-bold text-slate-600">
            {{
              isSubmitted
                ? "Check your email for reset instructions."
                : "Enter your email address and we'll send you a link to reset your password."
            }}
          </p>
        </div>

        <div v-if="!isSubmitted">
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="space-y-2">
              <label class="font-black uppercase text-sm tracking-wider text-slate-900"
                >Email Address</label
              >
              <input
                v-model="email"
                type="email"
                required
                placeholder="name@company.com"
                class="w-full bg-white border-[3px] border-black p-4 font-bold placeholder:text-gray-400 focus:outline-none transition-colors text-slate-900"
              />
            </div>

            <button
              type="submit"
              class="w-full bg-[#FFCC00] border-[4px] border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-[900] text-2xl uppercase tracking-tighter transition-all active:translate-x-1 active:translate-y-1 active:shadow-none mt-6 text-slate-900"
            >
              Send Reset Link
            </button>
          </form>
        </div>
        <div v-else class="space-y-6">
          <div
            class="bg-green-100 border-[3px] border-green-500 p-4 shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]"
          >
            <p class="font-bold text-green-900 text-sm">
              If an account exists with that email, a password reset link has been sent. Follow the
              instructions in the email to reset your password.
            </p>
          </div>
        </div>

        <div class="flex justify-center mt-6">
          <button
            @click="handleBackToLogin"
            class="font-black underline decoration-2 underline-offset-4 text-slate-900 hover:text-slate-600 transition-colors"
          >
            Return to Login
          </button>
        </div>

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
  </div>
</template>
