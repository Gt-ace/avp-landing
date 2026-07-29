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

  it('resolves into one system instead of a row of miniature artifacts', () => {
    const manualArtifacts = artifacts.filter(({ id }) => id !== 'system')
    for (const artifact of manualArtifacts) {
      expect(artifact.poses.resolved.wide.opacity).toBe(0)
      expect(artifact.poses.resolved.mobile.opacity).toBe(0)
    }

    const system = artifacts.find(({ id }) => id === 'system')
    expect(system?.poses.resolved.wide).toMatchObject({
      scale: 1,
      opacity: 1,
    })
    expect(system?.poses.resolved.mobile).toMatchObject({
      scale: 1,
      opacity: 1,
    })
  })

  it('positions the resolved system clear of desktop copy and mobile edges', () => {
    const system = artifacts.find(({ id }) => id === 'system')!

    expect(system.poses.resolved.wide.x).toBe(74)
    expect(system.poses.resolved.tablet.x).toBe(75)
    expect(system.poses.resolved.mobile.y).toBe(74)
  })

  it('shows one readable source artifact at a time on mobile', () => {
    const email = artifacts.find(({ id }) => id === 'email')!
    const sheet = artifacts.find(({ id }) => id === 'sheet')!
    const supportingArtifacts = artifacts.filter(
      ({ id }) => id === 'approval' || id === 'reminder',
    )

    expect(email.poses.recognition.mobile.opacity).toBe(1)
    expect(email.poses.diagnosis.mobile.opacity).toBe(0)
    expect(sheet.poses.recognition.mobile.opacity).toBe(0)
    expect(sheet.poses.diagnosis.mobile.opacity).toBe(1)
    for (const artifact of supportingArtifacts) {
      expect(artifact.poses.recognition.mobile.opacity).toBe(0)
      expect(artifact.poses.diagnosis.mobile.opacity).toBe(0)
    }
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

  it('uses the canonical resolved system sequence', () => {
    const system = artifacts.find((item) => item.id === 'system')!

    expect(system.content).toContainEqual({
      label: 'Flow',
      value: 'Request → Check → Approve → Sync → Done',
    })
  })

  it('references valid artifact ids in every connection', () => {
    const ids = new Set(artifacts.map((item) => item.id))
    for (const edge of connections) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }
  })

  it('selects mobile, tablet, and wide layouts at fixed boundaries', () => {
    expect(layoutModeForWidth(600)).toBe('mobile')
    expect(layoutModeForWidth(767)).toBe('mobile')
    expect(layoutModeForWidth(768)).toBe('tablet')
    expect(layoutModeForWidth(899)).toBe('tablet')
    expect(layoutModeForWidth(900)).toBe('wide')
  })
})
