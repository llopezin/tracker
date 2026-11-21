import { Link, createFileRoute } from '@tanstack/react-router'
import { t } from '../i18n/t'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

const entries = [
  { to: '/ops', label: 'ui.index.ops', hint: 'ui.index.opsHint' },
  { to: '/subsidiary', label: 'ui.index.subsidiary', hint: 'ui.index.subsidiaryHint' },
  { to: '/customer', label: 'ui.index.customer', hint: 'ui.index.customerHint' },
] as const

function IndexPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10 text-fg">
      <h1 className="text-title">{t('ui.index.title')}</h1>
      <nav aria-label={t('ui.index.title')}>
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.to}>
              <Link
                to={e.to}
                className="flex flex-col rounded-lg border border-border bg-surface px-4 py-3 text-fg hover:bg-surface-hover"
              >
                <span className="text-ui font-semibold">{t(e.label)}</span>
                <span className="text-note text-fg-muted">{t(e.hint)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
