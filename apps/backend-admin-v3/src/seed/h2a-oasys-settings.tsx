import { H2AOasysSetting, Operator } from '@/payload-types'
import { Payload } from 'payload'
import {} from '@/payload-types'

const INITIAL_SETTINGS: Pick<
  H2AOasysSetting,
  'base_url' | 'client_id' | 'secret' | 'divisions_operator'
> = {
  base_url: process.env.OASYS_H2A_CLIENT_BASE_URL || '',
  client_id: process.env.OASYS_H2A_CLIENT_ID || '',
  secret: process.env.OASYS_H2A_CLIENT_SECRET || '',
}

export const seedH2AoasysSettings = async ({
  payload,
  operators,
}: {
  payload: Payload
  operators?: Operator[]
}): Promise<void> => {
  console.log('Updating request letter settings...')
  await payload.updateGlobal({
    slug: 'h2a-oasys-settings',
    data: { ...INITIAL_SETTINGS, divisions_operator: operators },
    overrideAccess: true,
  })
  try {
  } catch (error) {
    console.error('Error updating request letter settings:', error)
    throw error
  }
}
