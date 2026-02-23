import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginForm from '@/components/auth/LoginForm.vue'

describe('LoginForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ==================== LOGIN TESTS ====================

  describe('FE-LOGIN-01: Email Input', () => {
    it('should accept valid email format', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('test@example.com')

      expect(emailInput.element.value).toBe('test@example.com')
    })

    it('should have email type for browser validation', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.attributes('type')).toBe('email')
    })
  })

  describe('FE-LOGIN-02: Email Validation', () => {
    it('should block invalid email format with HTML5 validation', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.attributes('type')).toBe('email')
      expect(emailInput.attributes('required')).toBeDefined()
    })
  })

  describe('FE-LOGIN-03: Password Input', () => {
    it('should accept password input', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const passwordInput = wrapper.find('input[type="password"]')
      await passwordInput.setValue('password123')

      expect(passwordInput.element.value).toBe('password123')
    })

    it('should mask password by default', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })
  })

  describe('FE-LOGIN-04: Password Toggle', () => {
    it('should show password when toggle is clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      // Initially password should be masked
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)

      // Click the toggle button
      const toggleButton = wrapper.find('button[type="button"]')
      await toggleButton.trigger('click')

      // Now should show as text
      expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    })

    it('should hide password when toggle clicked again', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const toggleButton = wrapper.find('button[type="button"]')

      // First click - show
      await toggleButton.trigger('click')
      expect(wrapper.find('input[type="text"]').exists()).toBe(true)

      // Second click - hide
      await toggleButton.trigger('click')
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    })

    it('should toggle icon between visibility and visibility_off', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const toggleButton = wrapper.find('button[type="button"]')

      // Initially shows "visibility" (eye icon - password hidden)
      expect(wrapper.text()).toContain('visibility')

      await toggleButton.trigger('click')

      // After click shows "visibility_off" (password shown)
      expect(wrapper.text()).toContain('visibility_off')
    })
  })

  describe('FE-LOGIN-05: Google Login Button', () => {
    it('should have Google login button', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const buttons = wrapper.findAll('button')
      const googleButton = buttons.find(b => b.text().includes('Login with Google'))
      expect(googleButton?.exists()).toBe(true)
    })

    it('should emit google-login event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const buttons = wrapper.findAll('button')
      const googleButton = buttons.find(b => b.text().includes('Login with Google'))
      await googleButton?.trigger('click')

      expect(wrapper.emitted('google-login')).toBeTruthy()
    })
  })

  describe('FE-LOGIN-06: Form Submit', () => {
    it('should emit submit event with form data', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      // Fill form
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')

      // Submit
      await wrapper.find('form').trigger('submit.prevent')

      // Check emitted events
      expect(wrapper.emitted('submit')).toBeTruthy()
    })
  })

  describe('FE-LOGIN-07: Error Display', () => {
    it('should display error message when apiError is passed', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: 'Invalid credentials' }
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(true)
      expect(errorBox.text()).toContain('Invalid credentials')
    })

    it('should not display error when apiError is null', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(false)
    })

    it('should not display error when apiError is empty string', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: '' }
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(false)
    })
  })

  describe('FE-LOGIN-08: Forgot Password Link', () => {
    it('should have forgot password link', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const links = wrapper.findAll('a')
      const forgotLink = links.find(a => a.text().includes('Forgot'))
      expect(forgotLink?.exists()).toBe(true)
    })

    it('should emit forgot-password event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const links = wrapper.findAll('a')
      const forgotLink = links.find(a => a.text().includes('Forgot'))
      await forgotLink?.trigger('click')

      expect(wrapper.emitted('forgot-password')).toBeTruthy()
    })
  })

  describe('FE-LOGIN-09: Signup Link', () => {
    it('should have create account link', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const links = wrapper.findAll('a')
      const signupLink = links.find(a => a.text().includes('Create account'))
      expect(signupLink?.exists()).toBe(true)
    })

    it('should emit signup event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const links = wrapper.findAll('a')
      const signupLink = links.find(a => a.text().includes('Create account'))
      await signupLink?.trigger('click')

      expect(wrapper.emitted('signup')).toBeTruthy()
    })
  })

  // ==================== UI TESTS ====================

  describe('UI Rendering', () => {
    it('should render all form fields', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should have correct submit button text', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('Sign In')
    })

    it('should have email and password labels', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null }
      })

      expect(wrapper.text()).toContain('Email Address')
      expect(wrapper.text()).toContain('Password')
    })
  })
})
