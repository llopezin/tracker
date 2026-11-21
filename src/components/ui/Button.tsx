import type { ComponentProps, ReactNode } from 'react'

export type ButtonTone = 'default' | 'solid' | 'solid-signal' | 'ghost'
export type ButtonSize = 'md' | 'sm'

type ButtonBaseProps = Omit<ComponentProps<'button'>, 'className' | 'style' | 'children'> & {
  tone?: ButtonTone
}

export type ButtonProps = ButtonBaseProps &
  (
    | { children: ReactNode; size?: ButtonSize; icon?: undefined }
    | { children?: undefined; size?: undefined; icon: ReactNode; 'aria-label': string }
  )

const baseClasses =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed'

const sizeClasses: Record<ButtonSize | 'icon', string> = {
  md: 'min-h-8.5 px-3 text-ui',
  sm: 'min-h-7.5 px-2.5 text-note',
  icon: 'min-h-7.5 px-1.5 text-note',
}

const toneClasses: Record<ButtonTone, string> = {
  default: 'bg-surface text-fg border-border-control hover:bg-surface-muted',
  solid: 'bg-fg text-on-solid border-fg hover:bg-fg-soft',
  'solid-signal': 'bg-signal text-on-solid border-signal hover:bg-signal-strong',
  ghost: 'bg-transparent text-fg border-transparent hover:bg-surface-muted',
}

export function Button({ tone = 'default', size = 'md', icon, type = 'button', children, ...rest }: ButtonProps) {
  const sizeKey = icon ? 'icon' : size
  return (
    <button type={type} className={`${baseClasses} ${sizeClasses[sizeKey]} ${toneClasses[tone]}`} {...rest}>
      {icon ?? children}
    </button>
  )
}
