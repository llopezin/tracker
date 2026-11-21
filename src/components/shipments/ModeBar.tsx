import type { ShipmentView } from '../../domain/types'
import { t } from '../../i18n/t'
import { Icon } from '../ui/Icon'

export type ModeBarProps = {
  view: ShipmentView
}

const patternClasses = { road: 'bar-road', sea: 'bar-sea', port: 'bar-port' } as const

const modeIcons = { road: 'truck', sea: 'ship', port: 'box' } as const

/** Stops above the stages, operators below. A stage starts at its own stop unless it follows a port (same place). */
export function ModeBar({ view }: ModeBarProps) {
  const { stages } = view
  const tone = view.stale ? { bar: 'bar-muted', marker: 'bg-mid' } : { bar: 'bar-ok', marker: 'bg-bar-ok' }
  const moving = !view.delivered && view.status !== 'tag.NOT_DEPARTED'
  const stop = (i: number) => (i === 0 ? view.origin : stages[i - 1].kind === 'port' ? '' : stages[i].from)
  const label = stages.map((s) => `${t(`route.${s.kind}`)} ${s.from} → ${s.to} · ${s.operator}`).join('; ')
  return (
    <div role="img" aria-label={label} className="flex flex-col gap-1">
      <div
        className="grid gap-x-0.5 gap-y-1.5"
        style={{ gridTemplateColumns: stages.map((s) => `${s.weight}fr`).join(' ') }}
      >
        {stages.map((stage, i) => {
          const segment = (filled: boolean) => (
            <span className={`h-2 basis-0 grow rounded-xs ${patternClasses[stage.kind]} ${filled ? tone.bar : 'bar-track'}`} />
          )
          const column = { gridColumn: i + 1 }
          return [
            <span key="stop" style={column} className="row-start-1 hidden justify-between gap-2 text-caption font-semibold sm:flex">
              <span>{stop(i)}</span>
              {i === stages.length - 1 && <span className="text-right">{view.destination}</span>}
            </span>,
            <span key="bar" style={column} className="row-start-2 flex items-center gap-0.5">
              {stage.progress > 0 && segment(true)}
              {stage.current && moving && <span className={`size-3 shrink-0 rounded-chip ${tone.marker}`} />}
              {stage.progress < 100 && segment(false)}
            </span>,
            <span
              key="operator"
              style={column}
              className={`row-start-3 hidden items-start justify-center gap-1 px-1 text-center text-caption sm:flex ${stage.current ? 'font-semibold text-fg' : 'text-fg-subtle'}`}
            >
              <Icon name={modeIcons[stage.kind]} size={12} />
              {stage.operator}
            </span>,
          ]
        })}
      </div>
      <p className="text-caption text-fg-subtle sm:hidden">
        {[view.origin, ...stages.slice(0, -1).filter((s) => s.kind !== 'port').map((s) => s.to), view.destination].join(' → ')}
        {' · '}
        {[...new Set(stages.map((s) => s.operator))].join(' · ')}
      </p>
    </div>
  )
}
