import type { Payload } from 'payload'

const PAYLOAD_FIRST_USER_EMAIL = process.env.PAYLOAD_FIRST_USER_EMAIL || 'admin@payload.com'

export const seedFirstUser = async ({ payload }: { payload: Payload }): Promise<void> => {
  console.log('Creating first user...')

  try {
    // Check if first user already exists
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: { equals: PAYLOAD_FIRST_USER_EMAIL },
      },
      limit: 1,
      overrideAccess: true,
      pagination: false,
    })

    if (existingUser?.totalDocs && existingUser.totalDocs > 0) {
      console.log(`First user with email ${PAYLOAD_FIRST_USER_EMAIL} already exists. Skipping.`)
      return
    }

    await payload.create({
      collection: 'users',
      data: {
        email: PAYLOAD_FIRST_USER_EMAIL,
        password: PAYLOAD_FIRST_USER_EMAIL,
        super_user: true,
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })

    console.log(`✓ Created first user: ${PAYLOAD_FIRST_USER_EMAIL}`)
  } catch (error) {
    console.error('Error creating first user:', error)
    throw error
  }
}
