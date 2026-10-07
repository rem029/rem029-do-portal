import type { Payload } from 'payload'
import crypto from 'crypto'

const url = process.env.PAYLOAD_PUBLIC_BACKEND_URL_V2 || 'http://localhost:3005'
const apiKey = process.env.PAYLOAD_MIGRATION_TOKEN_V2 || 'NO_KEY_PROVIDED'

export const seedUsersFromV2 = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Starting users import from v2 backend...')

  try {
    const healthResponse = await fetch(`${url}/payload/api/health`)
    if (healthResponse.status !== 200) {
      console.warn(
        `V2 backend health check failed at ${url}. Status: ${healthResponse.status}. Skipping users import.`,
      )
      return
    } else {
      console.log(
        `V2 backend health check succeeded at ${url}/payload/api/health. Status: ${healthResponse.status}.`,
      )
    }
  } catch (error) {
    console.warn(`V2 backend is unreachable at ${url}. Skipping users import.`)
    return
  }

  try {
    console.log(`Fetching users from v2 backend at ${url}/payload/api/users with token ${apiKey}`)

    const response = await fetch(`${url}/payload/api/users?limit=0`, {
      method: 'GET',
      headers: { Authorization: `users API-Key ${apiKey}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to connect to v2 backend at ${url}. Status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Connected to v2 backend successfully.', data?.docs?.length || 0, 'users found.')

    const users: any[] = data?.docs || []

    for (const user of users) {
      console.log(
        `Processing user id: ${user?.id} email: ${user?.email} access: ${user?.access?.id}`,
      )

      // Check if user already exists by old_id
      const existingItemByOldId = await payload.find({
        collection: 'users',
        where: {
          old_id: { equals: user.id },
        },
        limit: 1,
        overrideAccess: true,
        pagination: false,
      })

      if (existingItemByOldId?.totalDocs && existingItemByOldId.totalDocs > 0) {
        console.log(`User with old_id ${user.id} already exists. Skipping.`)
        continue
      }

      // Check if user already exists by email
      const existingItemByEmail = await payload.find({
        collection: 'users',
        where: {
          email: { equals: user.email },
        },
        limit: 1,
        overrideAccess: true,
        pagination: false,
      })

      if (existingItemByEmail?.totalDocs && existingItemByEmail.totalDocs > 0) {
        console.log(`User with email ${user.email} already exists. Skipping.`)
        continue
      }

      // Find the corresponding user access record
      const userAccess = await payload.find({
        collection: 'users-access',
        where: {
          old_id: { equals: user?.access?.id },
        },
        limit: 1,
        overrideAccess: true,
        pagination: false,
      })

      // Generate temporary password for migrated users
      const tempPassword = crypto.randomBytes(32).toString('hex')

      await payload.create({
        collection: 'users',
        data: {
          email: user.email,
          password: tempPassword,
          old_id: user.id.toString(),
          access: userAccess?.docs[0]?.id || null,
          _verified: false,
        },
        disableVerificationEmail: true,
        overrideAccess: true,
      })

      console.log(`✓ Imported user id: ${user?.id} email: ${user?.email}`)
    }

    console.log('Users import completed successfully!')
  } catch (error) {
    console.error('Error importing users from v2:', error)
    // throw error
  }
}
