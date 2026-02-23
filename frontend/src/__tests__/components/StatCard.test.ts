import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import StatCard from '@/components/dashboard/StatCard.vue'

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

  it('displays formatted value', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Total Views',
        value: 1500000,
        loading: false
      }
    })

    // Should format number (1.5M or similar)
    expect(wrapper.text()).toContain('1,500,000')
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

    expect(wrapper.text()).toContain('+12.5%')
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

    const deltaElement = wrapper.find('.text-red-500')
    expect(deltaElement.exists()).toBe(true)
    expect(deltaElement.text()).toContain('-5.2%')
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

    const deltaElement = wrapper.find('.text-green-500')
    expect(deltaElement.exists()).toBe(true)
  })

  it('displays icon when provided', () => {
    const wrapper = mount(StatCard, {
      props: {
        title: 'Engagement',
        value: 500,
        icon: 'Heart',
        loading: false
      }
    })

    // Should render the icon component
    expect(wrapper.findComponent({ name: 'Heart' }).exists()).toBe(true)
  })
})
