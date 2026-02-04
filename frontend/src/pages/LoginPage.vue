<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginTestimonial from '@/components/auth/LoginTestimonial.vue'
import LoginForm from '@/components/auth/LoginForm.vue'

const router = useRouter()
const authStore = useAuthStore()

// Testimonial data (can be fetched from API in production)
const testimonial = {
  quote: 'Managing social media has never been this fluid. Gelitik transformed our workflow overnight.',
  authorName: 'Sarah Jenkins',
  authorRole: 'Marketing Director at TechFlow',
  authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  rating: 5
}

// Event handlers
const handleLogin = async (data: { email: string; password: string; rememberMe: boolean }) => {
  // Bypass backend auth for now
  const mockUser = {
    id: 'dev_user',
    email: data.email,
    name: 'Dev User',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gelitik'
  }
  
  localStorage.setItem('token', 'mock-token-123')
  localStorage.setItem('user', JSON.stringify(mockUser))
  authStore.setAuth(mockUser, 'mock-token-123')
  
  router.push('/dashboard')
}

const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`
}

const handleForgotPassword = () => {
  console.log('Forgot password clicked')
  // TODO: Navigate to forgot password page
}

const handleSignup = () => {
  console.log('Signup clicked')
  // TODO: Navigate to signup page
}
</script>

<template>
  <AuthLayout>
    <template #left>
      <LoginTestimonial :testimonial="testimonial" />
    </template>
    
    <template #right>
      <LoginForm
        @submit="handleLogin"
        @google-login="handleGoogleLogin"
        @forgot-password="handleForgotPassword"
        @signup="handleSignup"
      />
    </template>
  </AuthLayout>
</template>
