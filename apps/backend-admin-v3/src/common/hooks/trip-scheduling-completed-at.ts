import type { CollectionBeforeChangeHook } from 'payload'

// Stamps completedAt once, the moment a request's status becomes 'completed' — regardless of which
// code path drove the transition (the completeTrip action (driver completion page), the
// trip-scheduling-lifecycle job's auto-settle, an admin edit, or the CSV importer creating a row
// already completed), so none of them need to set it individually. `originalDoc` is undefined on
// create, so a CSV row created as 'completed' is covered by the same check as an update
// transitioning into it.
export const stampCompletedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data

  if (originalDoc?.status !== 'completed' && data.status === 'completed' && !data.completedAt) {
    data.completedAt = new Date().toISOString()
  }

  return data
}
