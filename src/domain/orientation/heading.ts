/**
 * Clamps a heading value to [0, 360).
 */
export function normalizeHeading(degrees: number): number {
  return ((degrees % 360) + 360) % 360
}

/**
 * Returns true when two headings describe the same cardinal direction
 * after normalising both into [0, 360). Wraps negative and out-of-range
 * inputs the same way `normalizeHeading` does.
 */
export function headingsMatch(a: number, b: number): boolean {
  return normalizeHeading(a) === normalizeHeading(b)
}
