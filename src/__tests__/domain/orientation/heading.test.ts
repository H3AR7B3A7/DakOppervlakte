import { headingsMatch, normalizeHeading } from '@/domain/orientation/heading'

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

describe('headingsMatch', () => {
  it('is true for identical headings', () => {
    expect(headingsMatch(90, 90)).toBe(true)
  })

  it('is false for different cardinal directions', () => {
    expect(headingsMatch(0, 90)).toBe(false)
  })

  it('treats 360 and 0 as the same heading', () => {
    expect(headingsMatch(0, 360)).toBe(true)
  })

  it('treats negative wraps as equivalent', () => {
    expect(headingsMatch(-30, 330)).toBe(true)
  })
})
