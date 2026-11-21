import type { StepLabel } from '../../domain/types'
import type { MessageKey } from '../../i18n/en'
import { t } from '../../i18n/t'
import type { Audience } from '../../api/contracts'
import { Chip } from '../ui/Chip'
import { EtaFlag } from '../ui/EtaFlag'
import { Label } from '../ui/Label'
import { labelChip, labelKey } from './tones'

const labels: Record<Audience, [StepLabel, MessageKey][]> = {
  ops: [
    ['ACT', 'ui.legend.ops.ACT'],
    ['EST', 'ui.legend.ops.EST'],
    ['PLN', 'ui.legend.ops.PLN'],
    ['NA', 'ui.legend.ops.NA'],
    ['AI', 'ui.legend.ops.AI'],
  ],
  customer: [
    ['ACT', 'ui.legend.customer.ACT'],
    ['EST', 'ui.legend.customer.EST'],
    ['PLN', 'ui.legend.customer.PLN'],
    ['NA', 'ui.legend.customer.NA'],
  ],
}

export function Legend({ audience }: { audience: Audience }) {
  return (
    <section aria-label={t('ui.legend.title')} className="flex flex-col gap-2">
      <Label as="h2">{t('ui.legend.title')}</Label>
      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-note text-fg-muted">
        {labels[audience].map(([label, meaning]) => (
          <div key={label} className="flex items-center gap-1.5">
            <dt>
              <Chip tone={labelChip[label]}>{t(labelKey(label, audience))}</Chip>
            </dt>
            <dd>{t(meaning)}</dd>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <dt>
            <EtaFlag tone="solid-signal">{t('ui.legend.deltaSample')}</EtaFlag>
          </dt>
          <dd>{t('ui.legend.delayed')}</dd>
        </div>
      </dl>
    </section>
  )
}
