import { memo } from 'react'
import { t } from '../../i18n/t'
import type { Role } from '../../api/contracts'
import { getPersona } from '../../api/client'
import { useShipments } from '../../data/shipments'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { IconTile } from '../ui/IconTile'
import { RefTag } from '../ui/RefTag'
import { tKey } from '../format'
import { EtaBlock } from './EtaBlock'
import { detailIdOf } from './focusDetail'
import { ModeBar } from './ModeBar'
import { ShipmentDetail } from './ShipmentDetail'
import { tileFor } from './tones'

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
  const detailId = detailIdOf(id)
  const tile = tileFor(view)
  const delayed = !view.delivered && view.tags.includes('delayed')
  const toggle = () => onToggle(id)
  return (
    <li
      id={`row-${id}`}
      className={`scroll-mt-4 border-l-4 ${delayed ? 'border-signal bg-signal-wash' : 'border-transparent bg-surface hover:bg-surface-hover'}`}
    >
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 px-4 py-3">
        <IconTile tone={tile.tone} label={t(tile.label)}>
          <Icon name={tile.icon} size={20} />
        </IconTile>
        <div className="flex min-w-0 flex-1 basis-56 flex-col gap-1 md:flex-none md:basis-72">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <button
              type="button"
              className="cursor-pointer font-mono text-ui font-semibold tabular-nums"
              aria-expanded={expanded}
              aria-controls={detailId}
              onClick={toggle}
            >
              {view.id}
            </button>
            <span className="text-ui">{view.description}</span>
          </p>
          {audience === 'ops' && <p className="text-note text-fg-muted">{view.customer}</p>}
          <div className="flex flex-wrap gap-1.5">
            <RefTag>{view.po}</RefTag>
            <RefTag variant="route">{t('ui.row.route', { from: view.origin, to: view.destination })}</RefTag>
          </div>
        </div>
        <div className="flex min-w-48 flex-1 basis-56 flex-col gap-1.5">
          <ModeBar view={view} />
          <p className={`text-note font-semibold ${delayed ? 'text-signal-fg' : ''}`}>
            {tKey(view.status)}
            {view.subStatus && <span className="font-normal text-fg-muted"> · {view.subStatus}</span>}
          </p>
          <p className="text-caption text-fg-subtle">
            {view.routeText} · {view.operators}
          </p>
        </div>
        <div className="flex flex-1 basis-48 items-start justify-between gap-2 md:justify-end sm:flex-none md:basis-72">
          <EtaBlock view={view} audience={audience} />
          <Button
            tone="ghost"
            icon={<Icon name="chevron-down" rotate={expanded ? 180 : 0} />}
            aria-label={t(expanded ? 'ui.row.collapse' : 'ui.row.expand', { id })}
            aria-expanded={expanded}
            aria-controls={detailId}
            onClick={toggle}
          />
        </div>
      </div>
      {expanded && <ShipmentDetail shipmentId={id} role={role} id={detailId} />}
    </li>
  )
})
