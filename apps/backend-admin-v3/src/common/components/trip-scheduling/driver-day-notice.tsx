'use client'

import React, { useEffect, useState } from 'react'
import type { DriverDayAssignment } from '@/utilities/trip-scheduling-driver-day'

type CheckResult = { success: true; assignments: DriverDayAssignment[] } | { success: false; error: string }

// Looks up the selected driver's other open assignments that day. Advisory only: any failure just
// yields no notice, and approval stays available either way.
export function useDriverDayAssignments(
  driverId: string,
  check: (driverId: string) => Promise<CheckResult>,
): DriverDayAssignment[] {
  const [assignments, setAssignments] = useState<DriverDayAssignment[]>([])

  useEffect(() => {
    setAssignments([])
    if (!driverId) return
    let cancelled = false
    check(driverId)
      .then((res) => {
        if (!cancelled && res.success) setAssignments(res.assignments)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // `check` is recreated each render by callers; the lookup only depends on the driver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId])

  return assignments
}

export function DriverDayNotice({ assignments }: { assignments: DriverDayAssignment[] }) {
  if (assignments.length === 0) return null

  return (
    <div
      role="status"
      style={{
        padding: '8px 10px',
        borderRadius: '6px',
        border: '1px solid var(--theme-warning-300, rgba(245, 158, 11, 0.45))',
        background: 'var(--theme-warning-50, rgba(245, 158, 11, 0.12))',
        color: 'var(--theme-warning-750, #92400e)',
        fontSize: '11px',
        lineHeight: 1.45,
      }}
    >
      <strong>⚠ This driver already has an open assignment on this day.</strong>
      <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
        {assignments.map((a) => (
          <li key={`${a.kind}-${a.reference}`}>
            {a.kind} {a.reference} · {a.time} · {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
          </li>
        ))}
      </ul>
      You can still approve — the earlier trip may finish in time; it frees up once marked complete.
    </div>
  )
}
