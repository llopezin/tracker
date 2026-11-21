import type { StepView } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Role } from '../../api/contracts'
import { useRecordActivity } from '../../data/shipments'
import { Button } from '../ui/Button'
import { Chip } from '../ui/Chip'
import { Label } from '../ui/Label'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { formatTime } from '../format'
import { focusDetail } from './focusDetail'
import { SourceLine } from './SourceLine'

type Source = StepView['sources'][number]

export type AiSourceBoxProps = {
  shipmentId: string
  source: Source & { ai: NonNullable<Source['ai']> }
  role: Role
}

/** Ops only: the AI reading of an email, the original text, and the human review. */
export function AiSourceBox({ shipmentId, source, role }: AiSourceBoxProps) {
  const { ai } = source
  const record = useRecordActivity(role)
  const review = (review: 'accepted' | 'rejected') => {
    record({ type: 'review', aiId: ai.id, review })
    focusDetail(shipmentId)
  }
  return (
    <Panel tone="muted" layout="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone="dotted">{t('ui.ai.confidence', { pct: Math.round(ai.confidence * 100) })}</Chip>
        <Tag tone="soft-accent">{source.label}</Tag>
        <SourceLine source={source} />
      </div>
      <blockquote className="rounded-sm border-l-2 border-mid bg-surface px-2.5 py-2 text-note text-fg-soft">
        “{ai.quote}”
      </blockquote>
      <p className="flex flex-wrap items-center gap-1.5 text-note">
        <Label size="sm">{t('ui.ai.readAs')}</Label>
        <span>{ai.readAs}</span>
      </p>
      {source.raw && (
        <details className="text-note">
          <summary className="cursor-pointer text-accent">{t('ui.ai.rawEmail')}</summary>
          <p className="mt-1 whitespace-pre-line rounded-sm bg-surface px-2.5 py-2 text-fg-soft">{source.raw}</p>
        </details>
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
