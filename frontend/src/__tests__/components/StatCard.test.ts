import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { markRaw } from 'vue'
import StatCard from '@/components/dashboard/cards/StatCard.vue'
import { h } from 'vue'

describe('StatCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders title correctly', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Total Followers',
        value: 1000,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('Total Followers')
  })

  it('displays formatted value', async () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Total Views',
        value: 1500000,
        loading: false
      }
    })

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 900))

    // Should format number (1.5M)
    const text = wrapper.text()
    expect(text).toContain('1.5M')
  })

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Followers',
        value: 0,
        loading: true
      }
    })

    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
  })

  it('displays delta when provided', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Likes',
        value: 5000,
        delta: 12.5,
        loading: false
      }
    })

    // Delta is shown with ▲ symbol and number
    expect(wrapper.text()).toContain('▲')
    expect(wrapper.text()).toContain('12.5')
  })

  it('shows negative delta in red', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Views',
        value: 1000,
        delta: -5.2,
        loading: false
      }
    })

    const deltaElement = wrapper.find('.text-red-600')
    expect(deltaElement.exists()).toBe(true)
    expect(deltaElement.text()).toContain('-5.2')
  })

  it('shows positive delta in green', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Followers',
        value: 2000,
        delta: 10.3,
        loading: false
      }
    })

    const deltaElement = wrapper.find('.text-emerald-600')
    expect(deltaElement.exists()).toBe(true)
  })

  it('displays icon when provided as component', () => {
    const MockIcon = markRaw({
      render: () => h('svg', { class: 'mock-icon' })
    })

    const wrapper = mount(StatCard, {
      props: {
        title: 'Engagement',
        value: 500,
        icon: MockIcon,
        loading: false
      }
    })

    // Should render the icon component
    expect(wrapper.findComponent(MockIcon).exists()).toBe(true)
  })
})
