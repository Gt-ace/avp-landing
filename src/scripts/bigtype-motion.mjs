export function calculateBigtypeShift(
  lineCenter,
  viewportHeight,
  viewportWidth,
  speed
) {
  const progress = (lineCenter - viewportHeight / 2) / viewportHeight
  return Number((progress * speed * viewportWidth).toFixed(2))
}
