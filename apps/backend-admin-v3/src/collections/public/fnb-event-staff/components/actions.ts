'use server'

import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { randomInt, randomUUID } from 'crypto'
import type { FnbMenuEvent, User } from '@/payload-types'
import { canAccessEventStaff, canManageEventStaffForEvent } from '@/utilities/fnb-staff-access'
import { eventStaffBaseAccessRows } from '@/seed/helpers/create-user-access'
import { generateEmailHtml } from '@/utilities/email-generator'
import { BACKEND_URL_WITH_BASE } from '@/utilities/constant'

const ADMIN_URL = `${BACKEND_URL_WITH_BASE}/admin`.replace(/([^:]\/)\/+/g, '$1')

// Machine-generated per-user access doc name — must match the
// `PER_USER_DOC_NAME_RE` the fnb-event-staff grant sync keys on, so the
// assignment hook reconciles the per-{event,role} grants into this same doc
// instead of cloning a second one.
const newFnbAccessDocName = (): string =>
  `FnB Access ${randomUUID().replace(/-/g, '').slice(0, 8)}`

// Alphanumeric only, ambiguous glyphs (0/O/1/l/I) dropped so a password read off
// a screen or an email transcribes cleanly. ~14 chars over a 56-symbol alphabet
// is ~81 bits of entropy.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const PASSWORD_LENGTH = 14

const generatePassword = (): string => {
  let out = ''
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
  }
  return out
}

export type UserOption = {
  id: string | number
  email: string
  full_name?: string | null
}

export type SearchUsersResult =
  | { success: true; data: UserOption[] }
  | { success: false; error: string }

export type CreateUserResult =
  | {
      success: true
      data: {
        id: string | number
        email: string
        generatedPassword: string
      }
    }
  | { success: false; error: string }

/**
 * Searches users under the same operator as the given event.
 * Gated by canAccessEventStaff(user, 'read'), OR ownership of `args.eventId`
 * (added 2026-09-14, user request — same fallback as the `fnb-event-staff`
 * collection's own access, see `canManageEventStaffForEvent`'s doc comment).
 */
