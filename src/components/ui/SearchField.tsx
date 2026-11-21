import type { ComponentProps } from 'react'
import { Icon } from './Icon'

export type SearchFieldProps = Omit<ComponentProps<'input'>, 'className' | 'style' | 'type'> & {
  label: string
}

export function SearchField({ label, ...inputProps }: SearchFieldProps) {
  return (
    <label className="flex h-9 min-w-65 items-center gap-2 rounded-md border border-border-control bg-surface px-2.5 text-fg-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
      <span className="sr-only">{label}</span>
      <Icon name="search" />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent font-mono text-ui tabular-nums text-fg outline-none"
        {...inputProps}
      />
    </label>
  )
}
