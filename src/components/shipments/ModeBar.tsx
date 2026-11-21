import type { ShipmentView } from '../../domain/types'
import { barToneFor } from './tones'
import type { BarTone } from './tones'

export type ModeBarProps = {
  view: ShipmentView
}

// stages.weight is relative; clamp to the three flex-grow steps the design uses.
const growClasses = ['grow', 'grow-2', 'grow-3'] as const

const patternClasses = { road: 'bar-road', sea: 'bar-sea', port: 'bar-port' } as const

const paletteClasses: Record<BarTone, string> = {
  ok: 'bar-ok',
  signal: 'bar-signal',
  muted: 'bar-muted',
  solid: 'bar-solid',
}

const markerClasses: Record<BarTone, string> = {
  ok: 'bg-bar-ok',
  signal: 'bg-signal',
  muted: 'bg-mid',
  solid: 'bg-fg',
}

export function ModeBar({ view }: ModeBarProps) {
  const tone = barToneFor(view)
  return (
    <div role="img" aria-label={view.routeText} className="flex items-center gap-0.5">
      {view.stages.map((stage, i) => {
        const grow = growClasses[Math.min(3, Math.max(1, Math.round(stage.weight))) - 1]
        const segment = (filled: boolean) => (
          <span className={`h-2 basis-0 grow rounded-xs ${patternClasses[stage.kind]} ${filled ? paletteClasses[tone] : 'bar-track'}`} />
        )
        // Filled up to stage.progress: an in-progress stage is half filled, with the marker where the shipment is.
        return (
          <span key={i} className={`flex basis-0 items-center gap-0.5 ${grow}`}>
            {stage.progress > 0 && segment(true)}
            {stage.current && !view.delivered && view.status !== 'tag.NOT_DEPARTED' && <span className={`size-3 shrink-0 rounded-chip ${markerClasses[tone]}`} />}
            {stage.progress < 100 && segment(false)}
          </span>
        )
      })}
    </div>
  )
}
