import { describe, expect, it } from 'vitest'
import { workStackMode } from '../../src/components/work-card-stack/work-stack-policy'

describe('work stack motion policy', () => {
  it('uses the stable list below 768px', () => {
    expect(workStackMode(320, false)).toBe('list')
    expect(workStackMode(767, false)).toBe('list')
  })

  it('allows the stack at and above 768px', () => {
    expect(workStackMode(768, false)).toBe('stack')
    expect(workStackMode(1440, false)).toBe('stack')
  })

  it('always uses the stable list for reduced motion', () => {
    expect(workStackMode(768, true)).toBe('list')
    expect(workStackMode(1440, true)).toBe('list')
  })
})
