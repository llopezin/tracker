import type { ComponentProps } from 'react'

export type ChipTone = 'solid' | 'outline-accent' | 'dashed-muted' | 'dashed' | 'dotted'

export type ChipProps = Omit<ComponentProps<'span'>, 'className' | 'style'> & {
  tone: ChipTone
}

const baseClasses =
  'inline-block whitespace-nowrap rounded-chip px-1.25 py-px font-mono tabular-nums text-chip font-semibold tracking-chip'

// dotted: keep border and text in sync with IconTile (the background differs on purpose).
const toneClasses: Record<ChipTone, string> = {
  solid: 'border border-fg bg-fg text-on-solid',
  'outline-accent': 'border border-accent bg-surface text-accent',
  'dashed-muted': 'border border-dashed border-border-dash bg-surface-muted text-fg-muted',
  dashed: 'border border-dashed border-mid bg-surface text-fg-muted',
  dotted: 'border-[1.5px] border-dotted border-fg bg-surface text-fg',
}

export function Chip({ tone, ...rest }: ChipProps) {
  return <span className={`${baseClasses} ${toneClasses[tone]}`} {...rest} />
}
