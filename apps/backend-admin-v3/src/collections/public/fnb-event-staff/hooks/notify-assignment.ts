import type { CollectionAfterChangeHook } from 'payload'
import type { FnbEventStaff, FnbMenuEvent, User } from '@/payload-types'
import { generateEmailHtml } from '@/utilities/email-generator'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

const ROLE_LABEL: Record<string, string> = {
  waiter: 'Waiter',
  boh: 'Back of House',
  cashier: 'Cashier',
}

const ADMIN_URL = `${BACKEND_URL_WITH_BASE}/admin`.replace(/([^:]\/)\/+/g, '$1')

const resolveId = (value: unknown): string | number | null => {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

/**
 * Emails the assigned staff member the event + role they've just been added to,
 * with a link to the admin panel. No credentials — a freshly-created user gets
 * their sign-in details from `createEventStaffUserAction` (which still holds the
 * plaintext password); an existing user already has an account. Both just need
 * to know which event/role and where to sign in.
 *
 * Failures are logged, never thrown: a mail hiccup must not fail the assignment.
 */
export const notifyAssignmentAfterChange: CollectionAfterChangeHook<FnbEventStaff> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const { payload } = req

  try {
    const userId = resolveId(doc.user)
    const eventId = resolveId(doc.event)
    if (!userId || !eventId) return doc

    const [user, event] = await Promise.all([
      payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true, req }),
      payload.findByID({
        collection: 'fnb-menu-events',
        id: eventId,
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])

    const email = (user as User)?.email
    if (!email) return doc

    const eventName =
      (event as FnbMenuEvent)?.info?.title || (event as FnbMenuEvent)?.info?.slug || 'the event'
    const roleLabel = ROLE_LABEL[doc.role] ?? doc.role

    await payload.sendEmail({
      to: email,
      subject: `You've been added to ${eventName}`,
      html: generateEmailHtml({
        title: 'Added to a Doha Oasis event',
        message: `You've been added as ${roleLabel} for ${eventName}.`,
        customText:
          'Sign in to the admin panel and open the event panel to see incoming orders for this event.',
        fields: [
          { label: 'Event', value: eventName },
          { label: 'Role', value: roleLabel },
        ],
        actionButtons: [{ label: 'Open the admin panel', url: ADMIN_URL }],
        hideDescription: true,
        hideHistory: true,
        hideAttachments: true,
      }),
    })

    payload.logger.info(
      `[fnb-event-staff] assignment email sent to ${email} for ${eventName} (${roleLabel})`,
    )
  } catch (error) {
    payload.logger.error(`[fnb-event-staff] failed to send assignment email: ${error}`)
  }

  return doc
}
