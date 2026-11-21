import { memo } from 'react'
import type { ReactNode } from 'react'
import { t } from '../../i18n/t'
import type { Audience, Role } from '../../api/contracts'
import { getPersona } from '../../api/client'
import { useRunAction, useShipments } from '../../data/shipments'
import type { ShipmentView } from '../../domain/types'
import { Button } from '../ui/Button'
import { EtaFlag } from '../ui/EtaFlag'
import { Icon } from '../ui/Icon'
import { Label } from '../ui/Label'
import { Tag } from '../ui/Tag'
import { formatDate, formatDay, hoursSince, tKey, updatedAgo } from '../format'
import { DateLabel } from './DateLabel'
import { detailIdOf, focusAiReview } from './focusDetail'
import { ModeBar } from './ModeBar'
import { ShipmentDetail } from './ShipmentDetail'
import { headTone, incidentSeverity } from './tones'

export type ShipmentRowProps = {
  id: string
  role: Role
  expanded: boolean
  onToggle: (id: string) => void
}

/** Memoized: re-renders only when its own shipment (selected by id) or its props change. */
export const ShipmentRow = memo(function ShipmentRow({ id, role, expanded, onToggle }: ShipmentRowProps) {
  const view = useShipments(role, (list) => list.find((s) => s.id === id)!)
  const { audience } = getPersona(role)
  const isOps = audience === 'ops'
  const detailId = detailIdOf(id)
  const toggle = () => onToggle(id)
  const review = () => {
    if (!expanded) onToggle(id)
    requestAnimationFrame(() => focusAiReview(id))
  }
  return (
    <li
      id={`row-${id}`}
      className="scroll-mt-4 overflow-hidden rounded-lg border border-border bg-surface"
    >
      <div className={`flex items-center gap-2 border-b border-divider px-4 py-2.5 text-on-solid ${headTone(view.incidents)}`}>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <button
              type="button"
              className="cursor-pointer font-mono text-heading font-semibold tabular-nums"
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={toggle}
            >
              {view.id}
            </button>
            <span className="text-heading font-semibold">{view.description}</span>
            {view.tags.includes('delayed') && view.delta && (
              <Tag tone="soft-signal">{t('incident.delay', { delta: view.delta })}</Tag>
            )}
          </p>
          <p className="text-note opacity-85">{isOps ? `${view.customer} · ${view.po}` : view.po}</p>
        </div>
        <span className={`text-right text-caption ${view.stale ? 'font-semibold' : 'opacity-85'}`}>
          {view.stale ? t('ui.eta.stale', { hours: hoursSince(view.lastEventAt) }) : updatedAgo(view.lastEventAt)}
        </span>
        <Button size="sm" tone="ghost-on-solid" aria-expanded={expanded} aria-controls={detailId} onClick={toggle}>
          <span className="text-label uppercase tracking-label">{t(expanded ? 'ui.row.collapse' : 'ui.row.expand')}</span>
          <Icon name="chevron-down" rotate={expanded ? 180 : 0} />
        </Button>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <ModeBar view={view} />
        <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-6">
          <Fact label={t('ui.row.status')}>
            <span className="text-body font-semibold">{tKey(view.status)}</span>
            {view.subStatus && <span className="text-note text-fg-muted">{view.subStatus}</span>}
          </Fact>
          <Fact label={t('ui.row.planned')} align={view.delivered || view.eta.scope !== 'none' ? 'center' : 'end'}>
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-body tabular-nums">{formatDay(view.plannedDelivery)}</span>
              {view.delta && <EtaFlag tone="solid-signal">{view.delta}</EtaFlag>}
            </span>
          </Fact>
          <Eta view={view} audience={audience} />
        </dl>
        {isOps && view.incidents.length > 0 && <Issues view={view} role={role} onReview={review} />}
      </div>
      {expanded && <ShipmentDetail shipmentId={id} role={role} id={detailId} />}
    </li>
  )
})

function Issues({ view, role, onReview }: { view: ShipmentView; role: Role; onReview: () => void }) {
  const run = useRunAction(role)
  const next = view.actions.find((a) => a.primary && !a.done)
  return (
    <div className="flex flex-wrap items-center justify-between -mt-1.25 gap-x-4 gap-y-2 border-t border-dashed border-divider pt-3">
      <ul className="flex flex-col gap-1">
        {view.incidents.map((incident) => (
          <li key={incident.type} className="flex items-center gap-2 text-ui font-semibold">
            <Tag tone={incidentSeverity(incident.type).tag}>{t(incidentSeverity(incident.type).label)}</Tag>
            {incident.summary}
            {incident.type === 'ai_pending' && (
              <button type="button" className="cursor-pointer text-accent underline underline-offset-2 hover:text-accent-strong" onClick={onReview}>
                {t('ui.row.review')}
              </button>
            )}
          </li>
        ))}
      </ul>
      {next && (
        <span className="ml-auto">
          <Button size="sm" tone="solid-signal" disabled={next.blockedBy !== undefined} onClick={() => run(view, next)}>
            {t(`action.button.${next.kind}`)}
          </Button>
        </span>
      )}
    </div>
  )
}

/** Delivery date, or the operator ETA with the previous date struck through. Hidden without an ETA. */
function Eta({ view, audience }: { view: ShipmentView; audience: Audience }) {
  const { eta } = view
  if (view.delivered) {
    return (
      <Fact label={t('ui.eta.delivered')} align="end">
        <DateLabel label={view.deliveredAt ? 'ACT' : 'NA'} audience={audience} date={view.deliveredAt} variant="eta" />
      </Fact>
    )
  }
  if (eta.scope === 'none') return null
  const etaStep = view.next.find((s) => s.date === eta.from)
  return (
    <Fact align="end" label={eta.scope === 'next_stop' ? t('ui.eta.nextStop') : t('ui.eta.delivery')}>
      <DateLabel label="EST" audience={audience} date={eta.from} to={eta.to} dateOnly={eta.dateOnly} variant="eta" chip={false} />
      {etaStep?.previousDate && (
        <s className="font-mono text-note tabular-nums text-fg-subtle">{t('ui.was', { date: formatDate(etaStep.previousDate) })}</s>
      )}
    </Fact>
  )
}

const alignClasses = { start: 'items-start', center: 'items-center text-center', end: 'col-start-3 items-end text-right' } as const

function Fact({ label, align = 'start', children }: { label: string; align?: keyof typeof alignClasses; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 max-w-full flex-col gap-0.5 ${alignClasses[align]}`}>
      <dt>
        <Label size="sm">{label}</Label>
      </dt>
      <dd className={`flex flex-col gap-0.5 ${alignClasses[align]}`}>{children}</dd>
    </div>
  )
}
