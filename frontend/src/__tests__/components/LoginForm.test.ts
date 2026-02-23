import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginForm from '@/components/auth/LoginForm.vue'

describe('LoginForm', () => {
  let emit: any

  beforeEach(() => {
    setActivePinia(createPinia())
    emit = vi.fn()
  })

  // ==================== LOGIN TESTS ====================

  describe('FE-LOGIN-01: Email Input', () => {
    it('should accept valid email format', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const emailInput = wrapper.find('input[type="email"]')
      await emailInput.setValue('test@example.com')

      expect(emailInput.element.value).toBe('test@example.com')
    })

    it('should have email type for browser validation', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.exists()).toBe(true)
    })
  })

  describe('FE-LOGIN-02: Email Validation', () => {
    it('should block invalid email format with HTML5 validation', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const emailInput = wrapper.find('input[type="email"]')
      expect(emailInput.attributes('type')).toBe('email')
      expect(emailInput.attributes('required')).toBeDefined()
    })
  })

  describe('FE-LOGIN-03: Password Input', () => {
    it('should accept password input', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const passwordInput = wrapper.find('input[type="password"]')
      await passwordInput.setValue('password123')

      expect(passwordInput.element.value).toBe('password123')
    })

    it('should mask password by default', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const passwordInput = wrapper.find('input[type="password"]')
      expect(passwordInput.exists()).toBe(true)
    })
  })

  describe('FE-LOGIN-04: Password Toggle', () => {
    it('should show password when toggle is clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
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
        props: { apiError: null },
        emit
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
        props: { apiError: null },
        emit
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
        props: { apiError: null },
        emit
      })

      const googleButton = wrapper.find('button:contains("Login with Google")')
      expect(googleButton.exists()).toBe(true)
    })

    it('should emit google-login event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const googleButton = wrapper.findAll('button').find(b => b.text().includes('Login with Google'))
      await googleButton?.trigger('click')

      expect(emit).toHaveBeenCalledWith('google-login')
    })
  })

  describe('FE-LOGIN-06: Form Submit', () => {
    it('should emit submit event with form data', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      // Fill form
      await wrapper.find('input[type="email"]').setValue('test@example.com')
      await wrapper.find('input[type="password"]').setValue('password123')

      // Submit
      await wrapper.find('form').trigger('submit.prevent')

      expect(emit).toHaveBeenCalledWith('submit', {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      })
    })

    it('should not emit submit with empty email', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      // Only fill password
      await wrapper.find('input[type="password"]').setValue('password123')

      // Try to submit
      await wrapper.find('form').trigger('submit.prevent')

      // Should not emit submit (HTML5 validation should block)
      expect(emit).not.toHaveBeenCalledWith('submit')
    })
  })

  describe('FE-LOGIN-07: Error Display', () => {
    it('should display error message when apiError is passed', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: 'Invalid credentials' },
        emit
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(true)
      expect(errorBox.text()).toContain('Invalid credentials')
    })

    it('should not display error when apiError is null', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(false)
    })

    it('should not display error when apiError is empty string', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: '' },
        emit
      })

      const errorBox = wrapper.find('.bg-red-100')
      expect(errorBox.exists()).toBe(false)
    })
  })

  describe('FE-LOGIN-08: Forgot Password Link', () => {
    it('should have forgot password link', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const forgotLink = wrapper.find('a:contains("Forgot?")')
      expect(forgotLink.exists()).toBe(true)
    })

    it('should emit forgot-password event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const forgotLink = wrapper.find('a:contains("Forgot?")')
      await forgotLink.trigger('click')

      expect(emit).toHaveBeenCalledWith('forgot-password')
    })
  })

  describe('FE-LOGIN-09: Signup Link', () => {
    it('should have create account link', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const signupLink = wrapper.find('a:contains("Create account")')
      expect(signupLink.exists()).toBe(true)
    })

    it('should emit signup event when clicked', async () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const signupLink = wrapper.find('a:contains("Create account")')
      await signupLink.trigger('click')

      expect(emit).toHaveBeenCalledWith('signup')
    })
  })

  // ==================== UI TESTS ====================

  describe('UI Rendering', () => {
    it('should render all form fields', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      expect(wrapper.find('input[type="email"]').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('should have correct submit button text', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.text()).toContain('Sign In')
    })

    it('should have email and password labels', () => {
      const wrapper = mount(LoginForm, {
        props: { apiError: null },
        emit
      })

      expect(wrapper.text()).toContain('Email Address')
      expect(wrapper.text()).toContain('Password')
    })
  })
})
