/**
 * Rounds a polygon area (square metres) to a single decimal place.
 * Matches the existing behaviour from usePolygonDrawing's
 * `Math.round(areaSqM * 10) / 10`.
 */
export function roundArea(squareMeters: number): number {
  return Math.round(squareMeters * 10) / 10
}
