import type { ComponentProps } from 'react'

export type LabelSize = 'md' | 'sm'
export type LabelTone = 'subtle' | 'muted'
export type LabelElement = 'span' | 'h2' | 'h3'

export type LabelProps = Omit<ComponentProps<'span'>, 'className' | 'style' | 'ref'> & {
  size?: LabelSize
  tone?: LabelTone
  as?: LabelElement
}

const baseClasses = 'uppercase font-semibold tracking-label'

const sizeClasses: Record<LabelSize, string> = {
  md: 'text-label',
  sm: 'text-chip',
}

const toneClasses: Record<LabelTone, string> = {
  subtle: 'text-fg-subtle',
  muted: 'text-fg-muted',
}

export function Label({ size = 'md', tone = 'subtle', as: El = 'span', ...rest }: LabelProps) {
  return <El className={`${baseClasses} ${sizeClasses[size]} ${toneClasses[tone]}`} {...rest} />
}
