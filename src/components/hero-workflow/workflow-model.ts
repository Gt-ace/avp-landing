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
        wide: pose(74, 24, -2), tablet: pose(70, 22, -2, .92), mobile: pose(50, 72, -1, .88),
      },
      diagnosis: {
        wide: pose(70, 22, 0, .96), tablet: pose(68, 21, 0, .9), mobile: pose(50, 68, 0, .84, 0),
      },
      resolved: {
        wide: pose(58, 50, 0, .86, 0), tablet: pose(55, 52, 0, .82, 0), mobile: pose(50, 68, 0, .82, 0),
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
        wide: pose(82, 52, 2, .94), tablet: pose(77, 49, 1, .88), mobile: pose(50, 76, 1, .82, 0),
      },
      diagnosis: {
        wide: pose(77, 46, 0, .92), tablet: pose(73, 44, 0, .86), mobile: pose(50, 73, 0, .8),
      },
      resolved: {
        wide: pose(62, 50, 0, .8, 0), tablet: pose(57, 52, 0, .76, 0), mobile: pose(50, 70, 0, .76, 0),
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
        wide: pose(58, 67, -3, .82), tablet: pose(54, 67, -2, .78), mobile: pose(50, 84, -1, .76, 0),
      },
      diagnosis: {
        wide: pose(60, 63, 0, .84), tablet: pose(56, 63, 0, .78), mobile: pose(50, 82, 0, .74, 0),
      },
      resolved: {
        wide: pose(66, 50, 0, .76, 0), tablet: pose(60, 52, 0, .7, 0), mobile: pose(50, 72, 0, .7, 0),
      },
    },
  },
  {
    id: 'reminder', title: 'Reminder', icon: 'reminder', role: 'attention',
    annotation: 'Copied manually',
    content: [{ label: 'Note', value: 'Follow up again' }],
    poses: {
      recognition: {
        wide: pose(76, 68, 5, .72), tablet: pose(72, 70, 4, .68), mobile: pose(66, 84, 3, .66, 0),
      },
      diagnosis: {
        wide: pose(70, 66, 0, .7), tablet: pose(68, 67, 0, .66), mobile: pose(61, 84, 0, .64, 0),
      },
      resolved: {
        wide: pose(68, 50, 0, .6, 0), tablet: pose(62, 52, 0, .56, 0), mobile: pose(50, 74, 0, .58, 0),
      },
    },
  },
  {
    id: 'system', title: 'System handoff', icon: 'accounting', role: 'system',
    content: [
      { label: 'Flow', value: 'Request → Check → Approve → Sync → Done' },
    ],
    poses: {
      recognition: {
        wide: pose(79, 78, 0, .72, .18), tablet: pose(72, 78, 0, .68, .18), mobile: pose(50, 88, 0, .72, 0),
      },
      diagnosis: {
        wide: pose(72, 64, 0, .84, .5), tablet: pose(67, 65, 0, .8, .5), mobile: pose(50, 80, 0, .82, .18),
      },
      resolved: {
        wide: pose(74, 52, 0, 1, 1), tablet: pose(75, 54, 0, 1, 1), mobile: pose(50, 74, 0, 1, 1),
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
  if (width < 768) return 'mobile'
  return width < 900 ? 'tablet' : 'wide'
}
