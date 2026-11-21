import type { Role } from '../../api/contracts'
import { useNotices } from '../../data/shipments'
import type { Notice } from '../../domain/types'
import { t } from '../../i18n/t'
import { Icon } from '../ui/Icon'
import { Panel } from '../ui/Panel'
import { Tag } from '../ui/Tag'
import { formatDay } from '../format'
import { noticeTag } from './tones'

export type CustomerNoticeProps = {
  role: Role
  onSelect: (shipmentId: string) => void
}

const statusText = (n: Notice) =>
  n.kind === 'late'
    ? n.days ? t('notice.late', { days: n.days }) : t('notice.delayed')
    : t(n.kind === 'overdue' ? 'notice.overdue' : 'notice.customs')

/** One line per affected shipment: fields, not sentences. */
export function CustomerNotice({ role, onSelect }: CustomerNoticeProps) {
  const notices = useNotices(role)
  if (notices.length === 0) return null
  return (
    <Panel tone="signal-wash" radius="lg" as="section" aria-label={t('ui.notice.label')} layout="overflow-hidden">
      <ul className="divide-y divide-signal-border">
        {notices.map((notice) => {
          const extras = [
            notice.newEta && t('notice.newEta', { date: formatDay(notice.newEta) }),
            notice.place,
            notice.reason !== statusText(notice) ? notice.reason : undefined,
          ].filter((text): text is string => Boolean(text))
          return (
            <li key={notice.shipmentId}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-ui hover:bg-signal-soft"
                onClick={() => onSelect(notice.shipmentId)}
              >
                <Icon name="alert-triangle" size={14} />
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono font-semibold tabular-nums">{notice.shipmentId}</span>
                  <span aria-hidden="true" className="text-fg-subtle">·</span>
                  <Tag tone={noticeTag[notice.kind]}>{statusText(notice)}</Tag>
                  {extras.map((text) => (
                    <span key={text} className="flex items-center gap-x-2">
                      <span aria-hidden="true" className="text-fg-subtle">·</span>
                      <span className="text-fg-soft">{text}</span>
                    </span>
                  ))}
                </span>
                <span className="text-fg-subtle">
                  <Icon name="chevron-right" size={14} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
