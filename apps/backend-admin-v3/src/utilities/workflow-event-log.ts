export type WorkflowEventType =
  | 'responded'
  | 'auto_skipped'
  | 'loop_back'
  | 'completed'
  | 'rejected'
  | 'notification_sent'
  | 'reassigned'
  | 'blueprint_synced'

export interface WorkflowEventEntry {
  type: WorkflowEventType
  timestamp: string
  /** Email address or "system" */
  actor: string
  step_slug?: string | null
  step_label?: string | null
  /** Flexible per-type payload: from/to for reassign, recipients for notification, etc. */
  details?: Record<string, unknown> | null
}

export function makeEvent(
  type: WorkflowEventType,
  actor: string,
  step_slug?: string | null,
  step_label?: string | null,
  details?: Record<string, unknown>,
): WorkflowEventEntry {
  return {
    type,
    timestamp: new Date().toISOString(),
    actor,
    step_slug: step_slug ?? null,
    step_label: step_label ?? null,
    details: details ?? null,
  }
}
