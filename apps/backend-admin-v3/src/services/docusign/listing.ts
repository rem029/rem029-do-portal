import type { Payload } from 'payload'
import {
  listEnvelopesForUser,
  listEnvelopesSentByUser,
  listEnvelopesForAction,
  EnvelopeListItem,
  ListEnvelopesResult,
} from './envelopes'
import { isDocuSignAccountAdmin } from './users'
import { normalizeDohaEmail } from '@/utilities/docusign-email'

export type ListingTab = 'inbox' | 'sent' | 'draft' | 'all' | 'sent_with_drafts'

export interface ListEnvelopesForTabOptions {
  tab?: ListingTab
  fromDate: string // ISO date string
  count?: number
  startPosition?: number
}

export interface ListEnvelopesForTabResult extends ListEnvelopesResult {
  isDocuSignAdmin: boolean
}

/**
 * Unified listing service for DocuSign envelopes by tab.
 * Used by both the Payload admin dashboard and external SharePoint endpoints.
 */
export async function listEnvelopesForTab(
  payload: Payload,
  email: string,
  options: ListEnvelopesForTabOptions,
): Promise<ListEnvelopesForTabResult> {
  const normalizedUserEmail = normalizeDohaEmail(email)
  const tab = options.tab || 'inbox'
  const count = options.count ?? 10
  const startPosition = options.startPosition ?? 0
  const fromDate = options.fromDate

  if (!normalizedUserEmail) {
    return {
      envelopes: [],
      totalCount: 0,
      resultSetSize: 0,
      startPosition,
      notDocuSignUser: true,
      isDocuSignAdmin: false,
    }
  }

  const adminPromise = isDocuSignAccountAdmin(payload, normalizedUserEmail)

  if (tab === 'sent') {
    const [isAdmin, res] = await Promise.all([
      adminPromise,
      listEnvelopesSentByUser(payload, normalizedUserEmail, {
        fromDate,
        count,
        startPosition,
        folderTypes: 'sentitems',
        status: 'sent,delivered,completed,declined,voided',
      }),
    ])
    return {
      ...res,
      isDocuSignAdmin: isAdmin,
    }
  }

  if (tab === 'draft') {
    const [isAdmin, res] = await Promise.all([
      adminPromise,
      listEnvelopesSentByUser(payload, normalizedUserEmail, {
        fromDate,
        count,
        startPosition,
        folderTypes: 'draft',
        status: 'created',
      }),
    ])
    return {
      ...res,
      isDocuSignAdmin: isAdmin,
    }
  }

  if (tab === 'sent_with_drafts') {
    const [isAdmin, res] = await Promise.all([
      adminPromise,
      listEnvelopesSentByUser(payload, normalizedUserEmail, {
        fromDate,
        count,
        startPosition,
        folderTypes: 'sentitems,draft',
        status: 'created,sent,delivered,completed,declined,voided',
      }),
    ])
    return {
      ...res,
      isDocuSignAdmin: isAdmin,
    }
  }

  if (tab === 'inbox') {
    const [isAdmin, res] = await Promise.all([
      adminPromise,
      listEnvelopesForAction(payload, normalizedUserEmail, {
        fromDate,
        count,
        startPosition,
      }),
    ])
    return {
      ...res,
      isDocuSignAdmin: isAdmin,
    }
  }

  // tab === 'all'
  const isAdmin = await adminPromise
  if (isAdmin) {
    // DocuSign admin sees all company envelopes via account-wide reader
    const res = await listEnvelopesForUser(payload, {
      fromDate,
      count,
      startPosition,
    })
    return {
      ...res,
      isDocuSignAdmin: true,
    }
  }

  // DocuSign member: merge Sent + Draft + Inbox, bounded by (startPosition + count)
  const fetchBound = startPosition + count
  const [sentRes, actionRes] = await Promise.all([
    listEnvelopesSentByUser(payload, normalizedUserEmail, {
      fromDate,
      count: fetchBound,
      startPosition: 0,
      folderTypes: 'sentitems,draft',
      status: 'created,sent,delivered,completed,declined,voided',
    }),
    listEnvelopesForAction(payload, normalizedUserEmail, {
      fromDate,
      count: fetchBound,
      startPosition: 0,
    }),
  ])

  if (sentRes.notDocuSignUser && actionRes.notDocuSignUser) {
    return {
      envelopes: [],
      totalCount: 0,
      resultSetSize: 0,
      startPosition,
      notDocuSignUser: true,
      isDocuSignAdmin: false,
    }
  }

  // De-duplicate by envelopeId
  const seenIds = new Set<string>()
  const merged: EnvelopeListItem[] = []
  for (const env of [...sentRes.envelopes, ...actionRes.envelopes]) {
    if (env.envelopeId && !seenIds.has(env.envelopeId)) {
      seenIds.add(env.envelopeId)
      merged.push(env)
    }
  }

  // Sort by createdDateTime desc (fallback to statusChangedDateTime)
  merged.sort((a, b) => {
    const timeA = new Date(a.createdDateTime || a.statusChangedDateTime || 0).getTime()
    const timeB = new Date(b.createdDateTime || b.statusChangedDateTime || 0).getTime()
    return timeB - timeA
  })

  // Overlap outside the fetched window can't be seen, so this is exact
  // whenever both lists fit in fetchBound (the usual member case).
  const duplicates = sentRes.envelopes.length + actionRes.envelopes.length - merged.length
  const totalCount = Math.max(
    (sentRes.totalCount ?? 0) + (actionRes.totalCount ?? 0) - duplicates,
    merged.length,
  )
  const pagedEnvelopes = merged.slice(startPosition, startPosition + count)
  const nextStart = startPosition + count < totalCount ? startPosition + count : undefined

  return {
    envelopes: pagedEnvelopes,
    totalCount,
    startPosition,
    endPosition: startPosition + pagedEnvelopes.length - 1,
    nextStartPosition: nextStart,
    resultSetSize: pagedEnvelopes.length,
    isDocuSignAdmin: false,
    notDocuSignUser: false,
  }
}
