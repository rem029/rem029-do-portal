'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { User, UsersAccess as UsersAccessType } from '@/payload-types'
import { hasAnyEventPanelGrant, StaffEventRole } from '@/utilities/fnb-staff-access'

// fnb-event-*-panel globals gate on a composite `fnb-order-panel:<event>:<role>`
// grant slug (see hasAnyEventPanelGrant), not a plain users-access row keyed by
// their own slug — resolve their visibility the same way those globals do.
const EVENT_PANEL_ROLE_BY_SLUG: Record<string, StaffEventRole> = {
  'fnb-event-waiter-panel': 'waiter',
  'fnb-event-back-of-house-panel': 'boh',
  'fnb-event-cashier-panel': 'cashier',
}

export type HomeDashboardTile = {
  slug: string
  kind: 'collection' | 'global'
  label: string
  url: string
}

export async function getHomeDashboardTilesAction(): Promise<{
  showNewDashboard: boolean
  tiles: HomeDashboardTile[]
}> {
  try {
    const payload = await getPayload({ config })

    const settings = await payload.findGlobal({
      slug: 'home-dashboard-settings',
      overrideAccess: true,
    })

    if (settings?.show_new_dashboard !== true) {
      return {
        showNewDashboard: false,
        tiles: [],
      }
    }

    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      return {
        showNewDashboard: true,
        tiles: [],
      }
    }

    const userDoc = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })

    if (!userDoc) {
      return {
        showNewDashboard: true,
        tiles: [],
      }
    }

    // Structural cast: Payload documents match the User interface but payload.findByID returns dynamic shapes
    const user = userDoc as unknown as User
    const dashboardItems = settings.dashboard_items ?? []

    if (dashboardItems.length === 0) {
      return {
        showNewDashboard: true,
        tiles: [],
      }
    }

    const userAccess = (
      user.access && typeof user.access === 'object' ? user.access : null
    ) as UsersAccessType | null
    const accessRows = userAccess?.access ?? []

    const collections = payload.config.collections ?? []
    const globals = payload.config.globals ?? []

    const tiles: HomeDashboardTile[] = []

    for (const item of dashboardItems) {
      const slug = item?.slug?.trim()
      if (!slug) continue

      const titleOverride = item?.title?.trim()
      const eventPanelRole = EVENT_PANEL_ROLE_BY_SLUG[slug]

      if (eventPanelRole) {
        if (!hasAnyEventPanelGrant(user, eventPanelRole)) continue
      } else {
        const grantRow = accessRows.find((a) => a.slug === slug)
        const isSuperUser = Boolean(user.super_user || grantRow?.super_user)

        if (!isSuperUser) {
          if (!grantRow) {
            continue
          }
          const isVisible = grantRow.hidden !== true || grantRow.read === true
          if (!isVisible) {
            continue
          }
        }
      }

      const collectionMatch = collections.find((c) => c.slug === slug)
      if (collectionMatch) {
        const rawLabel = collectionMatch.labels?.singular
        const defaultLabel = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel : slug
        tiles.push({
          slug,
          kind: 'collection',
          label: titleOverride || defaultLabel,
          url: `/admin/collections/${slug}`,
        })
        continue
      }

      const globalMap = globals.find((g) => g.slug === slug)
      if (globalMap) {
        const rawLabel = globalMap.label
        const defaultLabel = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel : slug
        tiles.push({
          slug,
          kind: 'global',
          label: titleOverride || defaultLabel,
          url: `/admin/globals/${slug}`,
        })
        continue
      }

      console.warn(
        `[getHomeDashboardTilesAction] Slug "${slug}" found in dashboard_items does not match any known collection or global in payload.config.`,
      )
    }

    return {
      showNewDashboard: true,
      tiles,
    }
  } catch (error) {
    console.error('Error in getHomeDashboardTilesAction:', error)
    return {
      showNewDashboard: false,
      tiles: [],
    }
  }
}