export async function searchEventStaffUsersAction(args: {
  query?: string
  eventId?: string
  selectedId?: string | number
}): Promise<SearchUsersResult> {
  try {
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (
      !canAccessEventStaff(user, 'read') &&
      !(await canManageEventStaffForEvent(payload, user, args.eventId))
    ) {
      return { success: false, error: 'Forbidden' }
    }

    if (!args.eventId) {
      return { success: true, data: [] }
    }

    const eventDoc = await payload.findByID({
      collection: 'fnb-menu-events',
      id: args.eventId,
      depth: 0,
      overrideAccess: true,
    })

    if (!eventDoc) {
      return { success: false, error: 'Event not found' }
    }

    const event = eventDoc as FnbMenuEvent
    const eventOperatorId =
      typeof event.operator === 'object' && event.operator !== null
        ? event.operator.id
        : event.operator

    if (!eventOperatorId) {
      return { success: false, error: 'Event has no operator assigned' }
    }

    if (!user.super_user) {
      const userOperatorId =
        typeof user.operator === 'object' && user.operator !== null
          ? user.operator.id
          : user.operator

      if (!userOperatorId || String(userOperatorId) !== String(eventOperatorId)) {
        return { success: false, error: 'Forbidden: operator mismatch' }
      }
    }

    const trimmedQuery = args.query?.trim()
    const where: Where = {
      and: [
        { operator: { equals: eventOperatorId } },
        ...(trimmedQuery
          ? [
              {
                or: [
                  { email: { like: trimmedQuery } },
                  { full_name: { like: trimmedQuery } },
                ],
              },
            ]
          : []),
      ],
    }

    const { docs } = await payload.find({
      collection: 'users',
      where,
      limit: 20,
      depth: 0,
      overrideAccess: true,
    })

    const results: UserOption[] = docs.map((doc) => ({
      id: doc.id,
      email: doc.email,
      full_name: doc.full_name ?? null,
    }))

    // If selectedId was provided and not found in the search results, include it
    if (args.selectedId && !results.some((r) => String(r.id) === String(args.selectedId))) {
      try {
        const selectedDoc = await payload.findByID({
          collection: 'users',
          id: args.selectedId,
          depth: 0,
          overrideAccess: true,
        })
        if (selectedDoc) {
          const selOpId =
            typeof selectedDoc.operator === 'object' && selectedDoc.operator !== null
              ? selectedDoc.operator.id
              : selectedDoc.operator
          if (String(selOpId) === String(eventOperatorId)) {
            results.unshift({
              id: selectedDoc.id,
              email: selectedDoc.email,
              full_name: selectedDoc.full_name ?? null,
            })
          }
        }
      } catch {
        // Ignore if selected user not found
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('Error in searchEventStaffUsersAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search users',
    }
  }
}

export type UserLabelResult =
  | { success: true; data: UserOption }
  | { success: false; error: string }

/**
 * Resolves one user's display label (full name / email) for the "Access" tab's
 * Event Staff table. The `users` collection's own `read` access scopes a
 * non-super_user to their own doc only (see `users/index.ts`'s `refineAccess`),
 * so the table's default relationship cell can't render another staffer's name
 * — it only ever gets back a bare id. This mirrors `searchEventStaffUsersAction`'s
 * gate (operator-wide `fnb-event-staff` read, OR ownership of `eventId`) to read
 * just the two safe display fields via `overrideAccess`, without widening the
 * `users` collection's own access for anyone.
 */
export async function getEventStaffUserLabelAction(args: {
  userId: string | number
  eventId?: string | number
}): Promise<UserLabelResult> {
  try {
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (
      !canAccessEventStaff(user, 'read') &&
      !(await canManageEventStaffForEvent(payload, user, args.eventId))
    ) {
      return { success: false, error: 'Forbidden' }
    }

    const doc = await payload
      .findByID({ collection: 'users', id: args.userId, depth: 0, overrideAccess: true })
      .catch(() => null)

    if (!doc) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, data: { id: doc.id, email: doc.email, full_name: doc.full_name ?? null } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load user',
    }
  }
}

/**
 * Creates a new user with email, auto-generated password, and optional full name.
 * Derived operator and restaurant from the event. Auto-verified.
 * Does NOT set user.access (the fnb-event-staff afterChange hook owns grant provisioning).
 */
export async function createEventStaffUserAction(args: {
  email: string
  fullName?: string
  eventId: string
  /** Ticked "Send login details by email" (default true). */
  sendInvite?: boolean
}): Promise<CreateUserResult> {
  try {
    const headersList = await headers()
    const payload = await getPayload({ config })
    const { user } = (await payload.auth({ headers: headersList })) as { user: User | null }

    // 1. Auth + canAccessEventStaff(user, 'create') gate (401/403), OR
    // ownership of args.eventId (added 2026-09-14, user request — same
    // fallback as the `fnb-event-staff` collection's own access).
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }

    if (
      !canAccessEventStaff(user, 'create') &&
      !(await canManageEventStaffForEvent(payload, user, args.eventId))
    ) {
      return { success: false, error: 'Forbidden' }
    }

    // 2. Normalise email (trim, lowercase). Reject if user with that email already exists
    const normalizedEmail = (args.email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' }
    }

    if (!args.eventId) {
      return { success: false, error: 'An event must be selected first.' }
    }

    const { docs: existingUsers } = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: 'A user with that email already exists — pick them from the list instead.',
      }
    }

    // 3. Resolve event (overrideAccess: true), read operator and restaurant
    const eventDoc = await payload.findByID({
      collection: 'fnb-menu-events',
      id: args.eventId,
      depth: 0,
      overrideAccess: true,
    })

    if (!eventDoc) {
      return { success: false, error: 'The selected event was not found.' }
    }

    const event = eventDoc as FnbMenuEvent
    const eventOperatorId =
      typeof event.operator === 'object' && event.operator !== null
        ? event.operator.id
        : event.operator

    const eventRestaurantId =
      typeof event.restaurant === 'object' && event.restaurant !== null
        ? event.restaurant.id
        : event.restaurant

    if (!eventOperatorId) {
      return { success: false, error: 'The selected event has no operator assigned.' }
    }

    // Actor guard: non-super_user req.user.operator must equal event operator -> else 403
    if (!user.super_user) {
      const userOperatorId =
        typeof user.operator === 'object' && user.operator !== null
          ? user.operator.id
          : user.operator

      if (!userOperatorId || String(userOperatorId) !== String(eventOperatorId)) {
        return {
          success: false,
          error: 'Forbidden: you can only create staff for your own operator.',
        }
      }
    }

    // 4. Generate an alphanumeric password. Do not log the plaintext.
    const password = generatePassword()

    // 5. Create user: _verified: true, disableVerificationEmail: true
    // Do NOT touch user.access — the fnb-event-staff afterChange hook provisions grants.
    const newUser = await payload.create({
      collection: 'users',
      data: {
        email: normalizedEmail,
        password,
        full_name: args.fullName?.trim() || '',
        operator: eventOperatorId,
        ...(eventRestaurantId ? { restaurant: eventRestaurantId } : {}),
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })

    // 6. Give the account a baseline access doc NOW so the emailed credentials
    // actually let them into /pv3/admin even before the assignment row is saved
    // (without an access doc, `users.access.admin` denies the login outright).
    // The fnb-event-staff afterChange hook layers the per-{event,role} grants
    // into this same doc (its "per-user doc" branch keys on the name below).
    try {
      const accessDoc = await payload.create({
        collection: 'users-access',
        data: {
          name: newFnbAccessDocName(),
          access: [...eventStaffBaseAccessRows],
        },
        overrideAccess: true,
      })
      await payload.update({
        collection: 'users',
        id: newUser.id,
        data: { access: accessDoc.id },
        overrideAccess: true,
      })
    } catch (err) {
      // Non-fatal: the assignment hook will create the doc if this failed.
      console.error('createEventStaffUserAction: baseline access doc failed:', err)
    }

    // 7. Email the sign-in details now, while we still hold the plaintext
    // password. (The role isn't chosen yet — the fnb-event-staff notifyAssignment
    // hook sends the "added as <role> for <event>" note once the row is saved.)
    if (args.sendInvite ?? true) {
      try {
        const eventName = event.info?.title || event.info?.slug || 'an event'
        await payload.sendEmail({
          to: normalizedEmail,
          subject: 'Your Doha Oasis event access',
          html: generateEmailHtml({
            title: 'Your Doha Oasis event access',
            message: `You've been set up as event staff for ${eventName}.`,
            customText:
              'Sign in with the details below. Change this password from your account page after your first sign-in. You will get the event and role details in a follow-up email.',
            fields: [
              { label: 'Sign-in email', value: normalizedEmail },
              { label: 'Temporary password', value: password },
            ],
            actionButtons: [{ label: 'Open the admin panel', url: ADMIN_URL }],
            hideDescription: true,
            hideHistory: true,
            hideAttachments: true,
          }),
        })
        payload.logger.info(
          `[fnb-event-staff] sign-in email sent to ${normalizedEmail} (new event-staff account)`,
        )
      } catch (err) {
        payload.logger.error(`[fnb-event-staff] sign-in email failed for ${normalizedEmail}: ${err}`)
      }
    }

    // 8. Return { id, email, generatedPassword: password }
    return {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        generatedPassword: password,
      },
    }
  } catch (error) {
    console.error('Error in createEventStaffUserAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create staff user',
    }
  }
}
