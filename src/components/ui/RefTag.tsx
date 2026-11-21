import type { ComponentProps } from 'react'

export type RefTagVariant = 'mono' | 'route'

export type RefTagProps = Omit<ComponentProps<'span'>, 'className' | 'style'> & {
  variant?: RefTagVariant
}

const baseClasses =
  'inline-block whitespace-nowrap rounded-full border border-border bg-surface px-1.75 py-px text-caption text-fg-muted'

const variantClasses: Record<RefTagVariant, string> = {
  mono: 'font-mono tabular-nums',
  route: 'font-mono tabular-nums border-dashed',
}

export function RefTag({ variant = 'mono', ...rest }: RefTagProps) {
  return <span className={`${baseClasses} ${variantClasses[variant]}`} {...rest} />
}
