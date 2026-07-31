export type WorkStackMode = 'stack' | 'list'

export function workStackMode(
  width: number,
  reducedMotion: boolean,
): WorkStackMode {
  return width >= 768 && !reducedMotion ? 'stack' : 'list'
}
