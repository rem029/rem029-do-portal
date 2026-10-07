import type { Payload } from 'payload'

// Personal accounts used for DocuSign sandbox testing - local/dev only.
const DOCUSIGN_TEST_USER_EMAILS = [
  'gamemlrem029@gmail.com',
  'remboyponce@gmail.com',
  'elawrenceponce@gmail.com',
]

export const seedDocuSignTestUsers = async ({ payload }: { payload: Payload }): Promise<void> => {
  if (process.env.NODE_ENV === 'production') return

  for (const email of DOCUSIGN_TEST_USER_EMAILS) {
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      overrideAccess: true,
      pagination: false,
    })

    const existingUser = existing.docs[0]
    if (existingUser) {
      await payload.update({
        collection: 'users',
        id: existingUser.id,
        data: { super_user: true, _verified: true },
        overrideAccess: true,
      })
      payload.logger.info(`✓ DocuSign test user ${email} already exists - ensured super user + verified`)
      continue
    }

    await payload.create({
      collection: 'users',
      data: {
        email,
        password: email,
        super_user: true,
        _verified: true,
      },
      overrideAccess: true,
      disableVerificationEmail: true,
    })
    payload.logger.info(`✓ Created DocuSign test user: ${email}`)
  }
}
