import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Event mode (derived from the ordering page's `c.handlers` — any option other than
 * `waiter_boh_cashier` — and snapshotted onto each order as `event_mode`): a flow with
 * no payment step. The waiter (or, on a Back-of-House-only order, BOH) still
 * performs the exact same `prepared -> served` transition it owns today; this hook
 * runs immediately after `guardOrderStatusTransition` has validated that request
 * and silently finishes the loop by rewriting the same write to `completed`, so no
 * cashier login is ever needed. Restaurants that don't opt in are untouched.
 *
 * Runs before `trackOrderStatusTimestamps`; stamps `served_at` itself (that hook
 * only stamps `completed_at` once status is already `completed`) and also stamps
 * `completed_at` defensively — both guarded so a real value is never overwritten.
 */
export const autoCompleteEventOrder: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const eventMode = data?.event_mode ?? originalDoc?.event_mode

  if (data?.status === 'served' && eventMode && originalDoc?.status !== 'completed') {
    const now = new Date().toISOString()
    data.status = 'completed'
    if (!data.served_at && !originalDoc?.served_at) data.served_at = now
    if (!data.completed_at && !originalDoc?.completed_at) data.completed_at = now
  }

  return data
}
