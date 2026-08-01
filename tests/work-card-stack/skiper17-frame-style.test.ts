import { describe, expect, it } from 'vitest'
import {
  getStackFrameStyle,
  getStackScrollDistance,
} from '../../src/components/ui/skiper-ui/skiper17'

describe('Skiper17 responsive stack geometry', () => {
  it('constrains the 4:3 frame with a stable viewport unit', () => {
    expect(getStackFrameStyle(true)).toEqual({
      width: 'min(64rem, 100%, calc((100svh - 10rem) * 4 / 3))',
    })
  })

  it('returns no frame override before client enhancement', () => {
    expect(getStackFrameStyle(false)).toBeUndefined()
  })

  it('uses one measured scene height per card transition', () => {
    expect(getStackScrollDistance(844, 3)).toBe(1688)
    expect(getStackScrollDistance(900, 3)).toBe(1800)
    expect(getStackScrollDistance(900, 1)).toBe(0)
    expect(getStackScrollDistance(-1, 3)).toBe(0)
  })
})
