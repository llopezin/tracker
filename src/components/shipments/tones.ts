import type { ShipmentView, StepLabel, StepView, Health } from '../../domain/types'
import type { MessageKey } from '../../i18n/en'
import type { Audience } from '../../api/contracts'
import type { ChipTone } from '../ui/Chip'
import type { IconName } from '../ui/Icon'
import type { IconTileTone } from '../ui/IconTile'
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

type TileKey = Health | 'delivered'

export const statusTile: Record<TileKey, { tone: IconTileTone; icon: IconName | 'mode'; label: MessageKey }> = {
  ok: { tone: 'soft-accent', icon: 'mode', label: 'ui.health.ok' },
  delay: { tone: 'solid-signal', icon: 'clock', label: 'ui.health.delay' },
  risk: { tone: 'soft-signal', icon: 'doc-alert', label: 'ui.health.risk' },
  ai: { tone: 'dotted', icon: 'doc-alert', label: 'ui.health.ai' },
  stale: { tone: 'dashed-strong', icon: 'clock', label: 'ui.health.stale' },
  pre: { tone: 'neutral', icon: 'box', label: 'ui.health.pre' },
  delivered: { tone: 'solid', icon: 'check', label: 'ui.health.delivered' },
}

/** Customs holds get the hold icon. (Customer views never carry health 'ai'.) */
export function tileFor(view: ShipmentView) {
  const key: TileKey = view.delivered ? 'delivered' : view.health
  const spec = statusTile[key]
  const current = view.stages.find((s) => s.current)?.kind ?? view.stages[0]?.kind ?? 'road'
  let icon: IconName = spec.icon === 'mode' ? (current === 'road' ? 'truck' : 'ship') : spec.icon
  if (key === 'delay' && view.tags.includes('customs')) icon = 'hold'
  return { tone: spec.tone, icon, label: spec.label }
}

export type BarTone = 'ok' | 'signal' | 'muted' | 'solid'

export function barToneFor(view: ShipmentView): BarTone {
  if (view.delivered) return 'solid'
  if (view.status === 'tag.NOT_DEPARTED') return 'muted' // not started: never the delay colour
  if (view.tags.includes('delayed') || view.health === 'delay' || view.health === 'risk') return 'signal'
  if (view.health === 'stale' || view.health === 'pre') return 'muted'
  return 'ok'
}

export function stepDot(step: StepView, phase: 'done' | 'next'): TimelineItemTone {
  if (step.label === 'AI') return 'dotted'
  if (step.label === 'UNKNOWN' || step.label === 'IGNORED') return 'hollow'
  if (step.note) return 'solid-signal'
  return phase === 'done' ? 'solid' : 'hollow'
}

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
