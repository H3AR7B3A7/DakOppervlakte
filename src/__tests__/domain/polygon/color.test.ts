import { generatePolygonColor } from '@/domain/polygon/color'

describe('generatePolygonColor', () => {
  it('returns a valid hsl() string', () => {
    const color = generatePolygonColor()
    expect(color).toMatch(/^hsl\(\d+, 70%, 60%\)$/)
  })

  it('generates hues in the 40–319 range to avoid reds and pinks', () => {
    for (let i = 0; i < 100; i++) {
      const match = generatePolygonColor().match(/hsl\((\d+)/)
      if (!match) throw new Error('generatePolygonColor did not return an hsl() string')
      const hue = parseInt(match[1], 10)
      expect(hue).toBeGreaterThanOrEqual(40)
      expect(hue).toBeLessThan(320)
    }
  })
})
