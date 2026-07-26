import { describe, expect, it } from 'vitest'
import {
  connections,
  fragments,
  layoutModeForWidth,
} from '../../src/components/hero-workflow/workflow-model'

describe('workflow model', () => {
  it('contains the approved eight fragments', () => {
    expect(fragments).toHaveLength(8)
    expect(fragments.map((item) => item.messyLabel)).toEqual([
      'Email request',
      'Missing details',
      'Spreadsheet',
      'Copy/paste',
      'Approval?',
      'Reminder',
      'Accounting system',
      'Done',
    ])
  })

  it('resolves to the approved five-step client workflow', () => {
    expect(
      fragments
        .filter((item) => item.resolved.wide.opacity === 1)
        .sort((a, b) => a.resolved.wide.x - b.resolved.wide.x)
        .map((item) => item.resolvedLabel),
    ).toEqual([
      'Request',
      'Check details',
      'Approval',
      'Sync systems',
      'Done',
    ])
  })

  it('references valid fragment ids in every connection', () => {
    const ids = new Set(fragments.map((item) => item.id))
    for (const connection of connections) {
      expect(ids.has(connection.from)).toBe(true)
      expect(ids.has(connection.to)).toBe(true)
    }
  })

  it('uses the compact layout below 768px', () => {
    expect(layoutModeForWidth(767)).toBe('compact')
    expect(layoutModeForWidth(768)).toBe('wide')
  })
})
