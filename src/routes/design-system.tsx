import { createFileRoute } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '../components/ui/Button'
import type { ButtonTone } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import type { ChipTone } from '../components/ui/Chip'
import { EtaFlag } from '../components/ui/EtaFlag'
import { Icon } from '../components/ui/Icon'
import type { IconName } from '../components/ui/Icon'
import { IconTile } from '../components/ui/IconTile'
import type { IconTileTone } from '../components/ui/IconTile'
import { Label } from '../components/ui/Label'
import { Panel } from '../components/ui/Panel'
import type { PanelTone } from '../components/ui/Panel'
import { RefTag } from '../components/ui/RefTag'
import { SearchField } from '../components/ui/SearchField'
import { Tag } from '../components/ui/Tag'
import { TimelineItem } from '../components/ui/TimelineItem'
import { ToggleButton } from '../components/ui/ToggleButton'
// Dev-only showcase of ui/ primitives. Not linked; renders nothing in production builds.
export const Route = createFileRoute('/design-system')({
  component: () => (import.meta.env.DEV ? <DesignSystemPage /> : null),
})

const iconNames: IconName[] = [
  'truck',
  'ship',
  'hold',
  'clock',
  'doc-alert',
  'doc',
  'box',
  'check',
  'chevron-down',
  'chevron-right',
  'search',
  'alert-triangle',
]

const buttonTones: ButtonTone[] = ['default', 'solid', 'solid-signal', 'ghost']

const chipTones: ChipTone[] = ['solid', 'outline-accent', 'dashed-muted', 'dashed', 'dotted']

const iconTileTones: IconTileTone[] = [
  'soft-accent',
  'solid-signal',
  'soft-signal',
  'dotted',
  'dashed-strong',
  'neutral',
  'solid',
]

const panelTones: PanelTone[] = ['surface', 'surface-signal', 'muted', 'signal-wash']

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <Label as="h2">{title}</Label>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-6 bg-page p-6 text-fg">
      <h1 className="text-title">Design system</h1>

      <Section title="Icon">
        {iconNames.map((name) => (
          <span key={name} className="inline-flex flex-col items-center gap-1 text-caption">
            <Icon name={name} />
            {name}
          </span>
        ))}
        <Icon name="chevron-right" rotate={90} label="rotate 90" />
        <Icon name="chevron-right" rotate={180} label="rotate 180" />
        <Icon name="truck" size={12} />
        <Icon name="truck" size={14} />
        <Icon name="truck" size={18} />
        <Icon name="truck" size={20} />
      </Section>

      <Section title="Button">
        {buttonTones.map((tone) => (
          <Button key={`${tone}-md`} tone={tone}>
            {tone} md
          </Button>
        ))}
        {buttonTones.map((tone) => (
          <Button key={`${tone}-sm`} tone={tone} size="sm">
            {tone} sm
          </Button>
        ))}
        <Button tone="ghost" icon={<Icon name="chevron-down" />} aria-label="Expand" />
        <Button size="sm" disabled>
          Disabled
        </Button>
      </Section>

      <Section title="Label">
        <Label>md subtle</Label>
        <Label tone="muted">md muted</Label>
        <Label size="sm">sm subtle</Label>
        <Label size="sm" tone="muted">
          sm muted
        </Label>
      </Section>

      <Section title="Chip">
        {chipTones.map((tone) => (
          <Chip key={tone} tone={tone}>
            {tone}
          </Chip>
        ))}
      </Section>

      <Section title="Tag">
        <Tag tone="soft-accent">Carrier API</Tag>
        <Tag tone="soft-signal">Customs hold</Tag>
      </Section>

      <Section title="EtaFlag">
        <EtaFlag tone="solid-signal">+1 d</EtaFlag>
        <EtaFlag tone="solid-signal" icon={<Icon name="clock" size={12} />}>
          Delayed
        </EtaFlag>
        <EtaFlag tone="dashed">Not available</EtaFlag>
        <EtaFlag tone="dashed-strong" icon={<Icon name="clock" size={12} />}>
          Stale
        </EtaFlag>
      </Section>

      <Section title="RefTag">
        <RefTag>NHLU4821937</RefTag>
        <RefTag variant="route">Zaragoza, ES → Querétaro, MX</RefTag>
      </Section>

      <Section title="IconTile">
        {iconTileTones.map((tone) => (
          <IconTile key={`${tone}-md`} tone={tone} label={tone}>
            <Icon name="truck" size={20} />
          </IconTile>
        ))}
        {iconTileTones.map((tone) => (
          <IconTile key={`${tone}-sm`} tone={tone} size="sm">
            <Icon name="truck" />
          </IconTile>
        ))}
      </Section>

      <Section title="Panel">
        {panelTones.map((tone) => (
          <Panel key={`${tone}-md`} tone={tone} layout="p-4">
            {tone} md
          </Panel>
        ))}
        {panelTones.map((tone) => (
          <Panel key={`${tone}-lg`} tone={tone} radius="lg" as="section" layout="p-4">
            {tone} lg
          </Panel>
        ))}
      </Section>

      <Section title="SearchField">
        <SearchField label="Search shipments" placeholder="Search…" value="" onChange={() => {}} />
      </Section>

      <Section title="ToggleButton">
        <ToggleButton pressed={false} count={12}>
          Idle
        </ToggleButton>
        <ToggleButton pressed count={12}>
          Pressed
        </ToggleButton>
        <ToggleButton pressed={false} count={3} countTone="signal">
          Signal idle
        </ToggleButton>
        <ToggleButton pressed count={3} countTone="signal">
          Signal pressed
        </ToggleButton>
      </Section>

      <Section title="TimelineItem">
        <ol className="flex flex-col">
          <TimelineItem tone="solid" connector="solid">
            Done
          </TimelineItem>
          <TimelineItem tone="solid-signal" connector="solid">
            Hold
          </TimelineItem>
          <TimelineItem tone="dotted" connector="solid">
            AI-read
          </TimelineItem>
          <TimelineItem tone="hollow" connector="dashed">
            Next
          </TimelineItem>
          <TimelineItem tone="hollow">Future</TimelineItem>
        </ol>
      </Section>

    </div>
  )
}
