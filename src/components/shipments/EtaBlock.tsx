import type { ShipmentView } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Audience } from '../../api/contracts'
import { Chip } from '../ui/Chip'
import { EtaFlag } from '../ui/EtaFlag'
import { Icon } from '../ui/Icon'
import { Label } from '../ui/Label'
import { formatDate, formatDay, formatRange, hoursSince, updatedAgo } from '../format'
import { DateLabel } from './DateLabel'
import { SourceLine } from './SourceLine'

export type EtaBlockProps = {
  view: ShipmentView
  audience: Audience
}

/** ETA (operator only), its source, previous ETA struck through, delta, plan and freshness. */
export function EtaBlock({ view, audience }: EtaBlockProps) {
  const { eta } = view
  // The next step carrying the ETA date gives its source and the previous (struck) date.
  const etaStep = eta.scope === 'none' ? undefined : view.next.find((s) => s.date === eta.from)
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
      {view.delivered ? (
        <>
          <Label size="sm">{t('ui.eta.delivered')}</Label>
          {view.deliveredAt && <DateLabel label="ACT" audience={audience} date={view.deliveredAt} variant="eta" />}
        </>
      ) : eta.scope === 'none' ? (
        <Label size="sm" tone="muted">{t('ui.eta.none')}</Label>
      ) : (
        <>
          <Label size="sm">
            {eta.scope === 'delivery' ? t('ui.eta.delivery') : t('ui.eta.nextStop', { place: eta.place ?? '' })}
          </Label>
          <span className="flex flex-wrap items-center gap-1.5 sm:justify-end">
            <DateLabel label="EST" audience={audience} date={eta.from} to={eta.to} dateOnly={eta.dateOnly} variant="eta" />
          </span>
          {etaStep?.previousDate && (
            <s className="font-mono text-note tabular-nums text-fg-subtle">
              {t('ui.was', { date: formatDate(etaStep.previousDate) })}
            </s>
          )}
          {etaStep?.sources[0] && <SourceLine source={etaStep.sources[0]} />}
        </>
      )}
      {audience === 'ops' && view.aiAlternative && (
        <span className="flex flex-wrap items-center gap-1.5 text-note text-fg-muted sm:justify-end">
          <Chip tone="dotted">{t('ui.ai.confidence', { pct: Math.round(view.aiAlternative.confidence * 100) })}</Chip>
          <span className="font-mono tabular-nums">{formatRange(view.aiAlternative.from, view.aiAlternative.to)}</span>
        </span>
      )}
      {!view.delivered && (
        <span className="flex flex-wrap items-center gap-1.5 text-note text-fg-subtle sm:justify-end">
          {view.delta && <EtaFlag tone="solid-signal">{view.delta}</EtaFlag>}
          <span>{t('ui.eta.planned', { date: formatDay(view.plannedDelivery) })}</span>
        </span>
      )}
      {view.stale && (
        <EtaFlag tone="dashed-strong" icon={<Icon name="clock" size={12} />}>
          {t('ui.eta.stale', { hours: hoursSince(view.lastEventAt) })}
        </EtaFlag>
      )}
      <span className="text-caption text-fg-subtle">{updatedAgo(view.lastEventAt)}</span>
    </div>
  )
}
