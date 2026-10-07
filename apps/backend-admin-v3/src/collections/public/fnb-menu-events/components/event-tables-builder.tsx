'use client'

import React from 'react'
import { useEventMenu } from './use-event-menu'
import { TablesPanel } from './panels/tables-panel'
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

export const EventTablesBuilder: React.FC = () => {
  const s = useEventMenu()

  if (!s.eventId) {
    return <Gate>Save this event first — then manage tables here.</Gate>
  }

  if (!s.operatorId || !s.restaurantId) {
    return (
      <Gate>
        Pick an operator and a Venue in the sidebar to start managing this event&apos;s tables.
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
        Manage tables and QR codes for this event&apos;s venue. Tables are available to all guests
        ordering at this venue.
      </p>

      <TablesPanel eventId={s.eventId} restaurantId={s.restaurantId} eventSlug={s.eventSlug} />
    </div>
  )
}

export default EventTablesBuilder
