'use server'

import { getPayload, createLocalReq, getAccessResults } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import type { CollectionSlug } from 'payload'
import {
  ADMIN_SEARCHABLE_COLLECTIONS,
  ADMIN_SEARCHABLE_GLOBALS,
} from '@/utilities/admin-search-config'
import { hasUserAccess } from '@/utilities/access'
import type { User } from '@/payload-types'

export interface AdminSearchNavItem {
  kind: 'navigation'
  target: 'collection' | 'global'
  slug: string
  label: string
  path: string
}

export interface AdminSearchResultItem {
  kind: 'document'
  id: string
  collection: CollectionSlug
  collectionLabel: string
  title: string
  editPath: string
}

export type AdminSearchItem = AdminSearchNavItem | AdminSearchResultItem

export interface AdminSearchGroup {
  collection: CollectionSlug
  collectionLabel: string
  items: AdminSearchResultItem[]
}

export interface AdminSearchResults {
  navigation: AdminSearchNavItem[]
  groups: AdminSearchGroup[]
}

// Strip a trailing "s" so "users"/"user", "settings"/"setting" compare equal —
// just enough stemming to tolerate plural mismatches between what someone
// types and a collection's label, without pulling in a fuzzy-match library
// for a fixed, small list of known collection labels.
const stem = (word: string): string => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)

const toStemmedWords = (str: string): string[] =>
  str
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(stem)

// True if every word in the query matches (as a substring, either direction)
// some word in the label — handles multi-word queries like "users settings"
// against the "User Settings" label that don't line up as one contiguous
// substring once pluralized.
const wordsMatch = (query: string, label: string): boolean => {
  const queryWords = toStemmedWords(query)
  const labelWords = toStemmedWords(label)
  if (queryWords.length === 0) return false

  // Reverse check skips very short label words, or "e" (E-Recognitions) would match any query with an "e".
  return queryWords.every((qw) =>
    labelWords.some((lw) => lw.includes(qw) || (lw.length > 2 && qw.includes(lw))),
  )
}

// Match by label or slug. Whole-string substring checks handle single-word/exact-phrase
// queries ("workflow", "audit logs"); wordsMatch handles pluralized multi-word queries
// ("users settings" vs. "User Settings").
const matchesQuery = (qLower: string, slug: string, label: string): boolean => {
  const labelLower = label.toLowerCase()
  if (
    labelLower.includes(qLower) ||
    slug.toLowerCase().includes(qLower) ||
    qLower.includes(labelLower)
  ) {
    return true
  }
  return wordsMatch(qLower, labelLower)
}

/**
 * Server Action to search allowlisted admin collections and collection navigation shortcuts
 * using Payload's native access control and synchronous user access check.
 *
 * Respects operator multi-tenancy and per-collection permissions by passing `overrideAccess: false`
 * and forwarding the authenticated user context via `createLocalReq`.
 */
export async function searchAdmin(query: string): Promise<AdminSearchResults> {
  const q = query.trim()
  if (q.length < 2) {
    return { navigation: [], groups: [] }
  }

  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user: authUser } = await payload.auth({ headers: headersList })

    if (!authUser) {
      return { navigation: [], groups: [] }
    }

    // Fetch full user to populate access relationships for access control checks
    const user = await payload.findByID({
      collection: 'users',
      id: authUser.id,
      depth: 1,
      overrideAccess: true,
    })

    const currentUser = user as unknown as User

    const qLower = q.toLowerCase()

    // Filter collection navigation shortcuts by 'read' access
    const collectionNavigation: AdminSearchNavItem[] = ADMIN_SEARCHABLE_COLLECTIONS.filter(
      ({ slug, label }) =>
        matchesQuery(qLower, slug, label) && hasUserAccess(currentUser, slug, 'read'),
    ).map(({ slug, label }) => ({
      kind: 'navigation' as const,
      target: 'collection' as const,
      slug,
      label,
      path: `/admin/collections/${slug}`,
    }))

    const req = await createLocalReq(
      { user: user ? { ...user, collection: 'users' } : undefined },
      payload,
    )

    // Globals use Payload's own access results, so each global's `access.read` decides
    // visibility (some, like the FnB event panels, aren't plain users-access grants).
    const matchingGlobals = ADMIN_SEARCHABLE_GLOBALS.filter(({ slug, label }) =>
      matchesQuery(qLower, slug, label),
    )
    const globalPermissions =
      matchingGlobals.length > 0 ? (await getAccessResults({ req })).globals : undefined
    const globalNavigation: AdminSearchNavItem[] = matchingGlobals
      .filter(({ slug }) => globalPermissions?.[slug]?.read === true)
      .map(({ slug, label }) => ({
        kind: 'navigation' as const,
        target: 'global' as const,
        slug,
        label,
        path: `/admin/globals/${slug}`,
      }))

    const navigation = [...collectionNavigation, ...globalNavigation]

    const groups = await Promise.all(
      ADMIN_SEARCHABLE_COLLECTIONS.map(async ({ slug, label, titleField }) => {
        // No text title field configured — this collection only offers a
        // navigation shortcut (see admin-search-config.ts), skip document search.
        if (!titleField) {
          return null
        }

        try {
          // Structural cast required because slug is dynamic from the allowlist
          const collectionSlug = slug as unknown as CollectionSlug

          const res = await payload.find({
            collection: collectionSlug,
            where: {
              [titleField]: {
                like: q,
              },
            },
            limit: 5,
            depth: 0,
            overrideAccess: false,
            req,
          })

          if (!res.docs || res.docs.length === 0) {
            return null
          }

          const items: AdminSearchResultItem[] = res.docs.map((doc) => {
            // Structural cast: Payload documents have divergent schema structures across collections
            const docRecord = doc as unknown as Record<string, unknown>
            const rawTitle = docRecord[titleField]
            const title =
              typeof rawTitle === 'string' && rawTitle.trim()
                ? rawTitle
                : String(docRecord.id ?? '')

            return {
              kind: 'document' as const,
              id: String(docRecord.id),
              collection: slug,
              collectionLabel: label,
              title,
              editPath: `/admin/collections/${slug}/${docRecord.id}`,
            }
          })

          return {
            collection: slug,
            collectionLabel: label,
            items,
          }
        } catch {
          // If a user lacks read access to a collection or a query fails, exclude it gracefully
          return null
        }
      }),
    )

    return {
      navigation,
      groups: groups.filter(
        (group): group is AdminSearchGroup => group !== null && group.items.length > 0,
      ),
    }
  } catch (error) {
    console.error('searchAdmin server action error:', error)
    return { navigation: [], groups: [] }
  }
}
