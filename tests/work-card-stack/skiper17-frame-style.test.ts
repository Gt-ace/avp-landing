import { describe, expect, it } from 'vitest'
import { getStackScrollDistance } from '../../src/components/ui/skiper-ui/skiper17'

// Frame sizing used to live in a `getStackFrameStyle` inline style, which can
// only ever describe one viewport. It is `.work-stack-frame` in global.css now,
// so the ratio can flip to portrait under 640px; the CSS is asserted from
// tests/work-card-stack.test.mjs instead.
describe('Skiper17 stack scroll distance', () => {
  it('uses one measured scene height per card transition', () => {
    expect(getStackScrollDistance(844, 3)).toBe(1688)
    expect(getStackScrollDistance(900, 3)).toBe(1800)
    expect(getStackScrollDistance(900, 1)).toBe(0)
    expect(getStackScrollDistance(-1, 3)).toBe(0)
  })

  it('scales the distance by the factor the caller passes', () => {
    // A full screen per card is a lot of thumb on a phone, so the narrow
    // viewport pays 0.7 of a screen instead.
    expect(getStackScrollDistance(844, 3, 0.7)).toBeCloseTo(1181.6)
    expect(getStackScrollDistance(844, 3, 1)).toBe(1688)
  })

  it('refuses a negative factor rather than scrolling backwards', () => {
    expect(getStackScrollDistance(844, 3, -1)).toBe(0)
  })
})
