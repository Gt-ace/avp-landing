# DESIGN.md: avp.software landing

The landing page uses a precise editorial system: Geist for working text and
controls, Bodoni Moda for short editorial accents, paper and ink as the base,
and restrained motion that explains how AVP works.

## Tuesday Board hero

The first viewport makes one operational scene legible: a team’s scattered
email, spreadsheet, approval, reminder, and system handoff become a single
working system. The left third carries the statement and contact path; the
right two-thirds carries a labeled synthetic `Example workflow` board. The
approved message is:

> Your team’s most annoying Tuesday, turned into software.

The supporting copy explains AVP’s offer without adding claims or fabricated
proof. The primary CTA is `Tell me what gets stuck →` and links to `/contact`.

## Functional palette

| Token | Value | Role |
| --- | --- | --- |
| `--color-cobalt` | `#2457F5` | Structure, CTA, resolved system, routing |
| `--color-coral` | `#FF5A45` | Blocked and waiting work |
| `--color-highlight` | `#E8FF54` | Reminder, annotations, emphasis |
| `--color-paper` | `#F2EFE8` | Page ground and artifact surfaces |
| `--color-ink` | `#111315` | Type, outlines, high-contrast controls |

`--color-bg`, `--color-surface`, `--color-muted`, and `--color-border` remain
compatibility tokens for the sections below the hero.

## Artifact system

The board renders five provider-neutral semantic artifacts as HTML:

- Email, including sender, subject, time, attachment, and message.
- Spreadsheet, including inconsistent status cells and one blank cell.
- Approval, including owner, reviewer, and a visible `WAITING` stamp.
- Reminder, using highlighter yellow for `Follow up again`.
- System handoff, with custom accounting pictogram and the resolved sequence.

Mail, Sheet, Approval, Reminder, and Accounting pictograms are custom inline
SVGs with one shared view box, stroke weight, and optical treatment. No
third-party service logo is used.

## Scroll and interaction policy

Normal scrolling is authoritative across four narrative states:

1. Recognition: artifacts overlap with controlled rotations and incomplete
   routing.
2. Diagnosis: four annotations expose missing, duplicated, waiting, and
   manually copied work.
3. Transformation: artifacts straighten, coral recedes, and cobalt takes
   over the board.
4. Resolved system: `Request → Check → Approve → Sync → Done` is readable and
   the process tail points toward Map → Design → Build → Run.

There is no drag, pointer-proximity physics, spring, smooth-scroll capture,
idle movement, or pointer-dependent meaning. Fine-pointer focus/hover may add
an outline emphasis only; it never changes the canonical scroll story.

## Responsive behavior

Wide screens use the left-copy/right-board composition. Tablet reduces overlap
and rotation while keeping several artifacts visible. Mobile uses a vertical
storyboard with manual artifacts, diagnosed handoffs, and the resolved system;
the headline, copy, CTA, and example label stay readable without horizontal
scrolling.

## Accessibility and fallback

The page includes a keyboard-visible skip link, semantic main landmark, and a
server-rendered resolved ordered list. The decorative artifact scene and SVG
routing layer are `aria-hidden`; the ordered fallback carries the accessible
workflow meaning. The hero CTA and navigation retain visible focus states.

Reduced motion skips enhancement and keeps the resolved workflow static. If
JavaScript fails, the same resolved scene and ordered workflow remain in the
HTML. The controller pauses off-screen, measures only on setup/resize, and
updates transforms, opacity, CSS variables, and SVG endpoints in one frame.
