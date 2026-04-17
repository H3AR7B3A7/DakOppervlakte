/**
 * Generates a visually distinct HSL colour for polygon fills.
 * Avoids reds/pinks by sampling hues 40–320.
 */
export function generatePolygonColor(): string {
  return `hsl(${Math.floor(Math.random() * 280 + 40)}, 70%, 60%)`
}

/**
 * Clamps a heading value to [0, 360).
 */
export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

/**
 * Locale-aware distance formatting. Emits the meter unit in a form
 * appropriate for the given BCP-47 locale (decimal separator, unit spacing).
 * Short distances keep one fraction digit; 10 m and up are rounded to the metre.
 */
export function formatDistance(meters: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'meter',
    unitDisplay: 'short',
    maximumFractionDigits: meters < 10 ? 1 : 0,
  }).format(meters)
}
