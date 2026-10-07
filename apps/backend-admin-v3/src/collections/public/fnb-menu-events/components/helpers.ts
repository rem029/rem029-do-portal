import { slugify } from 'payload/shared'
import type { Config } from '@/payload-types'

/** Relationship value → id string. Handles string | number | {id} | {value}. */
export const relId = (val: unknown): string => {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number') return String(val)
  if (typeof val === 'object' && val !== null) {
    const o = val as { id?: string | number; value?: string | number }
    if (o.id !== undefined) return String(o.id)
    if (o.value !== undefined) return String(o.value)
  }
  return ''
}

/** Computes a client-safe deterministic menu slug from category title and restaurant slug. */
export const menuSlug = (categoryTitle: string, restaurantSlug: string): string => {
  const base = `${categoryTitle}-${restaurantSlug}`
  const s = (slugify(base) || '').replace(/^[^a-z0-9]+/, '')
  return s || `menu-${Date.now()}`
}

/* -------------------------------------------------------------------------- */
/* Locale helpers — shared by the event builder's server actions and any      */
/* Payload collection hook that needs to resolve a localized field outside a  */
/* request (e.g. the menu-items category → menu sync hook).                   */
/* -------------------------------------------------------------------------- */

export type ConfiguredLocale = Config['locale']
export const CONFIGURED_LOCALES = ['en', 'ar', 'fr'] as const satisfies readonly ConfiguredLocale[]

export function resolveLocale(locale?: string | null): ConfiguredLocale {
  if (locale && (CONFIGURED_LOCALES as readonly string[]).includes(locale)) {
    return locale as ConfiguredLocale
  }
  return 'en'
}

export function resolveString(val: unknown, locale: string = 'en'): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object') {
    const rec = val as Record<string, string>
    return rec[locale] || rec.en || ''
  }
  return ''
}

