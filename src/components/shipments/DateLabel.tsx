import type { StepLabel } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Audience } from '../../api/contracts'
import { Chip } from '../ui/Chip'
import { formatRange } from '../format'
import { labelChip, labelKey } from './tones'

export type DateLabelProps = {
  label: StepLabel
  audience: Audience
  date?: string
  to?: string
  dateOnly?: boolean
  variant?: 'step' | 'eta'
}

const colorClasses: Partial<Record<StepLabel, string>> = {
  ACT: 'text-fg',
  EST: 'text-accent',
  AI: 'text-fg',
}

const variantClasses = { step: 'text-meta', eta: 'text-body font-semibold' } as const

/** Label chip (ACT/EST/… for ops, words for customers) and formatted date. */
export function DateLabel({ label, audience, date, to, dateOnly, variant = 'step' }: DateLabelProps) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Chip tone={labelChip[label]}>{t(labelKey(label, audience))}</Chip>
      {date && (
        <time dateTime={date} className={`font-mono tabular-nums ${variantClasses[variant]} ${colorClasses[label] ?? 'text-fg-muted'}`}>
          {formatRange(date, to, dateOnly)}
        </time>
      )}
    </span>
  )
}
