import { describe, it, expect } from 'vitest'
import { formatNumber } from '@/utils/format'

describe('format utils', () => {
  describe('formatNumber', () => {
    it('should format numbers with K suffix', () => {
      expect(formatNumber(1000)).toBe('1K')
      expect(formatNumber(15000)).toBe('15K')
    })

    it('should format millions with M', () => {
      expect(formatNumber(1000000)).toBe('1M')
      expect(formatNumber(2500000)).toBe('2.5M')
      expect(formatNumber(10000000)).toBe('10M')
    })

    it('should format billions with B', () => {
      expect(formatNumber(1000000000)).toBe('1B')
      expect(formatNumber(2500000000)).toBe('2.5B')
    })

    it('should handle small numbers', () => {
      expect(formatNumber(500)).toBe('500')
      expect(formatNumber(0)).toBe('0')
    })

    it('should handle numbers exactly at threshold', () => {
      expect(formatNumber(1000)).toBe('1K')
      expect(formatNumber(1000000)).toBe('1M')
      expect(formatNumber(1000000000)).toBe('1B')
    })
  })
})
