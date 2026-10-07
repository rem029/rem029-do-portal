import { UsersAccess } from '@/payload-types'
import { Payload } from 'payload'

export const accessNonAdmin: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'Default Non Admin Access',
  access: [
    {
      slug: 'users',
      hidden: true,
      read: true,
      admin: true,
    },
    {
      slug: 'users-access',
      hidden: true,
      read: true,
      admin: true,
    },
    {
      slug: 'operators',
      hidden: true,
      read: true,
      admin: true,
    },
    {
      slug: 'departments',
      hidden: true,
      read: true,
      admin: true,
    },
  ],
}

export const accessNonManager: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'Default Non Admin Manager Access',
  access: [
    ...(accessNonAdmin?.access || []),
    {
      slug: 'business-justifications',
      read: true,
      create: true,
      admin: true,
      update: true,
    },
    {
      slug: 'salary-deduction',
      read: true,
      create: true,
      admin: true,
      update: true,
    },
    {
      slug: 'offer-letter',
      read: true,
      create: true,
      admin: true,
      update: true,
    },
    {
      slug: 'end-of-service',
      read: true,
      create: true,
      admin: true,
      update: true,
    },
    {
      slug: 'recruitment-note',
      read: true,
      create: true,
      admin: true,
      update: true,
    },
  ],
}

export const accessForm: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'form access',
  access: [
    ...(accessNonAdmin?.access || []),
    {
      slug: 'forms',
      read: true,
      create: true,
      admin: true,
      update: true,
      delete: true,
    },
    {
      slug: 'form-submissions',
      read: true,
      create: true,
      admin: true,
      update: true,
      delete: true,
    },
  ],
}

export const accessCrmEntry: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'crm entry access',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'form-store-floor-customer-complaints', read: true },
    { slug: 'form-guest-relations-custom-complaints', read: true },
    { slug: 'form-guest-relations-inquiry', read: true },
    { slug: 'form-printemps-incident-forms', read: true },
  ],
}

export const accessCrmReviewer: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'crm reviewer access',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'form-store-floor-customer-complaints', read: true },
    { slug: 'form-submission-store-floor-customer-complaints', read: true },
    { slug: 'form-workflow-store-floor-customer-complaints', read: true },
    { slug: 'form-guest-relations-custom-complaints', read: true },
    { slug: 'form-submission-guest-relations-custom-complaints', read: true },
    { slug: 'form-workflow-guest-relations-custom-complaints', read: true },
    { slug: 'form-printemps-incident-forms', read: true },
    { slug: 'form-submission-printemps-incident-forms', read: true },
    { slug: 'form-workflow-printemps-incident-forms', read: true },
  ],
}

// FnB order-board staff. Each role builds on accessNonAdmin (which carries the
// `users` slug with `admin: true` - without it the user can't open /pv3/admin at
// all) and adds read/update on the shared `orders` collection plus its own panel
// global. Names match the docs the FnB seed created earlier so re-seeding merges
// the missing base slugs into the existing rows rather than making duplicates.
export const accessFnbWaiter: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Waiter',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true, update: true },
    { slug: 'waiter-panel', read: true, update: true },
  ],
}

export const accessFnbBackOfHouse: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Back of House',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true, update: true },
    { slug: 'back-of-house-panel', read: true, update: true },
  ],
}

export const accessFnbCashier: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Cashier',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true, update: true },
    { slug: 'cashier-panel', read: true, update: true },
  ],
}

export const accessFnbEventStaff: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Event Staff',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true, update: true },
  ],
}

/**
 * Plain (non-super) `fnb-menu-events` grant, for exercising TECH-0098 Task
 * 11C's ownership-scoped access: this alone only gets a user as far as the
 * collection's boolean read/create/update check — `eventOwnershipAccessRefine`
 * still narrows the result to events they created or were added to `owners`
 * on. See `seedFnbMenuEventsOwnership`.
 */
export const accessFnbMenuEventsOwner: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Menu Events Owner',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'fnb-menu-events', read: true, create: true, update: true },
  ],
}

/**
 * Baseline `users-access` rows for an auto-provisioned event-staff account.
 * `accessNonAdmin` lets them open `/pv3/admin`; `orders` r+u is needed by the
 * event panels' server actions / transition guard; `restaurants`/`menu`/
 * `menu-items`/`menu-categories` read-only lets the panels resolve venue and
 * item/category details for an order (added 2026-09-14, user request); all
 * five plus `haccp-settings` are `hidden` so a floor staffer's sidebar shows
 * only their event panel(s). The `fnb-event-staff` grant hook layers
 * `fnb-order-panel:<event>:<role>` on top of this.
 *
 * `haccp-settings` (a global with `read: { fallbackAccess: true }` and no
 * `admin.hidden`) is visible to every non-super user unless explicitly denied —
 * this row is that denial.
 */
export const eventStaffBaseAccessRows: NonNullable<UsersAccess['access']> = [
  ...(accessNonAdmin.access ?? []),
  { slug: 'orders', read: true, update: true, hidden: true },
  { slug: 'restaurants', read: true, hidden: true },
  { slug: 'menu', read: true, hidden: true },
  { slug: 'menu-items', read: true, hidden: true },
  { slug: 'menu-categories', read: true, hidden: true },
  { slug: 'haccp-settings', hidden: true },
]

