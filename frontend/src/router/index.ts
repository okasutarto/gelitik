import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

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
            requiresAuth: false
        }
    },

    // Dashboard Routes
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: {
            title: 'Overview - Gelitik',
            requiresAuth: true
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

    // Future routes (placeholders)
    {
        path: '/schedule',
        name: 'schedule',
        component: () => import('@/pages/SchedulePage.vue'),
        meta: { title: 'Schedule - Gelitik', requiresAuth: true }
    },
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
        component: () => import('@/pages/DashboardPage.vue'), // Placeholder
        meta: { title: 'Connections - Gelitik', requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'settings',
        component: () => import('@/pages/DashboardPage.vue'), // Placeholder
        meta: { title: 'Settings - Gelitik', requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Update document title on route change
router.beforeEach((to, _from, next) => {
    document.title = (to.meta.title as string) || 'Gelitik'
    next()
})

export default router
