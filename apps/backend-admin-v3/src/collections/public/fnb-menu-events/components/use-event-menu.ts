'use client'

import { useCallback } from 'react'
import { useField, useDocumentInfo, useLocale } from '@payloadcms/ui'
import { relId } from './helpers'

export interface EventMenuState {
  eventId: string // '' when the event is unsaved
  operatorId: string // '' when not picked
  restaurantId: string // '' when not picked
  eventSlug: string // '' when not saved/no slug yet — info.slug, this event's own ordering URL slug
  menuCount: number // c.menus.length
  ready: boolean // eventId && operatorId && restaurantId
  menuIds: string[]
  setMenuIds: (ids: string[]) => void
  locale: string
  localeLabel: string // e.g. "English" — for showing "Title - English" on localized field labels
}

export const useEventMenu = (): EventMenuState => {
  const { id } = useDocumentInfo()
  const localeObj = useLocale()
  const locale = localeObj?.code || 'en'
  // Locale config in this repo always uses plain string labels (see payload.config.ts),
  // but the type also allows Record<string, string> — guard rather than assume.
  const localeLabel =
    localeObj && typeof localeObj.label === 'string' ? localeObj.label : locale
  const { value: operator } = useField<unknown>({ path: 'operator' })
  const { value: restaurant } = useField<unknown>({ path: 'restaurant' })
  const { value: slug } = useField<string>({ path: 'info.slug' })
  const menusField = useField<unknown[]>({ path: 'c.menus' })
  const eventId = relId(id) || (typeof id === 'string' || typeof id === 'number' ? String(id) : '')
  const operatorId = relId(operator)
  const restaurantId = relId(restaurant)
  const eventSlug = typeof slug === 'string' ? slug : ''

  const menuIds = Array.isArray(menusField.value)
    ? (menusField.value.map(relId).filter(Boolean) as string[])
    : []

  const { setValue } = menusField
  const setMenuIds = useCallback(
    (ids: string[]) => {
      setValue(ids)
    },
    [setValue],
  )

  return {
    eventId,
    operatorId,
    restaurantId,
    eventSlug,
    menuCount: menuIds.length,
    ready: Boolean(eventId && operatorId && restaurantId),
    menuIds,
    setMenuIds,
    locale,
    localeLabel,
  }
}

