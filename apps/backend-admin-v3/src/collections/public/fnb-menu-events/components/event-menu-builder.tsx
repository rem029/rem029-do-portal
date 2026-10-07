'use client'

import React, { useState, useCallback } from 'react'
import { useEventMenu } from './use-event-menu'
import { CategoriesPanel } from './panels/categories-panel'
import { ItemsPanel } from './panels/items-panel'
import { MenusPanel } from './panels/menus-panel'
import { InfoIcon, PanelStyles, sp } from './panels/_shared/ui'

const Gate: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: sp.md,
      padding: 'calc(var(--base) * 1.1) var(--base)',
      border: '1px dashed var(--theme-elevation-200)',
      borderRadius: 'var(--style-radius-m)',
      color: 'var(--theme-elevation-600)',
      fontSize: 13.5,
      lineHeight: 1.5,
    }}
  >
    <span style={{ flexShrink: 0, display: 'inline-flex', opacity: 0.7 }}>
      <InfoIcon size={16} />
    </span>
    <span>{children}</span>
  </div>
)

export const EventMenuBuilder: React.FC = () => {
  const s = useEventMenu()
  const [refreshToken, setRefreshToken] = useState(0)

  const handleMenusChanged = useCallback(() => {
    setRefreshToken((prev) => prev + 1)
  }, [])

  if (!s.eventId) {
    return <Gate>Save this event first — then build its menu here.</Gate>
  }

  if (!s.operatorId || !s.restaurantId) {
    return (
      <Gate>
        Pick an operator and a Venue in the sidebar to start building this event&apos;s menu.
      </Gate>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <PanelStyles />
      <p
        style={{
          margin: `0 0 ${sp.xs}`,
          maxWidth: '58ch',
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--theme-elevation-600)',
        }}
      >
        Build this event&apos;s menu from categories and the venue&apos;s items, then attach the
        menus you want guests to see. Changes are saved with the event.
      </p>

      <ItemsPanel
        eventId={s.eventId}
        restaurantId={s.restaurantId}
        locale={s.locale}
        localeLabel={s.localeLabel}
        refreshToken={refreshToken}
        onItemSaved={handleMenusChanged}
      />

      <MenusPanel
        eventId={s.eventId}
        restaurantId={s.restaurantId}
        locale={s.locale}
        menuIds={s.menuIds}
        setMenuIds={s.setMenuIds}
        onMenusChanged={handleMenusChanged}
        refreshToken={refreshToken}
      />

      <CategoriesPanel
        eventId={s.eventId}
        restaurantId={s.restaurantId}
        locale={s.locale}
        localeLabel={s.localeLabel}
        refreshToken={refreshToken}
        menuIds={s.menuIds}
        setMenuIds={s.setMenuIds}
        onMenusChanged={handleMenusChanged}
      />
    </div>
  )
}

export default EventMenuBuilder
