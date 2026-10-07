'use server'

import { getPayload, createLocalReq } from 'payload'
import config from '@payload-config'
import { seed } from '@/seed'
import { accessCheck } from '@/utilities/access'
import { headers } from 'next/headers'

export async function triggerSeedAction() {
  const payload = await getPayload({ config })
  const headersList = await headers()
  
  const { user } = await payload.auth({ headers: headersList })
  const req = await createLocalReq({ user: user ?? undefined }, payload)
  
  const hasAccess = await accessCheck('users', 'super_user', { reqOverride: req })
  
  if (!hasAccess) {
    throw new Error('Unauthorized: Only super users can trigger seeding.')
  }

  try {
    await seed({ payload })
    return { success: true, message: 'Seeding completed successfully!' }
  } catch (error: any) {
    console.error('Seed Action Error:', error)
    return { success: false, message: error.message || 'An error occurred during seeding.' }
  }
}
