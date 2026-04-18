import { formatDistance } from '@/domain/geo/distance'

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
