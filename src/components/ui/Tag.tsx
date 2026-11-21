import type { ComponentProps } from 'react'

export type TagTone = 'soft-accent' | 'soft-signal' | 'soft-warning' | 'soft-danger'

export type TagProps = Omit<ComponentProps<'span'>, 'className' | 'style'> & {
  tone: TagTone
}

const baseClasses = 'inline-block whitespace-nowrap rounded-chip px-1.25 font-mono tabular-nums text-caption'

const toneClasses: Record<TagTone, string> = {
  'soft-accent': 'bg-accent-soft text-accent-strong',
  'soft-signal': 'bg-signal-soft text-signal-fg',
  'soft-warning': 'bg-warning-soft text-warning-fg',
  'soft-danger': 'bg-danger-soft text-danger-fg',
}

export function Tag({ tone, ...rest }: TagProps) {
  return <span className={`${baseClasses} ${toneClasses[tone]}`} {...rest} />
}
