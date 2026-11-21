import { NOW_MS } from '../domain/clock'
import { en } from '../i18n/en'
import type { MessageKey } from '../i18n/en'
import { t } from '../i18n/t'

// All ISO → text formatting for components: en-GB, Europe/Madrid. "Mon 23 Nov · 14:00".
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function parts(iso: string) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return { day: `${p.weekday} ${p.day} ${p.month}`, time: `${p.hour}:${p.minute}` }
}

export const formatDay = (iso: string) => parts(iso).day
export const formatTime = (iso: string) => parts(iso).time

export function formatDate(iso: string, dateOnly = false): string {
  const p = parts(iso)
  return dateOnly ? p.day : `${p.day} · ${p.time}`
}

/** A date or a range ("Mon 23 Nov · 14:00–16:00"). */
export function formatRange(from: string, to?: string, dateOnly = false): string {
  if (!to) return formatDate(from, dateOnly)
  const a = parts(from)
  const b = parts(to)
  if (dateOnly) return a.day === b.day ? a.day : `${a.day} – ${b.day}`
  return a.day === b.day ? `${a.day} · ${a.time}–${b.time}` : `${formatDate(from)} – ${formatDate(to)}`
}

/** "Updated 25 min ago", against the fixed clock. */
export function updatedAgo(iso: string): string {
  const min = Math.max(0, Math.round((NOW_MS - Date.parse(iso)) / 60_000))
  if (min < 60) return t('ui.updated.min', { n: min })
  const h = Math.floor(min / 60)
  if (h < 48) return t('ui.updated.h', { n: h })
  return t('ui.updated.d', { n: Math.floor(h / 24) })
}

export const hoursSince = (iso: string) => Math.floor((NOW_MS - Date.parse(iso)) / 3_600_000)

/** For i18n keys that arrive as plain strings in the view (e.g. `ShipmentView.status`). */
export function tKey(key: string, params?: Record<string, string | number>): string {
  return key in en ? t(key as MessageKey, params) : key
}
