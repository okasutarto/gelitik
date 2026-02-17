import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

interface User {
    id: string
    email: string
    name: string
    avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
    const token = ref<string | null>(localStorage.getItem('token'))
    const isAuthenticated = computed(() => !!token.value)

    const setAuth = (newUser: User, newToken: string) => {
        user.value = newUser
        token.value = newToken
        localStorage.setItem('user', JSON.stringify(newUser))
        localStorage.setItem('token', newToken)
    }

    const login = async (email: string, password: string) => {
        const { data } = await api.post('/auth/login', { email, password })
        setAuth(data.user, data.token)
        return true
    }

    const register = async (email: string, password: string, name: string) => {
        const { data } = await api.post('/auth/register', { email, password, name })
        setAuth(data.user, data.token)
        return true
    }

    const logout = () => {
        user.value = null
        token.value = null
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        window.location.href = '/login'
    }

    const checkSession = async () => {
        if (!token.value) return false

        try {
            const { data } = await api.get('/auth/me')
            user.value = data
            localStorage.setItem('user', JSON.stringify(data))
            return true
        } catch (error) {
            logout()
            return false
        }
    }

    return {
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        checkSession,
        setAuth
    }
})
