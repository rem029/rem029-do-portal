import type { CollectionAfterChangeHook } from 'payload'
import { applyEventStaffPanelGrant } from '@/collections/public/fnb-event-staff/hooks/sync-panel-grant'

/**
 * Event staff grants are denormalised into `users-access` as
 * `fnb-order-panel:<eventSlug>:<role>`. When an event's `info.slug` changes,
 * every assigned staffer's grant would still point at the OLD slug and they
 * would silently lose access to the (renamed) event and its order stream.
 * Reconcile each assigned user's grants to the new slug.
 *
 * Writes here touch `users-access` / `users` only - neither re-triggers
 * `fnb-menu-events`, so there is no hook loop.
 *
 * Note: `orders` created before the rename keep the old snapshotted
 * `ordering_slug`, so in-flight orders during a rename are not re-pointed - an
 * accepted edge case (slugs are auto-derived and rarely changed mid-service).
 */
export const syncEventStaffGrantsOnSlugChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const nextSlug = (doc as { info?: { slug?: string } })?.info?.slug
  const prevSlug = (previousDoc as { info?: { slug?: string } })?.info?.slug
  if (!prevSlug || !nextSlug || prevSlug === nextSlug) return doc

  try {
    const { docs } = await req.payload.find({
      collection: 'fnb-event-staff',
      where: { event: { equals: doc.id } },
      depth: 0,
      limit: 500,
      overrideAccess: true,
      req,
    })

    const userIds = new Set<string | number>()
    for (const row of docs) {
      const u = (row as { user?: unknown }).user
      const id =
        typeof u === 'object' && u !== null ? (u as { id?: string | number }).id : (u as string | number)
      if (id) userIds.add(id)
    }

    for (const userId of userIds) {
      await applyEventStaffPanelGrant(req.payload, userId, req)
    }
  } catch (error) {
    req.payload.logger.error(
      `[syncEventStaffGrantsOnSlugChange] Failed to reconcile staff grants for event ${doc.id}: ${error}`,
    )
  }

  return doc
}
