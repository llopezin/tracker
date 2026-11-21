import type { StepView } from '../../domain/types'
import { t } from '../../i18n/t'
import { formatDate } from '../format'

export type SourceLineProps = {
  source: Pick<StepView['sources'][number], 'operator' | 'receivedAt'>
}

/** Who reported it and when. The provider label ("Operator API · …") is shown only for AI sources (AiSourceBox). */
export function SourceLine({ source }: SourceLineProps) {
  return (
    <p className="flex flex-wrap items-center justify-end gap-1.5 text-note text-fg-subtle">
      <span>{source.operator}</span>
      {source.receivedAt && <span>{t('ui.source.received', { date: formatDate(source.receivedAt) })}</span>}
    </p>
  )
}
