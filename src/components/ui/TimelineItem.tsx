import type { ComponentProps } from 'react'

export type TimelineItemTone = 'solid' | 'solid-signal' | 'dotted' | 'hollow'
export type TimelineItemConnector = 'solid' | 'dashed'

export type TimelineItemProps = Omit<ComponentProps<'li'>, 'className' | 'style'> & {
  tone: TimelineItemTone
  /** Line to the next step; without it, this is the last one. */
  connector?: TimelineItemConnector
}

const dotClasses: Record<TimelineItemTone, string> = {
  solid: 'bg-accent',
  'solid-signal': 'bg-signal',
  dotted: 'border-2 border-dotted border-fg bg-surface-muted',
  hollow: 'border-2 border-mid bg-surface',
}

const connectorClasses: Record<TimelineItemConnector, string> = {
  solid: 'w-0.5 bg-border-strong',
  dashed: 'w-0 border-l-2 border-dashed border-border-strong',
}

export function TimelineItem({ tone, connector, children, ...rest }: TimelineItemProps) {
  return (
    <li className="grid grid-cols-[14px_1fr] gap-2.5" {...rest}>
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className={`mt-1 size-2.5 shrink-0 rounded-full ${dotClasses[tone]}`} />
        {connector && <span className={`mt-0.5 flex-1 ${connectorClasses[connector]}`} />}
      </div>
      <div className="min-w-0 pb-3.5">{children}</div>
    </li>
  )
}
