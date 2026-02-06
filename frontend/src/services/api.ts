import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    withCredentials: true
})

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use(
    (response) => {
        console.log('[API Response]', response.config.url, response.status, response.data);
        return response;
    },
    (error) => {
        console.error('[API Error]', error.config?.url, error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api
