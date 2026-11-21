import type { ShipmentView, StepView } from '../../domain/types'
import { t } from '../../i18n/t'
import type { Audience, Role } from '../../api/contracts'
import { getPersona } from '../../api/client'
import { useRecordActivity, useShipments } from '../../data/shipments'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Label } from '../ui/Label'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { formatTime } from '../format'
import { focusDetail } from './focusDetail'
import { TimelineStep } from './TimelineStep'
import { documentTag } from './tones'

export type ShipmentDetailProps = {
  shipmentId: string
  role: Role
  id: string
}

export function ShipmentDetail({ shipmentId, role, id }: ShipmentDetailProps) {
  const view = useShipments(role, (list) => list.find((s) => s.id === shipmentId)!)
  const { audience } = getPersona(role)
  const isOps = audience === 'ops'
  const altStep = view.eta.scope === 'none' ? -1 : view.next.findIndex((s) => s.date === (view.eta.scope === 'none' ? '' : view.eta.from))
  return (
    <div id={id} tabIndex={-1} className="grid gap-6 border-t border-divider bg-surface-hover px-4 pb-5 pt-4 md:grid-cols-3">
      <Timeline title={t('ui.detail.done')} phase="done" steps={view.done} view={view} role={role} />
      <Timeline
        title={t('ui.detail.next')}
        phase="next"
        steps={view.next}
        view={view}
        role={role}
        altIndex={isOps ? altStep : -1}
      />
      <div className="flex flex-col gap-4">
        {isOps && view.incidents.length > 0 && (
          <section className="flex flex-col gap-2">
            <Label as="h3">{t('ui.detail.incidents')}</Label>
            <ul className="flex flex-col gap-1">
              {view.incidents.map((incident) => (
                <li key={incident.type} className="flex items-start gap-1.5 text-note text-signal-fg">
                  <Icon name="alert-triangle" size={14} />
                  {incident.summary}
                </li>
              ))}
            </ul>
          </section>
        )}
        {isOps && view.actions.length > 0 && <Actions view={view} role={role} />}
        {view.documents.length > 0 && <Documents view={view} audience={audience} role={role} />}
      </div>
    </div>
  )
}

type TimelineProps = {
  title: string
  phase: 'done' | 'next'
  steps: StepView[]
  view: ShipmentView
  role: Role
  altIndex?: number
}

function Timeline({ title, phase, steps, view, role, altIndex = -1 }: TimelineProps) {
  const connector = phase === 'done' ? 'solid' : 'dashed'
  return (
    <section className="flex flex-col gap-2">
      <Label as="h3">{title}</Label>
      {steps.length === 0 ? (
        <p className="text-note text-fg-subtle">{t('ui.detail.noSteps')}</p>
      ) : (
        <ol className="flex flex-col">
          {steps.map((step, i) => (
            <TimelineStep
              key={i}
              shipmentId={view.id}
              step={step}
              phase={phase}
              role={role}
              connector={i < steps.length - 1 ? connector : undefined}
              aiAlternative={i === altIndex ? view.aiAlternative : undefined}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function Actions({ view, role }: { view: ShipmentView; role: Role }) {
  const record = useRecordActivity(role)
  const actions = [...view.actions].sort((a, b) => Number(b.primary) - Number(a.primary))
  const run = (action: ShipmentView['actions'][number]) => {
    let docKey: string | undefined
    if (action.kind === 'upload_document') {
      // Same choice as the mapper: first missing, else first flagged (the optional e-CMR never counts).
      const required = view.documents.filter((d) => d.key !== 'cmr')
      docKey = (required.find((d) => d.status === 'missing') ?? required.find((d) => d.status === 'flagged'))?.key
      if (docKey) record({ type: 'upload', shipmentId: view.id, docKey })
    }
    record({ type: 'act', shipmentId: view.id, actionKey: action.key, docKey })
    focusDetail(view.id)
  }
  return (
    <section className="flex flex-col gap-2">
      <Label as="h3">{t('ui.detail.actions')}</Label>
      {actions.map((action) => (
        <Panel key={action.key} tone={action.primary && !action.done ? 'surface-signal' : 'surface'} layout="flex flex-col items-start gap-2 p-3">
          <p className="text-note text-fg-soft">{action.text}</p>
          {action.done ? (
            <p className="flex items-center gap-1.5 text-note text-fg-muted">
              <Icon name="check" size={14} />
              {t('action.done', { by: action.done.by, time: formatTime(action.done.at) })}
            </p>
          ) : (
            <>
              <Button
                size="sm"
                tone={action.primary ? 'solid-signal' : 'default'}
                disabled={action.blockedBy !== undefined}
                onClick={() => run(action)}
              >
                {t(`action.button.${action.kind}`)}
              </Button>
              {action.blockedBy && <p className="text-caption text-fg-subtle">{t('action.blocked')}</p>}
            </>
          )}
        </Panel>
      ))}
    </section>
  )
}

function Documents({ view, audience, role }: { view: ShipmentView; audience: Audience; role: Role }) {
  const record = useRecordActivity(role)
  const isOps = audience === 'ops'
  return (
    <section className="flex flex-col gap-2">
      <Label as="h3">{t('ui.detail.documents')}</Label>
      <Panel layout="overflow-hidden">
        <ul className="divide-y divide-divider">
          {view.documents.map((doc) => {
            const missing = doc.status === 'missing'
            return (
              <li key={doc.key} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <Icon name={missing || doc.status === 'flagged' ? 'doc-alert' : 'doc'} />
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-medium">{doc.name}</p>
                  {isOps && doc.note && <p className="text-caption text-fg-subtle">{doc.note}</p>}
                </div>
                {isOps && <Tag tone={documentTag[doc.status].tone}>{t(documentTag[doc.status].label)}</Tag>}
                {!isOps && missing ? (
                  <span className="text-note text-fg-muted">{t('ui.doc.preparing')}</span>
                ) : (
                  <>
                    {!missing && (
                      <Button size="sm" tone="ghost" aria-label={t('ui.doc.openAria', { name: doc.name })}>
                        {t('ui.doc.open')}
                      </Button>
                    )}
                    {isOps && (missing || doc.status === 'flagged') && (
                      <Button size="sm" onClick={() => { record({ type: 'upload', shipmentId: view.id, docKey: doc.key }); focusDetail(view.id) }}>
                        {t('ui.doc.upload')}
                      </Button>
                    )}
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
    </section>
  )
}
