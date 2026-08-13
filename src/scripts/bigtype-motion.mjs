/**
 * Horizontal drift for one big type line, fitted to the empty space beside it.
 *
 * The raw parallax is proportional to the viewport width, so on a narrow screen
 * it asks for far more travel than the line has room for. Hard-clamping the
 * result would keep the glyphs on screen but park the line against the edge for
 * most of the scroll, so the amplitude is scaled down to the available slack
 * instead: the line still drifts smoothly across the whole scroll range, it just
 * uses exactly the room it has. A line that fills the viewport holds still.
 *
 * `lineWidth` defaults to the full viewport, so an unmeasured line holds still
 * rather than drifting blind.
 */
export function calculateBigtypeShift(
  lineCenter,
  viewportHeight,
  viewportWidth,
  speed,
  lineWidth = viewportWidth
) {
  const progress = (lineCenter - viewportHeight / 2) / viewportHeight
  const slack = Math.max(0, (viewportWidth - lineWidth) / 2)
  const amplitude = Math.min(Math.abs(speed) * viewportWidth, slack)
  const drift = progress * amplitude * Math.sign(speed)

  return Number(Math.max(-slack, Math.min(slack, drift)).toFixed(2))
}
