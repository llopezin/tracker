import type { IncidentType, ShipmentView, StepLabel, StepView } from '../../domain/types'
import { incidentRank, severityRank } from '../../domain/rules'
import type { MessageKey } from '../../i18n/en'
import type { Audience } from '../../api/contracts'
import type { ChipTone } from '../ui/Chip'
import type { TagTone } from '../ui/Tag'
import type { TimelineItemTone } from '../ui/TimelineItem'

// Domain → UI variants. Texts are i18n keys.

export const labelChip: Record<StepLabel, ChipTone> = {
  ACT: 'solid',
  EST: 'outline-accent',
  PLN: 'dashed-muted',
  NA: 'dashed',
  AI: 'dotted',
  UNKNOWN: 'dashed',
  IGNORED: 'dashed-muted',
}

/** Customers only get ACT/EST/PLN/NA (mapShipments strips the rest). */
export function labelKey(label: StepLabel, audience: Audience): MessageKey {
  if (audience === 'ops') return `label.ops.${label}`
  return label === 'ACT' || label === 'EST' || label === 'PLN' ? `label.customer.${label}` : 'label.customer.NA'
}

export function stepDot(step: StepView, phase: 'done' | 'next'): TimelineItemTone {
  if (step.label === 'AI') return 'dotted'
  if (step.label === 'UNKNOWN' || step.label === 'IGNORED') return 'hollow'
  if (step.note) return 'solid-signal'
  return phase === 'done' ? 'solid' : 'hollow'
}

/** By rank: blocking, attention, review. */
const severity = [
  { label: 'ui.severity.blocking', tag: 'soft-danger' },
  { label: 'ui.severity.attention', tag: 'soft-warning' },
  { label: 'ui.severity.review', tag: 'soft-accent' },
] as const satisfies { label: MessageKey; tag: TagTone }[]

export const incidentSeverity = (type: IncidentType) => severity[incidentRank[type]]

/** Row header: orange with a blocking incident, blue otherwise. */
export const headTone = (incidents: { type: IncidentType }[]) => (severityRank(incidents) === 0 ? 'bg-signal/90' : 'bg-bar-ok/90')

export const noticeTag: Record<'late' | 'overdue' | 'customs', TagTone> = {
  late: 'soft-warning',
  overdue: 'soft-warning',
  customs: 'soft-danger',
}

export const documentTag: Record<ShipmentView['documents'][number]['status'], { tone: TagTone; label: MessageKey }> = {
  ok: { tone: 'soft-accent', label: 'ui.doc.ok' },
  flagged: { tone: 'soft-warning', label: 'ui.doc.flagged' },
  missing: { tone: 'soft-danger', label: 'ui.doc.missing' },
  uploaded: { tone: 'soft-accent', label: 'ui.doc.uploaded' },
}
