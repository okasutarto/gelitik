import { ref, computed } from 'vue'
import type { Post } from '@/types/post'

export type { Post } from '@/types/post'

// Mock data generator
const generateMockPosts = (): Post[] => {
    const posts: Post[] = []
    const today = new Date()

    // Helper to add days
    const addDays = (days: number) => {
        const d = new Date(today)
        d.setDate(today.getDate() + days)
        return d
    }

    posts.push({
        id: '1',
        title: 'Summer Collection Launch',
        date: addDays(0), // Today
        platform: 'instagram',
        type: 'reel',
        status: 'scheduled',
        thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100&h=100&fit=crop'
    })

    posts.push({
        id: '2',
        title: 'Product Teaser',
        date: addDays(2),
        platform: 'tiktok',
        type: 'video',
        status: 'draft'
    })

    posts.push({
        id: '3',
        title: 'Industry Insights',
        date: addDays(-1),
        platform: 'linkedin',
        type: 'text',
        status: 'published'
    })

    posts.push({
        id: '4',
        title: 'Behind the Scenes',
        date: addDays(5),
        platform: 'instagram',
        type: 'carousel',
        status: 'scheduled',
        thumbnail: 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?w=100&h=100&fit=crop'
    })

    return posts
}

const scheduledPosts = ref<Post[]>(generateMockPosts())
const selectedDate = ref(new Date())

/**
 * Composable for managing schedule and posts
 */
export function useSchedule() {

    const getPostsByDate = (date: Date) => {
        return scheduledPosts.value.filter(post =>
            post.date.toDateString() === date.toDateString()
        )
    }

    const addPost = (post: Omit<Post, 'id'>) => {
        const newPost: Post = {
            ...post,
            id: Math.random().toString(36).substr(2, 9)
        }
        scheduledPosts.value.push(newPost)
    }

    const updatePostDate = (postId: string, newDate: Date) => {
        const post = scheduledPosts.value.find(p => p.id === postId)
        if (post) {
            post.date = newDate
            post.status = 'scheduled' // Update status if moved
        }
    }

    const currentMonthPosts = computed(() => {
        const year = selectedDate.value.getFullYear()
        const month = selectedDate.value.getMonth()
        return scheduledPosts.value.filter(post =>
            post.date.getFullYear() === year && post.date.getMonth() === month
        )
    })

    // Reset state - call this on logout
    const resetSchedule = () => {
        scheduledPosts.value = generateMockPosts()
        selectedDate.value = new Date()
    }

    return {
        scheduledPosts,
        selectedDate,
        getPostsByDate,
        addPost,
        updatePostDate,
        currentMonthPosts,
        resetSchedule
    }
}