export const accessFnbReportManager: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Report Manager',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true },
    { slug: 'fnb-orders-report', read: true, update: true },
  ],
}

// Scoped to events the user is staff on (fnb-order-panel:<slug>:<role>) or
// created/owns (fnb-menu-events.created_by / .owners) - see resolveEventReportScope.
export const accessFnbEventReportManager: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Event Report Manager',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true },
    { slug: 'fnb-event-orders-report', read: true, update: true },
  ],
}

// `super_user: true` on this row is operator-wide (not global): every published
// event under the user's own `operator`, via resolveEventReportScope.
export const accessFnbEventReportOperatorManager: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Event Report Manager (Operator-wide)',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true },
    { slug: 'fnb-event-orders-report', read: true, update: true, super_user: true },
  ],
}

export const accessFnbReportAdmin: Pick<UsersAccess, 'name' | 'access'> = {
  name: 'FnB Report Admin',
  access: [
    ...(accessNonAdmin?.access || []),
    { slug: 'orders', read: true },
    { slug: 'fnb-orders-report', read: true, update: true, super_user: true },
  ],
}

export const createDefaultUserAccess = async (
  payload: Payload,
  isManagerOrName: boolean | string = false,
  legacyName?: string,
): Promise<UsersAccess> => {
  let userAccessData: Pick<UsersAccess, 'name' | 'access'>

  if (typeof isManagerOrName === 'string') {
    if (isManagerOrName === 'form access') {
      userAccessData = accessForm
    } else if (isManagerOrName === 'crm entry access') {
      userAccessData = accessCrmEntry
    } else if (isManagerOrName === 'crm reviewer access') {
      userAccessData = accessCrmReviewer
    } else if (isManagerOrName === 'fnb-waiter') {
      userAccessData = accessFnbWaiter
    } else if (isManagerOrName === 'fnb-boh') {
      userAccessData = accessFnbBackOfHouse
    } else if (isManagerOrName === 'fnb-cashier') {
      userAccessData = accessFnbCashier
    } else if (isManagerOrName === 'fnb-event-staff') {
      userAccessData = accessFnbEventStaff
    } else if (isManagerOrName === 'fnb-menu-events-owner') {
      userAccessData = accessFnbMenuEventsOwner
    } else if (isManagerOrName === 'fnb-report-manager') {
      userAccessData = accessFnbReportManager
    } else if (isManagerOrName === 'fnb-event-report-manager') {
      userAccessData = accessFnbEventReportManager
    } else if (isManagerOrName === 'fnb-report-admin') {
      userAccessData = accessFnbReportAdmin
    } else {
      userAccessData = isManagerOrName === 'manager' ? accessNonManager : accessNonAdmin
    }
  } else {
    userAccessData = isManagerOrName ? accessNonManager : accessNonAdmin
  }

  const existingAccessDocs = await payload.find({
    collection: 'users-access',
    where: {
      name: { equals: userAccessData.name },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (existingAccessDocs.totalDocs > 0) {
    const existingAccess = existingAccessDocs.docs[0]
    const existingSlugs = new Set((existingAccess.access || []).map((a) => a.slug))
    const missingAccess = (userAccessData.access || []).filter((a) => !existingSlugs.has(a.slug))

    if (missingAccess.length > 0) {
      const updatedAccess = [...(existingAccess.access || []), ...missingAccess]
      const updatedUserAccess = (await payload.update({
        collection: 'users-access',
        id: existingAccess.id,
        data: {
          access: updatedAccess,
        },
        overrideAccess: true,
      })) as UsersAccess
      console.log(
        `✓ Updated existing ${userAccessData.name} access with missing slugs: ${missingAccess.map((a) => a.slug).join(', ')}`,
      )
      return updatedUserAccess
    }

    return existingAccess as UsersAccess
  }

  // Not found under the current name — check for a legacy name to rename in place,
  // rather than creating a duplicate doc and leaving existing users' `access`
  // relationships pointed at an orphaned, stale-named doc.
  if (legacyName) {
    const legacyDocs = await payload.find({
      collection: 'users-access',
      where: { name: { equals: legacyName } },
      limit: 1,
      overrideAccess: true,
    })

    if (legacyDocs.totalDocs > 0) {
      const legacyDoc = legacyDocs.docs[0]
      const existingSlugs = new Set((legacyDoc.access || []).map((a) => a.slug))
      const missingAccess = (userAccessData.access || []).filter((a) => !existingSlugs.has(a.slug))

      const renamedAccess = (await payload.update({
        collection: 'users-access',
        id: legacyDoc.id,
        data: {
          name: userAccessData.name,
          access: [...(legacyDoc.access || []), ...missingAccess],
        },
        overrideAccess: true,
      })) as UsersAccess

      console.log(`✓ Renamed "${legacyName}" access to "${userAccessData.name}"`)
      return renamedAccess
    }
  }

  const userAccess = (await payload.create({
    collection: 'users-access',
    data: { ...userAccessData },
    overrideAccess: true,
  })) as UsersAccess

  console.log(`✓ Created default ${userAccessData.name} access`)
  return userAccess
}
