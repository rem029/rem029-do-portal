import type { Payload } from 'payload'

const url = process.env.PAYLOAD_PUBLIC_BACKEND_URL_V2 || 'http://localhost:3005'
const apiKey = process.env.PAYLOAD_MIGRATION_TOKEN_V2 || 'NO_KEY_PROVIDED'

export interface UserAccessV2 {
  id: number
  name?: string | null
  access?:
    | {
        name?: string | null
        hidden?: boolean | null
        read?: boolean | null
        create?: boolean | null
        update?: boolean | null
        admin?: boolean | null
        delete?: boolean | null
        access?: boolean | null
        id?: string | null
      }[]
    | null
  updatedAt: string
  createdAt: string
}

export const seedUsersAccessFromV2 = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Starting user-access import from v2 backend...')

  try {
    const healthResponse = await fetch(`${url}/payload/api/health`)
    if (healthResponse.status !== 200) {
      console.warn(
        `V2 backend health check failed at ${url}. Status: ${healthResponse.status}. Skipping users-access import.`,
      )
      return
    } else {
      console.log(
        `V2 backend health check succeeded at ${url}/payload/api/health. Status: ${healthResponse.status}.`,
      )
    }
  } catch (error) {
    console.warn(`V2 backend is unreachable at ${url}. Skipping users-access import.`)
    return
  }

  try {
    console.log(
      `Fetching users-access from v2 backend at ${url}/payload/api/user-access with token ${apiKey}`,
    )

    const response = await fetch(`${url}/payload/api/user-access?limit=0`, {
      method: 'GET',
      headers: { Authorization: `users API-Key ${apiKey}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to connect to v2 backend at ${url}. Status: ${response.status}`)
    }

    const data = await response.json()
    console.log(
      'Connected to v2 backend successfully.',
      data?.docs?.length || 0,
      'users-access records found.',
    )

    const usersAccesses: UserAccessV2[] = data?.docs || []

    for (const usersAccess of usersAccesses) {
      console.log(`Processing user-access id: ${usersAccess?.id} name: ${usersAccess?.name}...`)

      // Check if this user-access already exists
      const existingItem = await payload.find({
        collection: 'users-access',
        where: {
          old_id: { equals: usersAccess.id },
        },
        limit: 1,
        overrideAccess: true,
        pagination: false,
      })

      if (existingItem?.totalDocs && existingItem.totalDocs > 0) {
        console.log(`user-access with old_id ${usersAccess.id} already exists. Skipping.`)
        continue
      }

      // Generate unique slugs for each access entry
      const nameCounts: Record<string, number> = {}
      const accessWithSlugs = (usersAccess.access || []).map((a) => {
        const base = a?.name || ''
        const count = nameCounts[base] || 0
        nameCounts[base] = count + 1
        const slug = base === '' ? '' : count === 0 ? base : `${base}-${count}`
        return { ...a, slug }
      })

      await payload.create({
        collection: 'users-access',
        data: {
          name: usersAccess.name,
          access: accessWithSlugs,
          old_id: usersAccess.id.toString(),
        },
        overrideAccess: true,
      })

      console.log(`✓ Imported user-access id: ${usersAccess?.id} name: ${usersAccess?.name}`)
    }

    console.log('User-access import completed successfully!')
  } catch (error) {
    console.error('Error importing user-access from v2:', error)
    // throw error
  }
}
