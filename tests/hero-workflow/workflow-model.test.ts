import { describe, expect, it } from 'vitest'
import {
  artifacts,
  connections,
  layoutModeForWidth,
} from '../../src/components/hero-workflow/workflow-model'

describe('Tuesday Board model', () => {
  it('contains the five approved provider-neutral artifacts', () => {
    expect(artifacts.map(({ id, title }) => [id, title])).toEqual([
      ['email', 'Email'],
      ['sheet', 'Spreadsheet'],
      ['approval', 'Approval'],
      ['reminder', 'Reminder'],
      ['system', 'System handoff'],
    ])
  })

  it('contains the approved diagnosis annotations', () => {
    expect(artifacts.flatMap((item) => item.annotation ?? [])).toEqual([
      'Missing information',
      'Updated in two places',
      'Waiting for approval',
      'Copied manually',
    ])
  })

  it('uses only custom icon ids', () => {
    expect(artifacts.map((item) => item.icon)).toEqual([
      'mail', 'sheet', 'approval', 'reminder', 'accounting',
    ])
  })

  it('references valid artifact ids in every connection', () => {
    const ids = new Set(artifacts.map((item) => item.id))
    for (const edge of connections) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }
  })

  it('selects mobile, tablet, and wide layouts at fixed boundaries', () => {
    expect(layoutModeForWidth(479)).toBe('mobile')
    expect(layoutModeForWidth(480)).toBe('tablet')
    expect(layoutModeForWidth(899)).toBe('tablet')
    expect(layoutModeForWidth(900)).toBe('wide')
  })
})
