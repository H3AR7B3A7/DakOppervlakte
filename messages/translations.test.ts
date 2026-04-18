import en from './en.json'
import fr from './fr.json'
import nl from './nl.json'

type TranslationObject = { [key: string]: string | TranslationObject }

function collectKeys(obj: TranslationObject, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? collectKeys(value as TranslationObject, fullKey)
      : [fullKey]
  })
}

const languages: Record<string, TranslationObject> = { en, fr, nl }

const allKeys = [...new Set(Object.values(languages).flatMap((l) => collectKeys(l)))]

describe('Translations', () => {
  for (const [lang, translations] of Object.entries(languages)) {
    it(`${lang}.json should contain all keys`, () => {
      const keys = new Set(collectKeys(translations))
      const missing = allKeys.filter((k) => !keys.has(k))
      expect(
        missing,
        `${lang}.json is missing ${missing.length} key(s):\n${missing.join('\n')}`,
      ).toEqual([])
    })
  }
})
