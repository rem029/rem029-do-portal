'use client'

import React, { useEffect, useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { getEventStaffUserLabelAction } from './actions'

const extractId = (value: unknown): string | number | undefined => {
  if (value == null) return undefined
  if (typeof value === 'object') return (value as { id?: string | number }).id
  return value as string | number
}

/**
 * Custom cell for the `user` field on the Access tab's Event Staff table.
 * The default relationship cell renders whatever `users`' own `read` access
 * lets the viewer see — a non-super_user can only read their own doc (see
 * `users/index.ts`), so every other staffer shows up as a bare id. This
 * resolves the label through `getEventStaffUserLabelAction`'s narrow bypass
 * instead, scoped to just this field.
 */
export const StaffUserCell: React.FC<DefaultCellComponentProps> = ({ cellData, rowData }) => {
  const userId = extractId(cellData)
  const eventId = extractId(rowData?.event)
  const [label, setLabel] = useState<string | null>(
    typeof cellData === 'object' && cellData !== null
      ? (cellData as { full_name?: string; email?: string }).full_name ||
          (cellData as { email?: string }).email ||
          null
      : null,
  )

  useEffect(() => {
    if (!userId || label) return
    let cancelled = false
    getEventStaffUserLabelAction({ userId, eventId }).then((res) => {
      if (cancelled || !res.success) return
      setLabel(res.data.full_name ? `${res.data.full_name} — ${res.data.email}` : res.data.email)
    })
    return () => {
      cancelled = true
    }
  }, [userId, eventId, label])

  if (!userId) return null
  return <span>{label ?? String(userId)}</span>
}

export default StaffUserCell
