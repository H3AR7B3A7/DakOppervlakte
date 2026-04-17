import { formatDistance, generatePolygonColor, normalizeHeading } from '@/lib/utils'

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

describe('formatDistance', () => {
  it('uses the locale-appropriate decimal separator', () => {
    expect(formatDistance(3.5, 'nl-BE')).toMatch(/3,5/)
    expect(formatDistance(3.5, 'en-US')).toMatch(/3\.5/)
  })

  it('includes the metre unit symbol', () => {
    expect(formatDistance(3.5, 'en-US')).toMatch(/m\b/)
  })

  it('shows one fraction digit below 10 m', () => {
    expect(formatDistance(2.37, 'en-US')).toMatch(/2\.4/)
  })

  it('rounds to whole metres at 10 m and above', () => {
    const formatted = formatDistance(47.6, 'en-US')
    expect(formatted).toMatch(/48/)
    expect(formatted).not.toMatch(/\./)
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
