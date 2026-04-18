import { roundArea } from '@/domain/polygon/area'

describe('roundArea', () => {
  it('rounds to one decimal', () => {
    expect(roundArea(12.345)).toBe(12.3)
    expect(roundArea(12.35)).toBe(12.4)
  })

  it('returns an integer when the input is already whole', () => {
    expect(roundArea(100)).toBe(100)
  })

  it('rounds up on .x5', () => {
    expect(roundArea(0.15)).toBe(0.2)
  })

  it('handles zero', () => {
    expect(roundArea(0)).toBe(0)
  })

  it('handles very small values by rounding to 0.1 precision', () => {
    expect(roundArea(0.04)).toBe(0)
    expect(roundArea(0.06)).toBe(0.1)
  })
})
