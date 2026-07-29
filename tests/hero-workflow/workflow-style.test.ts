import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workflowSource = readFileSync(
  resolve(process.cwd(), 'src/components/HeroWorkflow.astro'),
  'utf8',
)
const pageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/index.astro'),
  'utf8',
)

describe('Tuesday Board structural styling', () => {
  it('attaches the cobalt transformation accent to the resolved system', () => {
    expect(workflowSource).not.toContain('.workflow-scene::before')
    expect(workflowSource).toContain(
      ".workflow-artifact[data-artifact='system']::before",
    )
    expect(workflowSource).toContain(
      'transform: scaleX(var(--cobalt-progress));',
    )
  })

  it('provides enough sticky runway on desktop and mobile', () => {
    expect(pageSource).toContain('min-height: 180dvh;')
    expect(pageSource).toContain('min-height: 190dvh;')
  })

  it('keeps the wide resolved card inside its half of the hero', () => {
    expect(workflowSource).toContain('width: min(46rem, 50vw);')
  })
})
