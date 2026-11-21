import type { ShipmentView, StepView } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Role } from '../../api/contracts'
import { getPersona } from '../../api/client'
import { Chip } from '../ui/Chip'
import { Tag } from '../ui/Tag'
import { TimelineItem } from '../ui/TimelineItem'
import type { TimelineItemConnector } from '../ui/TimelineItem'
import { formatDate, formatRange } from '../format'
import { AiSourceBox } from './AiSourceBox'
import { DateLabel } from './DateLabel'
import { SourceLine } from './SourceLine'
import { stepDot } from './tones'

export type TimelineStepProps = {
  shipmentId: string
  step: StepView
  phase: 'done' | 'next'
  role: Role
  connector?: TimelineItemConnector
  /** Pending AI date for this step (ops only). */
  aiAlternative?: ShipmentView['aiAlternative']
}

export function TimelineStep({ shipmentId, step, phase, role, connector, aiAlternative }: TimelineStepProps) {
  const { audience } = getPersona(role)
  const isOps = audience === 'ops'
  return (
    <TimelineItem tone={stepDot(step, phase)} connector={connector}>
      <p className="text-ui font-medium">
        {step.event}
        {step.location && <span className="font-normal text-fg-muted"> · {step.location}</span>}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-meta text-fg-subtle">
        {step.previousDate && (
          <s className="font-mono tabular-nums">{t('ui.was', { date: formatDate(step.previousDate) })}</s>
        )}
        <DateLabel label={step.label} audience={audience} date={step.date} />
        {step.note && <Tag tone="soft-signal">{step.note}</Tag>}
        {!step.sources.some((s) => s.operator === step.operator) && <span>{step.operator}</span>}
      </div>
      {isOps && aiAlternative && (
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-note text-fg-muted">
          <Chip tone="dotted">{t('ui.ai.confidence', { pct: Math.round(aiAlternative.confidence * 100) })}</Chip>
          <span className="font-mono tabular-nums">{formatRange(aiAlternative.from, aiAlternative.to)}</span>
          <span>{t('ui.ai.alternative')}</span>
        </p>
      )}
      {step.sources.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {step.sources.map((source, i) =>
            isOps && source.ai ? (
              <AiSourceBox key={i} shipmentId={shipmentId} source={{ ...source, ai: source.ai }} role={role} />
            ) : (
              <div key={i} className="flex flex-col gap-1">
                <SourceLine source={source} />
                {isOps && step.label === 'UNKNOWN' && source.raw && (
                  <p className="rounded-sm bg-surface-muted px-2 py-1 font-mono text-note text-fg-soft">
                    {t('ui.source.raw', { raw: source.raw })}
                  </p>
                )}
              </div>
            ),
          )}
        </div>
      )}
    </TimelineItem>
  )
}
