import { generatePolygonColor, normalizeHeading } from '@/lib/utils'

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
