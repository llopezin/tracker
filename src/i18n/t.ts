import { en } from './en'
import type { MessageKey } from './en'

/** Looks up a message and replaces `{param}` placeholders. Pure TS, usable from domain/. */
export function t(key: MessageKey, params: Record<string, string | number> = {}): string {
  return en[key].replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`))
}
