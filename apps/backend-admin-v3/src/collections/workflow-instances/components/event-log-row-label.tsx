'use client'

import { useRowLabel } from '@payloadcms/ui'

type EventRow = { type?: string; step_label?: string; timestamp?: string; actor?: string }

const EVENT_LABELS: Record<string, string> = {
  responded: 'Responded',
  auto_skipped: 'Auto-skipped',
  loop_back: 'Loop back',
  completed: 'Completed',
  rejected: 'Rejected',
  notification_sent: 'Notification sent',
  reassigned: 'Reassigned',
  blueprint_synced: 'Blueprint synced',
}

const EventLogRowLabel = () => {
  const { data } = useRowLabel<EventRow>()
  const typeLabel = EVENT_LABELS[data?.type ?? ''] ?? data?.type ?? 'Event'
  const stepLabel = data?.step_label ? ` — ${data.step_label}` : ''
  const ts = data?.timestamp
    ? ` · ${new Date(data.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
    : ''
  return <div>{`${typeLabel}${stepLabel}${ts}`}</div>
}

export default EventLogRowLabel
