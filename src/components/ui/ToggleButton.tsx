import type { ComponentProps } from 'react'

export type ToggleButtonCountTone = 'neutral' | 'signal'

export type ToggleButtonProps = Omit<
  ComponentProps<'button'>,
  'className' | 'style' | 'aria-pressed'
> & {
  pressed: boolean
  count: number
  countTone?: ToggleButtonCountTone
}

const baseClasses =
  'inline-flex h-9 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border text-ui font-medium disabled:opacity-55 disabled:cursor-not-allowed'

const stateClasses: Record<'pressed' | 'idle', string> = {
  pressed: 'bg-fg text-on-solid border-fg hover:bg-fg-soft',
  idle: 'bg-surface text-fg border-border-control hover:bg-surface-muted',
}

const countClasses: Record<'signal' | 'pressed' | 'idle', string> = {
  signal: 'bg-signal text-on-solid',
  pressed: 'bg-on-solid text-fg',
  idle: 'bg-surface-muted text-fg',
}

export function ToggleButton({
  pressed,
  count,
  countTone = 'neutral',
  type = 'button',
  children,
  ...buttonProps
}: ToggleButtonProps) {
  const stateKey = pressed ? 'pressed' : 'idle'
  return (
    <button
      type={type}
      aria-pressed={pressed}
      className={`${baseClasses} pl-3 pr-1.5 ${stateClasses[stateKey]}`}
      {...buttonProps}
    >
      {children}
      <span
        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm font-mono text-note font-semibold tabular-nums ${countClasses[countTone === 'signal' ? 'signal' : stateKey]}`}
      >
        {count}
      </span>
    </button>
  )
}
