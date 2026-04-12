/**
 * Formats an area value using Belgian locale conventions.
 * Values ≥ 1000 are rounded to the nearest integer; smaller values keep one decimal.
 */
export function formatArea(m2: number): string {
  const rounded = m2 >= 1000 ? Math.round(m2) : Math.round(m2 * 10) / 10
  return rounded.toLocaleString('nl-BE')
}

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
