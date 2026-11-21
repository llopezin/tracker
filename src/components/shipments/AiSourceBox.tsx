import type { StepView } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Role } from '../../api/contracts'
import { useRecordActivity } from '../../data/shipments'
import { Button } from '../ui/Button'
import { Label } from '../ui/Label'
import { Panel } from '../ui/Panel'
import { formatTime } from '../format'
import { aiReviewIdOf, focusDetail } from './focusDetail'

type Source = StepView['sources'][number]

export type AiSourceBoxProps = {
  shipmentId: string
  source: Source & { ai: NonNullable<Source['ai']> }
  role: Role
}

/** Ops only: the original email and the human review of an AI reading. */
export function AiSourceBox({ shipmentId, source, role }: AiSourceBoxProps) {
  const { ai } = source
  const record = useRecordActivity(role)
  const review = (review: 'accepted' | 'rejected') => {
    record({ type: 'review', aiId: ai.id, review })
    focusDetail(shipmentId)
  }
  return (
    <Panel id={ai.review === 'pending' ? aiReviewIdOf(shipmentId) : undefined} tone="muted" layout="flex flex-col gap-2 p-3">
      {source.raw && (
        <>
          <Label size="sm">{t('ui.ai.rawEmail')}</Label>
          <p className="whitespace-pre-line rounded-sm bg-surface px-2.5 py-2 text-note text-fg-soft">{source.raw}</p>
        </>
      )}
      {ai.review === 'pending' ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" tone="solid" onClick={() => review('accepted')}>
            {t('ui.ai.accept')}
          </Button>
          <Button size="sm" onClick={() => review('rejected')}>
            {t('ui.ai.reject')}
          </Button>
        </div>
      ) : (
        <p className="text-note text-fg-muted">
          {t(ai.review === 'accepted' ? 'ui.ai.accepted' : 'ui.ai.rejected')}
          {ai.reviewedBy && ai.reviewedAt && ` · ${t('ui.ai.reviewedBy', { by: ai.reviewedBy, time: formatTime(ai.reviewedAt) })}`}
        </p>
      )}
    </Panel>
  )
}
