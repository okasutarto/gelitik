<script setup lang="ts">
import AuthLayout from '@/layouts/AuthLayout.vue'
import LoginTestimonial from '@/components/auth/LoginTestimonial.vue'
import LoginForm from '@/components/auth/LoginForm.vue'

// Testimonial data (can be fetched from API in production)
const testimonial = {
  quote: 'Managing social media has never been this fluid. Gelitik transformed our workflow overnight.',
  authorName: 'Sarah Jenkins',
  authorRole: 'Marketing Director at TechFlow',
  authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  rating: 5
}

// Event handlers
const handleLogin = (data: { email: string; password: string; rememberMe: boolean }) => {
  console.log('Login attempt:', data)
  // TODO: Integrate with auth API
}

const handleGoogleLogin = () => {
  console.log('Google login clicked')
  // TODO: Initiate Google OAuth flow
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
