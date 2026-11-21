import type { Role } from '../../api/contracts'
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
    <section aria-label={label}>
      <ul className="flex flex-col gap-4">
        {ids.map((id) => (
          <ShipmentRow key={id} id={id} role={role} expanded={expandedIds.has(id)} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  )
}
