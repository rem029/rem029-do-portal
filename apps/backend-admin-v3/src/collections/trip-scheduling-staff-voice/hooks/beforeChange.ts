import type { CollectionBeforeChangeHook } from 'payload'
import { generateSecureHexToken } from '@/utilities/secure-token-generator'

// Review links stay valid for 48 hours, the same window as the ad-hoc and booking approval links.
const TOKEN_LIFETIME_HOURS = 48

export const generateApprovalToken: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation !== 'create') return data

  const expiry = new Date()
  expiry.setHours(expiry.getHours() + TOKEN_LIFETIME_HOURS)

  return {
    ...data,
    approvalToken: generateSecureHexToken(),
    tokenExpiration: expiry.toISOString(),
  }
}
