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
