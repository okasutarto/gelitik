<script setup lang="ts">
import { ref } from 'vue'
import { Mail, Lock } from 'lucide-vue-next'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppCheckbox from '@/components/ui/AppCheckbox.vue'
import AppDivider from '@/components/ui/AppDivider.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import SocialLoginButton from './SocialLoginButton.vue'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const emit = defineEmits<{
  (e: 'submit', data: LoginFormData): void
  (e: 'google-login'): void
  (e: 'forgot-password'): void
  (e: 'signup'): void
}>()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)

const handleSubmit = () => {
  isLoading.value = true
  
  // Emit form data
  emit('submit', {
    email: email.value,
    password: password.value,
    rememberMe: rememberMe.value
  })
  
  // Reset loading after simulated delay (in real app, this would be after API response)
  setTimeout(() => {
    isLoading.value = false
  }, 1500)
}

const handleGoogleLogin = () => {
  emit('google-login')
}

const handleForgotPassword = () => {
  emit('forgot-password')
}

const handleSignup = () => {
  emit('signup')
}
</script>

<template>
  <div
    class="w-full md:w-1/2 bg-background-light dark:bg-background-dark 
           flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto"
  >
    <div class="w-full max-w-md flex flex-col gap-6">
      <!-- Theme Toggle (Top Right) -->
      <div class="absolute top-4 right-4 md:top-6 md:right-6">
        <ThemeToggle />
      </div>

      <!-- Mobile Logo (Visible only on small screens) -->
      <div class="md:hidden flex justify-center mb-4">
        <AppLogo variant="dark" size="md" />
      </div>

      <!-- Header -->
      <div class="text-center space-y-2">
        <h1
          class="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight"
        >
          Welcome Back
        </h1>
        <p class="text-slate-500 dark:text-slate-400 text-base">
          Please enter your details to sign in.
        </p>
      </div>

      <!-- Google Login Button -->
      <SocialLoginButton provider="google" @click="handleGoogleLogin" />

      <!-- Divider -->
      <AppDivider />

      <!-- Form Fields -->
      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <!-- Email Input -->
        <div class="space-y-1">
          <label
            for="email"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Email
          </label>
          <AppInput
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            :icon="Mail"
            required
          />
        </div>

        <!-- Password Input -->
        <div class="space-y-1">
          <label
            for="password"
            class="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          <AppInput
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            :icon="Lock"
            required
          />
        </div>

        <!-- Options Row -->
        <div class="flex items-center justify-between mt-1">
          <AppCheckbox id="remember" v-model="rememberMe">
            Remember for 30 days
          </AppCheckbox>
          <a
            href="#"
            @click.prevent="handleForgotPassword"
            class="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <!-- Submit Button -->
        <AppButton
          type="submit"
          variant="primary"
          full-width
          :loading="isLoading"
          class="mt-4"
        >
          Sign in
        </AppButton>
      </form>

      <!-- Footer -->
      <p class="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
        Don't have an account?
        <a
          href="#"
          @click.prevent="handleSignup"
          class="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign up
        </a>
      </p>
    </div>
  </div>
</template>
