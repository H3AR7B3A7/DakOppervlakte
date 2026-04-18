import { polygonLabel } from '@/domain/polygon/label'

const fakeTranslator = (key: string, params?: Record<string, string | number>): string => {
  if (key === 'Polygon.manualLabel' && params?.index !== undefined) {
    return `Plane ${params.index}`
  }
  if (key === 'Polygon.autoLabel') {
    return 'Auto'
  }
  return key
}

describe('polygonLabel', () => {
  it('returns the auto label when kind is auto, ignoring index', () => {
    expect(polygonLabel('auto', 0, fakeTranslator)).toBe('Auto')
    expect(polygonLabel('auto', 5, fakeTranslator)).toBe('Auto')
  })

  it('returns the manual label with the index substituted when kind is manual', () => {
    expect(polygonLabel('manual', 1, fakeTranslator)).toBe('Plane 1')
    expect(polygonLabel('manual', 12, fakeTranslator)).toBe('Plane 12')
  })

  it('calls the translator with the correct key and params for manual', () => {
    const calls: Array<[string, Record<string, string | number> | undefined]> = []
    const spy = (key: string, params?: Record<string, string | number>) => {
      calls.push([key, params])
      return 'ignored'
    }
    polygonLabel('manual', 3, spy)
    expect(calls).toEqual([['Polygon.manualLabel', { index: 3 }]])
  })

  it('calls the translator with only the key for auto (no params)', () => {
    const calls: Array<[string, Record<string, string | number> | undefined]> = []
    const spy = (key: string, params?: Record<string, string | number>) => {
      calls.push([key, params])
      return 'ignored'
    }
    polygonLabel('auto', 3, spy)
    expect(calls).toEqual([['Polygon.autoLabel', undefined]])
  })
})
