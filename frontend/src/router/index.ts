import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
    }
    // Future routes:
    // { path: '/signup', name: 'signup', component: () => import('@/pages/SignupPage.vue') },
    // { path: '/forgot-password', name: 'forgot-password', component: () => import('@/pages/ForgotPasswordPage.vue') },
    // { path: '/dashboard', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue'), meta: { requiresAuth: true } },
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
