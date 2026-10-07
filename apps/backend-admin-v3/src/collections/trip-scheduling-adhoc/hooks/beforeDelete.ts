import { CollectionBeforeDeleteHook } from 'payload'

// 🛠️ TESTING / CLEANUP TOGGLE: Set to true to allow deleting all records regardless of status
const BYPASS_DELETE_LOCK = true

export const beforeDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  if (!id) return

  try {
    const doc = await req.payload.findByID({
      collection: 'trip-scheduling-adhoc',
      id: id as string,
      depth: 0,
    })

    if (doc && !BYPASS_DELETE_LOCK) {
      const pristineStatuses = ['pending', 'expired', 'declined', 'completed']
      const docRecord = doc as unknown as Record<string, unknown>
      const statusValue = docRecord.status as string | undefined
      const isProtected = !pristineStatuses.includes(statusValue || '')

      if (isProtected) {
        throw new Error(
          `Operational Lock: Cannot delete an ad-hoc request that is currently marked as '${statusValue}'.`,
        )
      }
    }
  } catch (err: unknown) {
    const error = err as Error
    if (error.message?.includes('Operational Lock')) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    req.payload.logger.error(
      `[Adhoc Delete Lock Error] Failed to evaluate deletion gate rules: ${message}`,
    )
  }
}
