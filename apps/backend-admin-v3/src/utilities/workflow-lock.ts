import { PayloadRequest } from 'payload'

/**
 * Checks whether a given document is currently locked by an active workflow instance.
 *
 * A document is considered "locked" when there is a `workflow-instances` record where:
 *  - `document_collection` equals the provided collection slug
 *  - `document_id` equals the provided document ID
 *  - `status` is either `in_review` or `pending` (i.e. not terminal)
 *
 * Usage: Call this from a source collection's `access.update` resolver to prevent
 * users from editing a document while it is under active workflow review.
 *
 * @example
 * // Inside your Cases collection:
 * access: {
 *   update: async ({ req, id }) => {
 *     const user = req.user as User
 *     if (user?.super_user) return true
 *     const locked = await isDocumentLockedByWorkflow(req, 'cases', String(id))
 *     if (locked) return false
 *     return accessCheck('cases', 'update', { fallbackAccess: false, reqOverride: req })
 *   }
 * }
 */
export async function isDocumentLockedByWorkflow(
  req: PayloadRequest,
  documentCollection: string,
  documentId: string,
): Promise<boolean> {
  try {
    const result = await req.payload.find({
      collection: 'workflow-instances',
      where: {
        and: [
          { document_collection: { equals: documentCollection } },
          { document_id: { equals: documentId } },
          {
            status: {
              in: ['in_review', 'pending'],
            },
          },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })

    return result.totalDocs > 0
  } catch (err) {
    req.payload.logger.error(`[workflow-lock] Error checking lock for ${documentCollection}:${documentId} — ${err}`)
    return false
  }
}

/**
 * Fetches the active workflow instance for a given document, if one exists.
 * Returns null if no active instance is found.
 */
export async function getActiveWorkflowInstance(
  req: PayloadRequest,
  documentCollection: string,
  documentId: string,
): Promise<any | null> {
  try {
    const result = await req.payload.find({
      collection: 'workflow-instances',
      where: {
        and: [
          { document_collection: { equals: documentCollection } },
          { document_id: { equals: documentId } },
          {
            status: {
              in: ['in_review', 'pending'],
            },
          },
        ],
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
      req,
    })

    return result.docs[0] ?? null
  } catch (err) {
    req.payload.logger.error(`[workflow-lock] Error fetching instance for ${documentCollection}:${documentId} — ${err}`)
    return null
  }
}
