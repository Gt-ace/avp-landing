import type { StoryPose } from './workflow-motion'

export type LayoutMode = 'mobile' | 'tablet' | 'wide'
export type ArtifactId = 'email' | 'sheet' | 'approval' | 'reminder' | 'system'
export type IconId = 'mail' | 'sheet' | 'approval' | 'reminder' | 'accounting'

export type ResponsiveStoryPose = Record<LayoutMode, StoryPose>

export type ArtifactDefinition = {
  id: ArtifactId
  title: string
  icon: IconId
  role: 'manual' | 'blocked' | 'attention' | 'system'
  annotation?: string
  content: ReadonlyArray<{ label: string; value: string }>
  poses: {
    recognition: ResponsiveStoryPose
    diagnosis: ResponsiveStoryPose
    resolved: ResponsiveStoryPose
  }
}

export type ConnectionDefinition = {
  id: string
  from: ArtifactId
  to: ArtifactId
  phase: 'messy' | 'resolved'
}

const pose = (
  x: number, y: number, rotation: number, scale = 1, opacity = 1,
): StoryPose => ({ x, y, rotation, scale, opacity })

export const artifacts: ArtifactDefinition[] = [
  {
    id: 'email', title: 'Email', icon: 'mail', role: 'manual',
    annotation: 'Missing information',
    content: [
      { label: 'From', value: 'Operations' },
      { label: 'Subject', value: 'Latest version?' },
      { label: 'Time', value: 'Tuesday 09:12' },
      { label: 'Attachment', value: 'latest-version.pdf' },
      { label: 'Message', value: 'Could you send the latest version?' },
    ],
    poses: {
      recognition: {
        wide: pose(20, 15, -3), tablet: pose(13, 12, -2), mobile: pose(50, 10, -1),
      },
      diagnosis: {
        wide: pose(15, 13, -1), tablet: pose(10, 10, -1), mobile: pose(50, 8, 0),
      },
      resolved: {
        wide: pose(10, 34, 0, .78), tablet: pose(8, 38, 0, .72), mobile: pose(50, 22, 0, .76),
      },
    },
  },
  {
    id: 'sheet', title: 'Spreadsheet', icon: 'sheet', role: 'manual',
    annotation: 'Updated in two places',
    content: [
      { label: 'A2', value: 'Pending' },
      { label: 'B2', value: 'Sent?' },
      { label: 'C2', value: 'Waiting' },
      { label: 'D2', value: '' },
    ],
    poses: {
      recognition: {
        wide: pose(55, 9, 2), tablet: pose(48, 8, 1), mobile: pose(50, 29, 1),
      },
      diagnosis: {
        wide: pose(50, 12, 0), tablet: pose(46, 10, 0), mobile: pose(50, 28, 0),
      },
      resolved: {
        wide: pose(30, 34, 0, .72), tablet: pose(27, 38, 0, .68), mobile: pose(50, 37, 0, .7),
      },
    },
  },
  {
    id: 'approval', title: 'Approval', icon: 'approval', role: 'blocked',
    annotation: 'Waiting for approval',
    content: [
      { label: 'Owner', value: 'Finance' },
      { label: 'Reviewer', value: 'Team lead' },
      { label: 'Status', value: 'WAITING' },
    ],
    poses: {
      recognition: {
        wide: pose(25, 52, 4), tablet: pose(13, 48, 2), mobile: pose(50, 48, -1),
      },
      diagnosis: {
        wide: pose(27, 48, 1), tablet: pose(15, 46, 0), mobile: pose(50, 47, 0),
      },
      resolved: {
        wide: pose(50, 34, 0, .76), tablet: pose(47, 38, 0, .7), mobile: pose(50, 52, 0, .72),
      },
    },
  },
  {
    id: 'reminder', title: 'Reminder', icon: 'reminder', role: 'attention',
    annotation: 'Copied manually',
    content: [{ label: 'Note', value: 'Follow up again' }],
    poses: {
      recognition: {
        wide: pose(52, 18, -7), tablet: pose(52, 44, -5), mobile: pose(50, 64, 2),
      },
      diagnosis: {
        wide: pose(53, 51, -3), tablet: pose(54, 46, -2), mobile: pose(50, 63, 0),
      },
      resolved: {
        wide: pose(61, 34, 0, .55, 0), tablet: pose(61, 38, 0, .5, 0), mobile: pose(50, 67, 0, .5, 0),
      },
    },
  },
  {
    id: 'system', title: 'System handoff', icon: 'accounting', role: 'system',
    content: [
      { label: 'Flow', value: 'Request → Validate → Approve → Sync' },
    ],
    poses: {
      recognition: {
        wide: pose(66, 47, 1, .88, .72), tablet: pose(55, 62, 0, .82, .7), mobile: pose(50, 82, 0, .8, .68),
      },
      diagnosis: {
        wide: pose(67, 45, 0, .92, .88), tablet: pose(55, 61, 0, .86, .84), mobile: pose(50, 80, 0, .84, .82),
      },
      resolved: {
        wide: pose(76, 34, 0, 1, 1), tablet: pose(78, 38, 0, .92, 1), mobile: pose(50, 79, 0, .9, 1),
      },
    },
  },
]

export const connections: ConnectionDefinition[] = [
  { id: 'messy-email-sheet', from: 'email', to: 'sheet', phase: 'messy' },
  { id: 'messy-sheet-approval', from: 'sheet', to: 'approval', phase: 'messy' },
  { id: 'messy-approval-reminder', from: 'approval', to: 'reminder', phase: 'messy' },
  { id: 'messy-reminder-system', from: 'reminder', to: 'system', phase: 'messy' },
  { id: 'resolved-email-sheet', from: 'email', to: 'sheet', phase: 'resolved' },
  { id: 'resolved-sheet-approval', from: 'sheet', to: 'approval', phase: 'resolved' },
  { id: 'resolved-approval-system', from: 'approval', to: 'system', phase: 'resolved' },
]

export function layoutModeForWidth(width: number): LayoutMode {
  if (width < 480) return 'mobile'
  return width < 900 ? 'tablet' : 'wide'
}
