import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    // Auth Routes
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/pages/LoginPage.vue'),
        meta: {
            title: 'Login - Gelitik',
            requiresAuth: false,
            guestOnly: true
        }
    },

    // Dashboard Routes
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: {
            title: 'Overview - Gelitik',
            requiresAuth: false // Bypassed for dev
        }
    },
    {
        path: '/dashboard/instagram',
        name: 'instagram-analytics',
        component: () => import('@/pages/InstagramAnalyticsPage.vue'),
        meta: {
            title: 'Instagram Insights - Gelitik',
            requiresAuth: true
        }
    },
    {
        path: '/dashboard/tiktok',
        name: 'tiktok-analytics',
        component: () => import('@/pages/TikTokAnalyticsPage.vue'),
        meta: {
            title: 'TikTok Analytics - Gelitik',
            requiresAuth: true
        }
    },
    {
        path: '/schedule',
        name: 'schedule',
        component: () => import('@/pages/SchedulePage.vue'),
        meta: { title: 'Schedule - Gelitik', requiresAuth: true }
    },

    // Future routes (placeholders)
    {
        path: '/inbox',
        name: 'inbox',
        component: () => import('@/pages/DashboardPage.vue'), // Placeholder
        meta: { title: 'Inbox - Gelitik', requiresAuth: true }
    },
    {
        path: '/audience',
        name: 'audience',
        component: () => import('@/pages/DashboardPage.vue'), // Placeholder
        meta: { title: 'Audience - Gelitik', requiresAuth: true }
    },
    {
        path: '/connections',
        name: 'connections',
        component: () => import('@/pages/ConnectionsPage.vue'),
        meta: { title: 'Connections - Gelitik', requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { title: 'Settings - Gelitik', requiresAuth: true }
    },
    
    // Legal Pages (Public)
    {
        path: '/terms',
        name: 'terms',
        component: () => import('@/pages/TermsOfServicePage.vue'),
        meta: { title: 'Terms of Service - Gelitik', requiresAuth: false }
    },
    {
        path: '/privacy',
        name: 'privacy',
        component: () => import('@/pages/PrivacyPolicyPage.vue'),
        meta: { title: 'Privacy Policy - Gelitik', requiresAuth: false }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

    // Update document title on route change
    router.beforeEach(async (to, _from, next) => {
      document.title = (to.meta.title as string) || 'Gelitik'
 
      const authStore = useAuthStore()
 
      // Handle Google OAuth callback (e.g. /login?token=xyz)
      if (to.path === '/login' && to.query.token) {
         const token = to.query.token as string
         localStorage.setItem('token', token)
         authStore.token = token
         await authStore.checkSession()
         return next('/dashboard')
      }
 
      // Handle platform connection success (e.g., ?connected=tiktok)
      if (to.query.connected === 'tiktok') {
         sessionStorage.setItem('connection-success', 'tiktok')
         return next('/dashboard/tiktok')
      }
 
      if (to.meta.requiresAuth && !authStore.isAuthenticated) {
         return next('/login')
      }
 
      if (to.meta.guestOnly && authStore.isAuthenticated) {
         return next('/dashboard')
      }
 
      next()
    })

export default router
