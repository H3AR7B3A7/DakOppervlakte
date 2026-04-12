import { describe, it, expect } from 'vitest'
import { formatArea, generatePolygonColor, normalizeHeading } from '@/lib/utils'

describe('formatArea', () => {
  it('formats small values with one decimal using Belgian locale', () => {
    expect(formatArea(12.3)).toBe('12,3')
  })

  it('rounds values below 1000 to one decimal place', () => {
    expect(formatArea(45.678)).toBe('45,7')
  })

  it('rounds values of 1000 or above to the nearest integer', () => {
    expect(formatArea(1000)).toBe('1.000')
    expect(formatArea(2345.6)).toBe('2.346')
  })

  it('formats zero', () => {
    expect(formatArea(0)).toBe('0')
  })
})

describe('generatePolygonColor', () => {
  it('returns a valid hsl() string', () => {
    const color = generatePolygonColor()
    expect(color).toMatch(/^hsl\(\d+, 70%, 60%\)$/)
  })

  it('generates hues in the 40–319 range to avoid reds and pinks', () => {
    for (let i = 0; i < 100; i++) {
      const hue = parseInt(generatePolygonColor().match(/hsl\((\d+)/)![1])
      expect(hue).toBeGreaterThanOrEqual(40)
      expect(hue).toBeLessThan(320)
    }
  })
})

describe('normalizeHeading', () => {
  it('keeps in-range values unchanged', () => {
    expect(normalizeHeading(0)).toBe(0)
    expect(normalizeHeading(180)).toBe(180)
    expect(normalizeHeading(359)).toBe(359)
  })

  it('wraps 360 back to 0', () => {
    expect(normalizeHeading(360)).toBe(0)
  })

  it('wraps values above 360', () => {
    expect(normalizeHeading(370)).toBe(10)
  })

  it('wraps negative values', () => {
    expect(normalizeHeading(-30)).toBe(330)
    expect(normalizeHeading(-360)).toBe(0)
  })
})
