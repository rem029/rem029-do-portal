import type { Payload } from 'payload'
import type { HaccpOutletSetting, Outlet, User } from '@/payload-types'

// Type-safe helper to fetch the settings document for a specific outlet
async function getOutletAssignment(
  payload: Payload,
  outletId: string | undefined,
): Promise<HaccpOutletSetting | null> {
  if (!outletId) return null
  try {
    const settingsQuery = await payload.find({
      collection: 'haccp-outlet-settings',
      where: {
        outlet: {
          equals: outletId,
        },
      },
      depth: 1,
      overrideAccess: true,
      limit: 1,
    })

    return (settingsQuery.docs[0] as HaccpOutletSetting) || null
  } catch (err: unknown) {
    const error = err as Error
    payload.logger.error(`--- [PERMISSION CHECK] Assignment Error: ${error.message} ---`)
    return null
  }
}

// Helper to extract email safely from various user payload structures
function extractUserEmail(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null

  const typedUser = user as User & { user?: User }
  const email = typedUser.email || typedUser.user?.email

  return typeof email === 'string' ? email : null
}

export async function checkIsStaffForOutlet(
  payload: Payload,
  user: unknown,
  outletId: string | undefined,
): Promise<boolean> {
  const userEmail = extractUserEmail(user)
  if (!userEmail || !outletId) return false

  const settings = await getOutletAssignment(payload, outletId)
  if (!settings?.staffEmails || !Array.isArray(settings.staffEmails)) return false

  const targetEmail = userEmail.trim().toLowerCase()
  return settings.staffEmails.some(
    (item) => typeof item?.email === 'string' && item.email.trim().toLowerCase() === targetEmail,
  )
}

export async function checkIsHicForOutlet(
  payload: Payload,
  user: unknown,
  outletId: string | undefined,
): Promise<boolean> {
  const userEmail = extractUserEmail(user)
  if (!userEmail || !outletId) {
    payload.logger.info(
      `--- [PERMISSION] HIC Check Failed: Missing email or outletId. Outlet: ${outletId} ---`,
    )
    return false
  }

  const settings = await getOutletAssignment(payload, outletId)
  if (!settings?.hicEmails || !Array.isArray(settings.hicEmails)) return false

  const targetEmail = userEmail.trim().toLowerCase()
  return settings.hicEmails.some(
    (item) => typeof item?.email === 'string' && item.email.trim().toLowerCase() === targetEmail,
  )
}

export async function checkIsPicForOutlet(
  payload: Payload,
  user: unknown,
  outletId: string | undefined,
): Promise<boolean> {
  const userEmail = extractUserEmail(user)
  if (!userEmail || !outletId) return false

  const settings = await getOutletAssignment(payload, outletId)
  if (!settings?.picEmails || !Array.isArray(settings.picEmails)) return false

  const targetEmail = userEmail.trim().toLowerCase()
  return settings.picEmails.some(
    (item) => typeof item?.email === 'string' && item.email.trim().toLowerCase() === targetEmail,
  )
}

/**
 * Determines if a HACCP document is locked against further edits.
 */
export function isHicpDocumentLocked({
  status,
  workflowType = '3-step',
  isHicUser,
  isPicUser = false,
  isSuperUser = false,
}: {
  status: string
  workflowType?: '2-step' | '3-step'
  isHicUser: boolean
  isPicUser?: boolean
  isSuperUser?: boolean
}): boolean {
  if (isSuperUser) return false
  if (status === 'verified') return true

  // HIC locks (Universal across workflows)
  if (isHicUser && status === 'pending-hic-verification') return true
  if (isHicUser && status === 'draft') return true
  if (status === 'pending-hic-verification' && !isHicUser) return true

  // PIC locks: In 3-step workflows, PICs are approvers only and cannot edit drafts or pending records
  if (
    workflowType === '3-step' &&
    isPicUser &&
    (status === 'draft' || status === 'pending-pic-approval')
  ) {
    return true
  }

  if (status === 'pending-pic-approval' && !isPicUser) return true

  return false
}
