import { t } from '../../i18n/t'
import type { Role } from '../../api/contracts'
import { Label } from '../ui/Label'
import { Panel } from '../ui/Panel'
import { ShipmentRow } from './ShipmentRow'

export type ShipmentListProps = {
  ids: string[]
  role: Role
  label: string
  expandedIds: ReadonlySet<string>
  onToggle: (id: string) => void
}

export function ShipmentList({ ids, role, label, expandedIds, onToggle }: ShipmentListProps) {
  return (
    <Panel radius="lg" as="section" aria-label={label} layout="overflow-hidden">
      <div className="hidden gap-4 border-b border-divider bg-surface-subtle px-4 py-2 md:flex">
        <span className="w-86 pl-14">
          <Label size="sm">{t('ui.list.shipment')}</Label>
        </span>
        <span className="min-w-48 flex-1">
          <Label size="sm">{t('ui.list.route')}</Label>
        </span>
        <span className="w-72 pr-12 text-right">
          <Label size="sm">{t('ui.list.eta')}</Label>
        </span>
      </div>
      <ul className="divide-y divide-divider">
        {ids.map((id) => (
          <ShipmentRow key={id} id={id} role={role} expanded={expandedIds.has(id)} onToggle={onToggle} />
        ))}
      </ul>
    </Panel>
  )
}
