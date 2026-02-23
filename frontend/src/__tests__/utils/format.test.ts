import { describe, it, expect } from 'vitest'
import { formatNumber, formatCompactNumber, formatPercentage, formatDate } from '@/utils/format'

describe('format utils', () => {
  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000')
    })

    it('should handle decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
    })
  })

  describe('formatCompactNumber', () => {
    it('should format thousands with K', () => {
      expect(formatCompactNumber(1000)).toBe('1K')
      expect(formatCompactNumber(15000)).toBe('15K')
      expect(formatCompactNumber(999999)).toBe('1M')
    })

    it('should format millions with M', () => {
      expect(formatCompactNumber(1000000)).toBe('1M')
      expect(formatCompactNumber(2500000)).toBe('2.5M')
    })

    it('should handle small numbers', () => {
      expect(formatCompactNumber(500)).toBe('500')
      expect(formatCompactNumber(0)).toBe('0')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage with sign', () => {
      expect(formatPercentage(10.5)).toBe('+10.5%')
      expect(formatPercentage(-5.2)).toBe('-5.2%')
    })

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0%')
    })

    it('should handle large values', () => {
      expect(formatPercentage(100)).toBe('+100%')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const date = new Date('2026-01-15')
      expect(formatDate(date)).toContain('Jan')
    })

    it('should handle different date formats', () => {
      const date = new Date('2026-12-25')
      expect(formatDate(date)).toContain('Dec')
    })
  })
})
