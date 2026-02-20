import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore, type Notification } from '@/stores/notifications'
import api from '@/services/api'

const POLL_INTERVAL = 30000 // 30 seconds

export function useNotifications() {
    const store = useNotificationsStore()
    const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)
    const previousAccounts = ref<string[]>([])

    // Fetch data from existing endpoints and generate notifications
    const fetchAndGenerateNotifications = async () => {
        try {
            // Check connected accounts
            const { data: accountsData } = await api.get('/api/accounts')
            const accounts = accountsData.data || []

            // Detect new connections
            const currentAccountIds = accounts.map((a: { platform: string; accountId: string }) => `${a.platform}-${a.accountId}`)

            accounts.forEach((account: { platform: string; displayName: string; accountId: string }) => {
                const accountKey = `${account.platform}-${account.accountId}`

                // New account connected
                if (!previousAccounts.value.includes(accountKey)) {
                    store.addNotification({
                        type: 'account_connected',
                        title: 'Account Connected',
                        message: `${account.displayName} has been connected successfully`,
                        platform: account.platform as 'tiktok' | 'instagram' | 'instagram-graph',
                        actionUrl: '/connections'
                    })
                }
            })

            previousAccounts.value = currentAccountIds
        } catch (error) {
            console.error('[Notifications] Failed to fetch accounts:', error)
        }
    }

    const startPolling = () => {
        // Initial fetch
        fetchAndGenerateNotifications()

        // Set up interval
        pollInterval.value = setInterval(() => {
            fetchAndGenerateNotifications()
        }, POLL_INTERVAL)
    }

    const stopPolling = () => {
        if (pollInterval.value) {
            clearInterval(pollInterval.value)
            pollInterval.value = null
        }
    }

    // Manual refresh
    const refresh = () => {
        fetchAndGenerateNotifications()
    }

    // Add a notification programmatically (for toast-driven events)
    const notify = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        store.addNotification(notification)
    }

    onMounted(() => {
        startPolling()
    })

    onUnmounted(() => {
        stopPolling()
    })

    return {
        store,
        startPolling,
        stopPolling,
        refresh,
        notify
    }
}
