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

  it('keeps the email artifact recognizable as an inbox message', () => {
    expect(artifacts[0].content).toEqual([
      { label: 'From', value: 'Operations' },
      { label: 'Subject', value: 'Latest version?' },
      { label: 'Time', value: 'Tuesday 09:12' },
      { label: 'Attachment', value: 'latest-version.pdf' },
      { label: 'Message', value: 'Could you send the latest version?' },
    ])
  })

  it('puts the irritating reminder over the spreadsheet in recognition', () => {
    const sheet = artifacts.find((item) => item.id === 'sheet')!
    const reminder = artifacts.find((item) => item.id === 'reminder')!

    expect(reminder.poses.recognition.wide.x).toBeGreaterThan(sheet.poses.recognition.wide.x - 20)
    expect(reminder.poses.recognition.wide.y).toBeLessThan(sheet.poses.recognition.wide.y + 20)
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
