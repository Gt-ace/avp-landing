import { describe, expect, it } from 'vitest'
import { getStackFrameStyle } from '../../src/components/ui/skiper-ui/skiper17'

describe('Skiper17 stack frame sizing helper', () => {
  it('returns the viewport-constrained 4:3 frame style when stack mode is enabled', () => {
    expect(getStackFrameStyle(true)).toEqual({
      width: 'min(64rem, 100%, calc((100dvh - 10rem) * 4 / 3))',
    })
  })

  it('returns no stack frame style in list mode', () => {
    expect(getStackFrameStyle(false)).toBeUndefined()
  })
})
