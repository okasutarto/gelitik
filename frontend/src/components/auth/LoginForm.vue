<script setup lang="ts">
import { ref } from "vue";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const emit = defineEmits<{
  (e: "submit", data: LoginFormData): void;
  (e: "google-login"): void;
  (e: "forgot-password"): void;
  (e: "signup"): void;
}>();

const email = ref("");
const password = ref("");

const handleSubmit = () => {
  emit("submit", {
    email: email.value,
    password: password.value,
    rememberMe: false,
  });
};
</script>

<template>
  <div class="space-y-6">
    <button
      @click="$emit('google-login')"
      class="w-full bg-white border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 font-black text-lg transition-all active:translate-x-1 active:translate-y-1 active:shadow-none text-slate-900"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 7.7 1 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Login with Google
    </button>

    <div class="relative flex items-center py-4">
      <div class="flex-grow border-t-[3px] border-black"></div>
      <span
        class="flex-shrink mx-4 w-10 h-10 rounded-full bg-[#FFCC00] border-[3px] border-black flex items-center justify-center font-black text-sm"
        >OR</span
      >
      <div class="flex-grow border-t-[3px] border-black"></div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="space-y-2">
        <label class="font-black uppercase text-sm tracking-wider text-slate-900"
          >Email Address</label
        >
        <input
          v-model="email"
          type="email"
          placeholder="name@company.com"
          class="w-full bg-white border-[3px] border-black p-4 font-bold placeholder:text-gray-400 focus:outline-none transition-colors text-slate-900"
        />
      </div>

      <div class="space-y-2">
        <div class="flex justify-between">
          <label class="font-black uppercase text-sm tracking-wider text-slate-900">Password</label>
          <a
            href="#"
            @click.prevent="$emit('forgot-password')"
            class="text-sm font-bold underline text-slate-900"
            >Forgot?</a
          >
        </div>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          class="w-full bg-white border-[3px] border-black p-4 font-bold placeholder:text-gray-400 focus:outline-none transition-colors text-slate-900"
        />
      </div>

      <button
        type="submit"
        class="w-full bg-[#FFCC00] border-[4px] border-black p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] font-[900] text-2xl uppercase tracking-tighter transition-all active:translate-x-1 active:translate-y-1 active:shadow-none mt-6 text-slate-900"
      >
        Sign In
      </button>
    </form>

    <p class="text-center font-bold text-slate-900">
      New here?
      <a
        href="#"
        @click.prevent="$emit('signup')"
        class="font-black underline decoration-2 underline-offset-4 text-slate-900"
        >Create account</a
      >
    </p>
  </div>
</template>
