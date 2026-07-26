import type { Pose } from './workflow-motion'

export type LayoutMode = 'wide' | 'compact'

export type ResponsivePose = {
  wide: Pose
  compact: Pose
}

export type FragmentDefinition = {
  id: string
  messyLabel: string
  resolvedLabel: string
  messy: ResponsivePose
  resolved: ResponsivePose
}

export type ConnectionDefinition = {
  id: string
  from: string
  to: string
  state: 'messy' | 'resolved'
}

const pose = (
  x: number,
  y: number,
  rotation: number,
  opacity = 1,
): Pose => ({ x, y, rotation, opacity })

export const fragments: FragmentDefinition[] = [
  {
    id: 'request',
    messyLabel: 'Email request',
    resolvedLabel: 'Request',
    messy: {
      wide: pose(58, 13, -6),
      compact: pose(18, 10, -5),
    },
    resolved: {
      wide: pose(42, 34, 0),
      compact: pose(20, 10, 0),
    },
  },
  {
    id: 'details',
    messyLabel: 'Missing details',
    resolvedLabel: 'Check details',
    messy: {
      wide: pose(77, 17, 5),
      compact: pose(61, 15, 4),
    },
    resolved: {
      wide: pose(54, 34, 0),
      compact: pose(58, 19, 0),
    },
  },
  {
    id: 'sheet',
    messyLabel: 'Spreadsheet',
    resolvedLabel: 'Spreadsheet',
    messy: {
      wide: pose(68, 32, -3),
      compact: pose(27, 26, -4),
    },
    resolved: {
      wide: pose(58, 34, 0, 0),
      compact: pose(40, 24, 0, 0),
    },
  },
  {
    id: 'copy',
    messyLabel: 'Copy/paste',
    resolvedLabel: 'Copy/paste',
    messy: {
      wide: pose(86, 39, 7),
      compact: pose(68, 31, 5),
    },
    resolved: {
      wide: pose(63, 34, 0, 0),
      compact: pose(40, 28, 0, 0),
    },
  },
  {
    id: 'approval',
    messyLabel: 'Approval?',
    resolvedLabel: 'Approval',
    messy: {
      wide: pose(55, 48, 4),
      compact: pose(17, 43, 4),
    },
    resolved: {
      wide: pose(66, 34, 0),
      compact: pose(20, 31, 0),
    },
  },
  {
    id: 'reminder',
    messyLabel: 'Reminder',
    resolvedLabel: 'Reminder',
    messy: {
      wide: pose(78, 54, -7),
      compact: pose(65, 49, -6),
    },
    resolved: {
      wide: pose(70, 34, 0, 0),
      compact: pose(40, 36, 0, 0),
    },
  },
  {
    id: 'sync',
    messyLabel: 'Accounting system',
    resolvedLabel: 'Sync systems',
    messy: {
      wide: pose(88, 66, 3),
      compact: pose(25, 60, 3),
    },
    resolved: {
      wide: pose(78, 34, 0),
      compact: pose(58, 43, 0),
    },
  },
  {
    id: 'done',
    messyLabel: 'Done',
    resolvedLabel: 'Done',
    messy: {
      wide: pose(65, 70, -4),
      compact: pose(65, 65, -3),
    },
    resolved: {
      wide: pose(89, 34, 0),
      compact: pose(20, 55, 0),
    },
  },
]

export const connections: ConnectionDefinition[] = [
  { id: 'm-request-sheet', from: 'request', to: 'sheet', state: 'messy' },
  { id: 'm-sheet-copy', from: 'sheet', to: 'copy', state: 'messy' },
  { id: 'm-copy-details', from: 'copy', to: 'details', state: 'messy' },
  { id: 'm-details-approval', from: 'details', to: 'approval', state: 'messy' },
  { id: 'm-approval-reminder', from: 'approval', to: 'reminder', state: 'messy' },
  { id: 'm-reminder-sync', from: 'reminder', to: 'sync', state: 'messy' },
  { id: 'm-sync-done', from: 'sync', to: 'done', state: 'messy' },
  { id: 'r-request-details', from: 'request', to: 'details', state: 'resolved' },
  { id: 'r-details-approval', from: 'details', to: 'approval', state: 'resolved' },
  { id: 'r-approval-sync', from: 'approval', to: 'sync', state: 'resolved' },
  { id: 'r-sync-done', from: 'sync', to: 'done', state: 'resolved' },
]

export function layoutModeForWidth(width: number): LayoutMode {
  return width < 768 ? 'compact' : 'wide'
}
