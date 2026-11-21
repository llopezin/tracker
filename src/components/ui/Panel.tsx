import type { AriaAttributes, AriaRole, ReactNode } from 'react'

export type PanelTone = 'surface' | 'surface-signal' | 'muted' | 'signal-wash'
export type PanelRadius = 'md' | 'lg'
export type PanelElement = 'div' | 'section' | 'article'

export type PanelProps = AriaAttributes & {
  tone?: PanelTone
  radius?: PanelRadius
  as?: PanelElement
  /** Only padding, display, flex, grid, gap and overflow. Never bg-, border-, rounded- or text-. */
  layout?: string
  role?: AriaRole
  children?: ReactNode
}

const toneClasses: Record<PanelTone, string> = {
  surface: 'border border-border bg-surface',
  'surface-signal': 'border border-signal-border bg-surface',
  muted: 'border border-border-strong bg-surface-muted',
  'signal-wash': 'border border-signal-border bg-signal-wash',
}

const radiusClasses: Record<PanelRadius, string> = {
  md: 'rounded-md',
  lg: 'rounded-lg',
}

export function Panel({
  tone = 'surface',
  radius = 'md',
  as: El = 'div',
  layout = '',
  children,
  ...aria
}: PanelProps) {
  return (
    <El className={`${toneClasses[tone]} ${radiusClasses[radius]} ${layout}`} {...aria}>
      {children}
    </El>
  )
}
