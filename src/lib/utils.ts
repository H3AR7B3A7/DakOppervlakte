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
